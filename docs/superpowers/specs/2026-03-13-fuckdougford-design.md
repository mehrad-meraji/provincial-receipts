# Fuck Doug Ford — Design Spec
**Date:** 2026-03-13
**Status:** Final

---

## Overview

A civic accountability dashboard tracking Ontario Government Bills and government scandals, built as a high-performance Next.js application. The site presents like a newspaper front page — editorial serif typography, warm cream background, ProPublica-red urgency accents, and an ASCII "FUCK DOUG / FORD" masthead in the Bloody figlet font.

**Pipeline summary:**
`Vercel Cron → Scrape (cheerio/rss-parser) → Normalise → Classify (keywords + GitHub Models AI) → Upsert (Prisma/Neon) → Render (Next.js Server Components)`

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Neon (PostgreSQL) via Prisma ORM |
| Scraping | axios + cheerio (HTML), rss-parser (RSS feeds) |
| AI classifier | GitHub Models (GPT-4o-mini) — swappable via two-line config |
| Deployment | Vercel Pro (60s function timeout) |
| ASCII art | figlet (Bloody font) — pre-rendered at build time |
| Package manager | pnpm |

---

## Architecture (Option C — Chunked Vercel Cron)

Everything lives in one Next.js repo deployed to Vercel Pro. Scraping is split into paginated chunks so each Vercel function call completes within the **60-second Pro function timeout**. `ScrapeState` in the DB tracks pagination position across invocations.

```
Vercel Cron
    ├─► /api/cron/scrape-bills        every 6 hours
    │       └─ Fetches 1 OLA page per invocation (≈20 bill rows + detail pages)
    │          Normalises → upserts to Neon via Prisma
    │          Runs keyword classifier → sets impact_score + tags
    │          Advances ScrapeState.last_bill_page cursor
    │
    ├─► /api/cron/scrape-news         every 1 hour
    │       └─ Fetches all RSS feeds via rss-parser (one invocation, no pagination)
    │          Deduplicates against existing NewsEvent URLs
    │          Caps at 25 NEW articles per invocation (overflow processed next run)
    │          Calls GitHub Models (GPT-4o-mini) to classify each new article
    │          Attempts bill linkage via bill number regex scan
    │          Upserts to Neon via Prisma
    │
    ├─► /api/cron/scrape-hansard      every 24 hours
    │       └─ Fetches only the LATEST Hansard transcript page (no pagination cursor)
    │          Scans for bill number mentions → updates Bill.tags with "hansard-mention"
    │
    ├─► /api/cron/discover-keywords   every 7 days (Monday 9am)
    │       └─ Finds high-news/low-score bills (missed by keywords)
    │          Asks GitHub Models to suggest new keyword terms + weights
    │          Inserts/increments KeywordSuggestion rows
    │          Auto-promotes terms with seen_count >= 3 to status="active"
    │
    └─► /api/cron/scrape-mpps         every 7 days (Monday 8am)
            └─ Scrapes OLA MPP roster page for full profiles
               Upserts MPP rows (name, party, riding, email, URL)
               Sets toronto_area flag via hardcoded GTA riding list

Neon (PostgreSQL) ← Prisma ORM

Next.js App Router (Vercel)
    ├─ app/page.tsx                   Server Component — main dashboard
    ├─ app/bills/[id]/page.tsx        Bill detail page
    ├─ app/mpps/[id]/page.tsx         MPP profile page
    ├─ app/api/bills/route.ts         Public read API
    ├─ app/api/cron/*/route.ts        Cron endpoints (CRON_SECRET gated)
    └─ lib/
        ├─ scraper/
        │   ├─ bills.ts
        │   ├─ hansard.ts
        │   ├─ mpps.ts               Scrapes OLA MPP roster page for full profiles
        │   ├─ rss-sources.ts        ← add new feeds here, nothing else changes
        │   └─ utils.ts              delay(), fetchWithHeaders(), checkRobotsTxt()
        │                            checkRobotsTxt() called at top of scrape-bills,
        │                            scrape-hansard, and scrape-mpps (all OLA scrapers)
        ├─ classifier/
        │   └─ keywords.ts           Weighted keyword taxonomy + DB suggestion loader
        └─ ai/
            └─ classify.ts           GitHub Models wrapper (swappable)
```

### Chunk Sizing (Bills)

OLA's `/bills/current` page renders approximately 20 bill rows per page. Each cron invocation:
1. Reads `ScrapeState.last_bill_page` (0-indexed)
2. Fetches that page from OLA (1 HTTP request + up to 20 detail page requests at 1.5s delay each = ≈30s max)
3. Upserts results, then increments `last_bill_page`
4. If the fetched page returns 0 rows (past end of list), resets cursor to 0 (full re-scan complete)

Target: completes within **45s** to leave headroom inside the 60s Pro timeout.

### Classifier Integration

The keyword classifier is called once per cron invocation (not per bill). At the start of each `scrape-bills` run:
1. Load static keyword taxonomy from `lib/classifier/keywords.ts`
2. Query `KeywordSuggestion WHERE status = 'active'` from DB — merge into active taxonomy
3. Apply combined taxonomy to all bills processed in that invocation

`seen_count` on `KeywordSuggestion` is incremented by the `discover-keywords` cron each time it identifies the same suggested term appearing in an additional bill (not by the bill scraper).

### Error Handling

- If an AI call fails → log error, skip AI classification for that item, continue scraping (do not throw)
- If a detail page 404s → upsert bill with available data, mark `last_scraped = now()`, continue
- If DB times out mid-chunk → return HTTP 500; Vercel will retry the cron invocation; cursor was not advanced so the same page is re-processed (idempotent upserts handle duplicates safely)
- Cron returns HTTP 200 only on full success; HTTP 500 on unrecoverable errors triggers Vercel retry

### Security

All `/api/cron/*` routes validate `Authorization: Bearer $CRON_SECRET`. **`CRON_SECRET` must be manually created by the developer and set in Vercel project environment variables** — Vercel does not generate this automatically. Once set in Vercel's dashboard, Vercel automatically forwards it as an `Authorization` header on cron invocations. Direct external calls without the secret are rejected with 401.

### Rate Limiting & Ethics

- 1.5s delay between all outbound HTTP requests (`utils.ts → delay()`)
- `User-Agent: FuckDougFord/1.0 (civic transparency project; contact@YOUR_EMAIL.com)` — **replace before first deployment**
- `robots.txt` checked at the beginning of each OLA scraper invocation (`scrape-bills`, `scrape-hansard`, `scrape-mpps`); if OLA disallows scraping, cron returns HTTP 200 with a log message and skips that run
- OLA's public legislative pages are public record and permit scraping; check is a courtesy safeguard
- Cheerio parses static HTML only — no headless browser, no JavaScript execution

---

## Data Model (Prisma Schema)

```prisma
model Bill {
  id              String    @id @default(cuid())
  bill_number     String    @unique       // "Bill 97"
  title           String
  sponsor         String
  status          String                  // "1st Reading", "2nd Reading", "Royal Assent", etc.
  date_introduced DateTime?
  reading_stage   String?
  vote_results    Json?                   // { yea: 42, nay: 18, absent: 3 }
  vote_by_party   Json?                   // { "PC": { yea: 42, nay: 0 }, "NDP": { yea: 0, nay: 18 } }
  url             String
  impact_score    Float     @default(0)  // 0–10 keyword score
  tags            String[]               // ["housing", "toronto", "negative", "hansard-mention"]
  toronto_flagged Boolean   @default(false)
  last_scraped    DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sponsor_mpp     MPP?      @relation(fields: [sponsorMppId], references: [id])
  sponsorMppId    String?
  newsEvents      NewsEvent[]
}

model MPP {
  id           String   @id @default(cuid())
  name         String
  party        String   // "PC", "NDP", "Liberal", "Green", "Independent"
  riding       String   // "Etobicoke North", "Don Valley East", etc.
  email        String?
  url          String?  // OLA member page URL
  toronto_area Boolean  @default(false)  // riding is in Toronto/GTA
  bills        Bill[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model NewsEvent {
  id           String   @id @default(cuid())
  headline     String
  url          String   @unique
  source       String   // "CBC", "The Narwhal", "Toronto Star"
  published_at DateTime
  topic        String?  // AI-classified: "housing", "transit", "ethics", "environment", "finance", "other"
  sentiment    String?  // AI-classified: "scandal", "critical", "neutral", "positive"
  is_scandal   Boolean  @default(false)
  tags         String[]
  bill         Bill?    @relation(fields: [billId], references: [id])
  billId       String?  // linked via bill number regex scan of headline + excerpt
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ScrapeState {
  id                String   @id @default("singleton")
  last_bill_page    Int      @default(0)   // chunked pagination cursor for scrape-bills
  // Hansard: no cursor — fetches only the latest transcript page per run
  last_scraped_at   DateTime @default(now())
}

model KeywordSuggestion {
  id           String   @id @default(cuid())
  term         String   @unique
  weight       Int                            // AI-suggested 1–4
  category     String                         // matches KEYWORDS taxonomy bucket
  seen_count   Int      @default(1)           // number of different bills that triggered this term
  status       String   @default("pending")   // "pending" | "active" | "rejected"
  source_bills String[]                       // bill IDs that triggered the suggestion
  createdAt    DateTime @default(now())
}
```

**Note on `ScrapeState` seeding:** `scrape-bills` uses `upsert` on the singleton row on every invocation — no manual seeding required. Prisma migration does not need to pre-insert this row.

---

## Scraping Sources

### Bills
- **Primary:** `https://www.ola.org/en/legislative-business/bills/current` + `/bills/all`
- **Detail pages:** each bill's OLA URL for vote results + sponsor MPP data
- **Post-Royal Assent:** `https://www.ontario.ca/laws` (e-Laws) — URL stored in `Bill.url`; full statute text parsing deferred to v2

### MPP Roster
- **Source:** `https://www.ola.org/en/members/all` — scraped by `lib/scraper/mpps.ts`
- Populates full MPP profiles (name, party, riding, email, URL) independent of bill sponsorship
- `toronto_area` flag set by matching riding name against a hardcoded list of Toronto/GTA ridings
- MPP roster scraper runs via `/api/cron/scrape-mpps` every Monday at 8am (see Cron Schedule)

### News / Scandals (RSS)
```ts
export const RSS_SOURCES = [
  { name: 'CBC Politics',      url: 'https://www.cbc.ca/cmlink/rss-politics' },
  { name: 'CBC Ontario',       url: 'https://www.cbc.ca/cmlink/rss-canada-toronto' },
  { name: 'The Narwhal',       url: 'https://thenarwhal.ca/feed/' },
  { name: 'Toronto Star',      url: 'https://www.thestar.com/search/?f=rss&t=article&q=ontario+government' },
  { name: 'Global News ON',    url: 'https://globalnews.ca/ontario/feed/' },
  { name: 'TVO Today',         url: 'https://www.tvo.org/rss.xml' },
]
// Add new sources here — pipeline picks them up automatically on next run
```

### Hansard
- `https://www.ola.org/en/legislative-business/hansard` — latest transcript page only (no archive pagination)
- Scans transcript text for bill number pattern `/Bill \d+/i`
- On match: adds `"hansard-mention"` to `Bill.tags` via Prisma `update` (does not alter `impact_score`)

---

## Classifier

### Keyword Scoring (bills)
```
score = 0
// Classifier reads ONLY scraper-sourced fields — never reads tags it wrote itself.
// Ordering: (1) score computed from title + sponsor + pre-existing scraper tags,
//           (2) impact_score + new tags written to DB after scoring is complete.
for each term match in (bill.title + bill.sponsor + bill.tags_from_scraper):
    score += tier.weight
    if any NEGATIVE_MODIFIER present in bill.title:
        score *= 1.5
score = Math.min(score, 10)
toronto_flagged = score >= 3
topic = highest-weight category that had a match
// "toronto_flagged" requires a score >= 3, meaning at minimum:
//   one direct term (weight 4), one flashpoint (weight 3), or two housing/transit terms (weight 2+2).
//   Three municipal-only matches (3×1=3) also qualify — acceptable for a civic accountability tool.
```

**Keyword tiers (static config + DB-loaded active suggestions merged at runtime):**

| Tier | Weight | Example terms |
|---|---|---|
| `direct` | 4 | toronto, city of toronto, ttc, toronto transit commission |
| `toronto_flashpoints` | 3 | bike lanes, ontario place, strong mayor, fourplex, gardiner, scarborough |
| `housing` | 2 | greenbelt, rent, rent control, zoning, official plan, infill, severance |
| `transit` | 2 | transit, subway, lrt, metrolinx, go train, rapid transit |
| `municipal` | 1 | municipal, planning act, conservation authority, omb |

**Negative modifiers (×1.5 multiplier):** removes, strips, repeals, overrides, eliminates, reduces, cancels, revokes

### AI Classification (news articles)
GitHub Models (GPT-4o-mini) called once per new `NewsEvent`:

```
Classify this Ontario provincial politics news article.
Headline: "{headline}"
Excerpt: "{first 500 characters of article body}"

Return valid JSON only, no prose:
{
  "topic": "housing" | "transit" | "ethics" | "environment" | "finance" | "other",
  "sentiment": "scandal" | "critical" | "neutral" | "positive",
  "is_scandal": boolean,
  "tags": string[]
}
```

**Bill linkage:** After AI classification, scan headline + excerpt for `/Bill \d+/i`. If matched, look up `Bill.bill_number` in DB and set `NewsEvent.billId`. No AI call needed for this step.

**Swapping providers** — two lines in `lib/ai/classify.ts`:
```ts
baseURL: 'https://models.inference.ai.azure.com'  // GitHub Models (default)
apiKey: process.env.GITHUB_TOKEN
// → swap to OpenAI, Anthropic, etc. by changing these two values
```

### Keyword Discovery (weekly cron)

**Trigger query:** bills where `newsEvents.count >= 2` AND `impact_score < 3` (matters in news but our keywords missed it).

**AI prompt template:**
```
You are helping maintain a keyword taxonomy for an Ontario politics accountability tracker.

The following bills received significant news coverage but scored low on our Toronto-impact keyword system.
Bills: {JSON array of { bill_number, title, tags }}
// Note: uses Bill.title and Bill.tags (scraper-sourced) — no summary field exists in schema

Current keyword list: {JSON array of all active terms}

Suggest new terms that are politically significant for Toronto residents and are NOT already in the list.
Return valid JSON only:
[{ "term": string, "weight": 1|2|3|4, "category": "direct"|"toronto_flashpoints"|"housing"|"transit"|"municipal" }]
```

**Promotion flow:**
1. For each suggested term: if `KeywordSuggestion` row exists → increment `seen_count` and append bill ID to `source_bills`; else insert new row with `seen_count: 1`
2. After all suggestions processed: `UPDATE KeywordSuggestion SET status = 'active' WHERE seen_count >= 3 AND status = 'pending'`
3. Active suggestions are loaded by the classifier at the start of the next `scrape-bills` run

---

## Frontend

### Visual Design
- **Background:** `#faf9f7` (warm cream)
- **Primary text:** `#1a1a1a`
- **Accent / alert:** `#c8102e` (ProPublica red)
- **Body serif:** Georgia
- **UI / data:** system sans-serif
- **Masthead font:** Bloody (figlet) — pre-rendered static string, monospace `5.8px`
- **"FUCK DOUG":** `#1a1a1a` | **"FORD":** `#c8102e`

### Page Structure (top to bottom)
```
Masthead         ASCII "FUCK DOUG" (black) + "FORD" (red)
DatelineBar      Date · ● LIVE UPDATES · "42 Active Bills · 8 Toronto-Flagged"
TorontoAlert     Red-bordered banner — highest toronto_flagged bill by impact_score (non-Royal Assent)
KPIStrip         4-column ruled grid: Toronto Bills / Active Bills / Scandals / Passed Laws
─── LEGISLATIVE BILLS TRACKER ───────────────────────────────
BillTable        Server pre-sorted by impact_score DESC; client re-sorts on column click
                 Sortable columns: Impact Score (default ↓), Bill Number (↑), Date Introduced (↓), Stage (alpha)
                 Tie-breaking: bill_number ASC. Sort state is component-local (not reflected in URL, v1).
─── SCANDALS & INVESTIGATIONS ───────────────────────────────
ScandalFeed      Stacked news items: source badge + headline + tags (capped at 20 most recent)
```

**KPI definitions:**
- **Toronto Bills:** `COUNT(bills WHERE toronto_flagged = true)`
- **Active Bills:** `COUNT(bills WHERE status NOT IN ('Royal Assent', 'Proclaimed in Force', 'Withdrawn'))`
- **Scandals:** `COUNT(newsEvents WHERE is_scandal = true AND published_at > now() - 30 days)`
- **ScandalFeed query:** `newsEvents WHERE is_scandal = true ORDER BY published_at DESC LIMIT 20`
- **Passed Laws:** `COUNT(bills WHERE status IN ('Royal Assent', 'Proclaimed in Force'))`

**TorontoAlertBanner query:** Highest `impact_score` bill where `toronto_flagged = true` AND `status NOT IN ('Royal Assent', 'Proclaimed in Force', 'Withdrawn')`. If no such bill exists, banner is hidden.

### Component Tree
```
app/
├── page.tsx                         Server Component
├── bills/[id]/page.tsx              Bill detail — votes, MPP, linked news
├── mpps/[id]/page.tsx               MPP profile — party, riding, sponsored bills
└── components/
    ├── layout/
    │   ├── Masthead.tsx             Static ASCII string rendered in <pre>
    │   ├── DatelineBar.tsx
    │   └── SectionDivider.tsx
    ├── bills/
    │   ├── TorontoAlertBanner.tsx
    │   ├── KPIStrip.tsx
    │   ├── BillTable.tsx            Client Component — receives pre-sorted bills as props, re-sorts on click
    │   ├── BillRow.tsx
    │   ├── StatusBadge.tsx          blue=reading stages, green=Royal Assent, amber=committee, grey=withdrawn
    │   └── ImpactScore.tsx          ▼ 8.4 red if toronto_flagged, — 2.1 grey otherwise
    ├── news/
    │   ├── ScandalFeed.tsx
    │   └── NewsItem.tsx
    └── mpps/
        ├── MPPCard.tsx              Name, party, riding, toronto_area flag
        ├── VoteBreakdown.tsx        Party-by-party vote table from vote_by_party JSON
        └── LinkedNews.tsx           NewsEvents linked to bills sponsored by this MPP
```

### Rendering Strategy
- All pages — **Server Components** by default, Prisma queries at request time
- `BillTable.tsx` — **Client Component** only for sort state; receives `bills[]` as props pre-sorted by `impact_score DESC`
- No `useEffect` data fetching anywhere

---

## Cron Schedule (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/scrape-bills",        "schedule": "0 */6 * * *"  },
    { "path": "/api/cron/scrape-news",         "schedule": "0 * * * *"    },
    { "path": "/api/cron/scrape-hansard",      "schedule": "0 8 * * *"    },
    { "path": "/api/cron/scrape-mpps",         "schedule": "0 8 * * 1"    },
    { "path": "/api/cron/discover-keywords",   "schedule": "0 9 * * 1"    }
  ]
}
```

---

## Environment Variables

```
DATABASE_URL         Neon PostgreSQL connection string (pooled for Vercel serverless)
GITHUB_TOKEN         GitHub personal access token (for GitHub Models AI)
CRON_SECRET          Developer-created secret — must be manually set in Vercel project env vars.
                     Vercel forwards it automatically as Authorization header on cron calls.
                     Generate with: openssl rand -base64 32
```

---

## Out of Scope (v1)

- Search
- Filtering by party / topic / date range
- Admin UI for manual keyword suggestion review
- User accounts / notifications / email alerts
- Mobile-optimised layout (desktop-first for v1)
- e-Laws full-text statute parsing (URL stored, parsing deferred)
- Hansard archive scraping (latest transcript only)

---

## Ethical Considerations

- OLA legislative pages are public record; scraping serves public interest journalism
- Rate limiting (1.5s delay) and descriptive User-Agent ensure minimal server impact — **replace `contact@YOUR_EMAIL.com` with a real address before first deployment**
- `robots.txt` checked at start of each `scrape-bills` run; scraping skipped if disallowed
- No personal data collected from site visitors
- AI classification applied only to public news text, never to private data
- `CRON_SECRET`, `GITHUB_TOKEN`, and `DATABASE_URL` never exposed to client bundles — all sensitive calls are server-side only
