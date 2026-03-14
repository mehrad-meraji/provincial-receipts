# Fuck Doug Ford — Design Spec
**Date:** 2026-03-13
**Status:** Approved

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
| Deployment | Vercel (Cron Jobs for scheduling) |
| ASCII art | figlet (Bloody font) — pre-rendered at build time |
| Package manager | pnpm |

---

## Architecture (Option C — Chunked Vercel Cron)

Everything lives in one Next.js repo deployed to Vercel. Scraping is split into paginated chunks so each Vercel function call completes within the function timeout limit. `ScrapeState` in the DB tracks pagination position across invocations.

```
Vercel Cron
    ├─► /api/cron/scrape-bills        every 6 hours
    │       └─ Fetches OLA page chunk N via cheerio
    │          Normalises → upserts to Neon via Prisma
    │          Runs keyword classifier → sets impact_score + tags
    │
    ├─► /api/cron/scrape-news         every 1 hour
    │       └─ Fetches RSS feeds via rss-parser
    │          Calls GitHub Models (GPT-4o-mini) to classify each article
    │          Upserts to Neon via Prisma
    │
    ├─► /api/cron/scrape-hansard      every 24 hours
    │       └─ Fetches latest Hansard transcripts via cheerio
    │          Runs keyword classifier for bill mentions
    │
    └─► /api/cron/discover-keywords   every 7 days
            └─ Finds high-news/low-score bills (missed by keywords)
               Asks GitHub Models to suggest new keyword terms
               Stores in KeywordSuggestion table, auto-promotes at seen_count >= 3

Neon (PostgreSQL) ← Prisma ORM

Next.js App Router (Vercel)
    ├─ app/page.tsx                   Server Component — main dashboard
    ├─ app/bills/[id]/page.tsx        Bill detail page
    ├─ app/mpps/[id]/page.tsx         MPP profile page
    ├─ app/api/bills/route.ts         Public read API
    ├─ app/api/cron/*/route.ts        Cron endpoints (CRON_SECRET gated)
    └─ lib/
        ├─ scraper/                   cheerio + axios scrapers
        │   ├─ bills.ts
        │   ├─ hansard.ts
        │   ├─ rss-sources.ts         ← add new feeds here, nothing else changes
        │   └─ utils.ts               delay(), fetchWithHeaders(), parseRobotsTxt()
        ├─ classifier/
        │   └─ keywords.ts            Weighted keyword taxonomy (editable config)
        └─ ai/
            └─ classify.ts            GitHub Models wrapper (swappable)
```

**Security:** All `/api/cron/*` routes validate `Authorization: Bearer $CRON_SECRET`. Vercel sets this header automatically on cron invocations. Direct external calls are rejected with 401.

**Rate limiting & ethics:**
- 1.5s delay between all outbound HTTP requests
- `User-Agent: FuckDougFord/1.0 (civic transparency; contact@example.com)`
- OLA's public legislative pages permit scraping; robots.txt checked on startup
- Cheerio parses static HTML only — no headless browser, no JavaScript execution

---

## Data Model (Prisma Schema)

```prisma
model Bill {
  id              String    @id @default(cuid())
  bill_number     String    @unique       // "Bill 97"
  title           String
  sponsor         String
  status          String                  // "1st Reading", "Royal Assent", etc.
  date_introduced DateTime?
  reading_stage   String?
  vote_results    Json?                   // { yea: 42, nay: 18, absent: 3 }
  vote_by_party   Json?                   // { "PC": { yea: 42, nay: 0 }, "NDP": { yea: 0, nay: 18 } }
  url             String
  impact_score    Float     @default(0)  // 0–10 keyword score
  tags            String[]               // ["housing", "toronto", "negative"]
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
  topic        String?  // AI-classified: "housing", "transit", "ethics"
  sentiment    String?  // AI-classified: "scandal", "critical", "neutral"
  is_scandal   Boolean  @default(false)
  tags         String[]
  bill         Bill?    @relation(fields: [billId], references: [id])
  billId       String?
  createdAt    DateTime @default(now())
}

model ScrapeState {
  id              String   @id @default("singleton")
  last_bill_page  Int      @default(0)   // chunked pagination cursor
  last_scraped_at DateTime @default(now())
}

model KeywordSuggestion {
  id           String   @id @default(cuid())
  term         String   @unique
  weight       Int                        // AI-suggested 1–4
  category     String                     // matches KEYWORDS bucket
  seen_count   Int      @default(1)       // bills that triggered suggestion
  status       String   @default("pending") // "pending" | "active" | "rejected"
  source_bills String[]                   // bill IDs that triggered suggestion
  createdAt    DateTime @default(now())
}
```

---

## Scraping Sources

### Bills
- **Primary:** `https://www.ola.org/en/legislative-business/bills/current` + `/bills/all`
- **Detail pages:** each bill's OLA URL for vote results + sponsor MPP data
- **Post-Royal Assent:** `https://www.ontario.ca/laws` (e-Laws) for enacted statute text

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
- `https://www.ola.org/en/legislative-business/hansard` — daily transcripts
- Parsed for bill number mentions, cross-referenced to Bill table

---

## Classifier

### Keyword Scoring (bills)
```
score = 0
for each term match in (bill title + sponsor + tags):
    score += tier.weight
    if any NEGATIVE_MODIFIER present in title:
        score *= 1.5
score = Math.min(score, 10)
toronto_flagged = score >= 3
```

**Keyword tiers:**

| Tier | Weight | Example terms |
|---|---|---|
| `direct` | 4 | toronto, city of toronto, ttc, toronto transit commission |
| `toronto_flashpoints` | 3 | bike lanes, ontario place, strong mayor, fourplex, gardiner, scarborough |
| `housing` | 2 | greenbelt, rent, rent control, zoning, official plan, infill, severance |
| `transit` | 2 | transit, subway, lrt, metrolinx, go train, rapid transit |
| `municipal` | 1 | municipal, planning act, conservation authority, omb |

**Negative modifiers (×1.5):** removes, strips, repeals, overrides, eliminates, reduces, cancels, revokes

### AI Classification (news articles)
GitHub Models (GPT-4o-mini) called once per new `NewsEvent`:
```
Classify this Ontario politics news article.
Headline: "{headline}"
Excerpt: "{first 500 chars of body}"

Return JSON: {
  topic: "housing" | "transit" | "ethics" | "environment" | "finance" | "other",
  sentiment: "scandal" | "critical" | "neutral" | "positive",
  is_scandal: boolean,
  tags: string[]
}
```

**Swapping providers** — two lines in `lib/ai/classify.ts`:
```ts
baseURL: 'https://models.inference.ai.azure.com'  // GitHub Models (default)
apiKey: process.env.GITHUB_TOKEN
// → swap to OpenAI, Anthropic, etc. by changing these two values
```

### Keyword Discovery (weekly cron)
1. Query bills where `newsEvents.count >= 2` AND `impact_score < 3` (matters but missed)
2. Send bill titles/summaries + current keyword list to GitHub Models
3. Model suggests new terms + weights + categories
4. Store in `KeywordSuggestion` with `status: "pending"`
5. Auto-promote to `status: "active"` when `seen_count >= 3` across different bills
6. Active suggestions loaded into classifier at runtime alongside static taxonomy

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
TorontoAlert     Red-bordered banner — highest impact_score bill
KPIStrip         4-column ruled grid: Toronto Bills / Active Bills / Scandals / Passed Laws
─── LEGISLATIVE BILLS TRACKER ───────────────────────────────
BillTable        Sortable: Impact (default), Date, Stage, Bill Number
─── SCANDALS & INVESTIGATIONS ───────────────────────────────
ScandalFeed      Stacked news items: source badge + headline + tags
```

### Component Tree
```
app/
├── page.tsx                         Server Component
├── bills/[id]/page.tsx              Bill detail — votes, MPP, linked news
├── mpps/[id]/page.tsx               MPP profile — party, riding, sponsored bills
└── components/
    ├── layout/
    │   ├── Masthead.tsx
    │   ├── DatelineBar.tsx
    │   └── SectionDivider.tsx
    ├── bills/
    │   ├── TorontoAlertBanner.tsx
    │   ├── KPIStrip.tsx
    │   ├── BillTable.tsx            Client Component (sort interactivity)
    │   ├── BillRow.tsx
    │   ├── StatusBadge.tsx
    │   └── ImpactScore.tsx
    ├── news/
    │   ├── ScandalFeed.tsx
    │   └── NewsItem.tsx
    └── mpps/
        ├── MPPCard.tsx
        ├── VoteBreakdown.tsx        Party-by-party vote table
        └── LinkedNews.tsx
```

### Rendering Strategy
- `page.tsx` and all detail pages — **Server Components**, data fetched via Prisma at request time
- `BillTable.tsx` — **Client Component** only for sort state
- No `useEffect` data fetching — all data is server-side

---

## Cron Schedule (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/scrape-bills",        "schedule": "0 */6 * * *"  },
    { "path": "/api/cron/scrape-news",         "schedule": "0 * * * *"    },
    { "path": "/api/cron/scrape-hansard",      "schedule": "0 8 * * *"    },
    { "path": "/api/cron/discover-keywords",   "schedule": "0 9 * * 1"    }
  ]
}
```

---

## Environment Variables

```
DATABASE_URL         Neon PostgreSQL connection string
GITHUB_TOKEN         GitHub personal access token (for GitHub Models)
CRON_SECRET          Vercel auto-sets; validates cron endpoint calls
```

---

## Out of Scope (v1)

- Search
- Filtering by party / topic / date range
- User accounts / notifications
- Admin UI for keyword review (KeywordSuggestion auto-promotes; manual rejection deferred)
- Mobile-optimised layout (desktop-first for v1)
- e-Laws full-text statute parsing (URL stored, deep parse deferred)

---

## Ethical Considerations

- OLA legislative pages are public record; scraping serves public interest journalism
- Rate limiting (1.5s delay) and descriptive User-Agent ensure minimal server impact
- No personal data collected from users
- AI classification is used only on public news text, not private data
- `CRON_SECRET` and `GITHUB_TOKEN` never exposed to client bundles — all AI calls server-side only
- `DATABASE_URL` accessed only in Server Components and API routes, never client-side
