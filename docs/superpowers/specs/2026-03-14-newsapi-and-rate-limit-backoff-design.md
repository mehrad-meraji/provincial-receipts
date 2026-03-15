# NewsAPI Integration & Rate-Limit Backoff — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Overview

Two related features:

1. **NewsAPI integration** — supplement existing RSS feeds with aggregated Canadian politics news from NewsAPI.org
2. **Source backoff circuit breaker** — DB-backed per-source cooldown that skips any source returning a rate-limit error, preventing bans across all scrapers

---

## Schema

New Prisma model added to `prisma/schema.prisma`:

```prisma
model SourceBackoff {
  source       String   @id
  backoffUntil DateTime
  lastError    String?
  updatedAt    DateTime @updatedAt
}
```

`source` is a stable slug identifying the data source. Canonical source IDs:

| Scraper | Source ID |
|---|---|
| RSS: CBC Toronto | `rss-cbc-toronto` |
| RSS: Toronto Star | `rss-toronto-star` |
| RSS: Globe and Mail | `rss-globe-and-mail` |
| RSS: TVO Today | `rss-tvo-today` |
| RSS: Ontario Gov | `rss-ontario-gov` |
| NewsAPI | `newsapi` |
| OLA Bills | `ola-bills` |
| Hansard | `ola-hansard` |
| MPPs | `ola-mpps` |

`rss-sources.ts` gains an `id` field on `RssSource`:

```ts
export interface RssSource {
  id: string         // stable slug, matches source IDs above
  name: string
  url: string
  category: 'politics' | 'toronto' | 'government'
}
```

All five RSS source objects are updated with the explicit `id` values from the table above:
- CBC Toronto → `rss-cbc-toronto`
- Toronto Star - Ontario → `rss-toronto-star`
- Globe and Mail - Queen's Park → `rss-globe-and-mail`
- TVO Today → `rss-tvo-today`
- Ontario Government News → `rss-ontario-gov`

---

## Backoff Utility

**File:** `lib/scraper/backoff.ts`

Imports the shared Prisma client via `import { prisma } from '@/lib/db'`.

Three exported functions:

```ts
isBackedOff(source: string): Promise<boolean>
setBackoff(source: string, error?: string, durationMs?: number): Promise<void>
clearBackoff(source: string): Promise<void>
```

- `isBackedOff` queries `SourceBackoff` for the given source and returns `true` if `backoffUntil > now()`. Wrapped in try/catch — returns `false` on DB error so scrapers continue.
- `setBackoff` upserts a record with `backoffUntil = now() + durationMs` (default: 1 hour). Stores optional error string in `lastError`.
- `clearBackoff` uses `prisma.sourceBackoff.deleteMany` (not `delete`) so it is a safe no-op when no record exists. Called only on successful fetch.

---

## 429 Detection Per Scraper Type

**RSS (`rss-parser`):** The library throws an `Error` with a message containing `"Status code 429"` when the upstream server returns HTTP 429. This is based on `rss-parser`'s internal use of `got` which formats HTTP errors this way. This should be verified during implementation with a quick check of the library source or a test request; if the string differs, update the detection predicate accordingly.

**Axios scrapers** (bills, hansard, mpps): Check `err.response?.status === 429`.

**NewsAPI:** JSON response body has `status: "error"` and `code: "rateLimited"`.

---

## NewsAPI Integration

**File:** `lib/scraper/newsapi.ts`

Uses `axios` (already a dependency — no new npm package required).

`PendingItem` is exported from `lib/scraper/news.ts` (add `export` keyword to the existing interface declaration) and imported by `newsapi.ts`.

Single exported function:

```ts
fetchNewsApiArticles(): Promise<PendingItem[]>
```

- Checks `isBackedOff('newsapi')` first — returns `[]` if backed off
- Calls NewsAPI `/v2/everything` via axios with:
  - `q=ontario OR "doug ford" OR "queen's park" OR "ontario legislature"`
  - `language=en`
  - `sortBy=publishedAt`
  - `pageSize=25`
  - `apiKey` from `process.env.NEWS_API_KEY`
- On success: calls `clearBackoff('newsapi')`, returns articles as `PendingItem[]`
- On `rateLimited` error (`response.data.code === "rateLimited"`): calls `setBackoff('newsapi')`, returns `[]`
- On other errors: logs warning, returns `[]` (does not set backoff)

**Environment variable:** `NEWS_API_KEY` — added to `.env.example`

**Integration in `lib/scraper/news.ts`:**

`fetchNewsApiArticles()` is called **first** (before the RSS loop). Its results are pushed into `allCandidates`, and `fetched` is incremented by the result length. The RSS loop then fills remaining capacity. The existing `allCandidates.length >= MAX_NEW_ARTICLES` break conditions inside the RSS loop **must be preserved** — they enforce the cap for the RSS portion.

```ts
const newsApiArticles = await fetchNewsApiArticles()
allCandidates.push(...newsApiArticles)
fetched += newsApiArticles.length

for (const source of RSS_SOURCES) {
  if (allCandidates.length >= MAX_NEW_ARTICLES) break
  // ... existing RSS loop with backoff checks added (see below)
}
```

Deduplication is handled by the existing `NewsEvent.url` unique constraint — no additional work needed.

---

## Backoff Integration in RSS Loop (`news.ts`)

Each RSS source is checked and guarded individually using `source.id`:

```ts
for (const source of RSS_SOURCES) {
  if (allCandidates.length >= MAX_NEW_ARTICLES) break

  if (await isBackedOff(source.id)) {
    console.warn(`[scraper/news] ${source.name} backed off, skipping`)
    continue
  }

  try {
    const feed = await parser.parseURL(source.url)
    await clearBackoff(source.id)

    for (const item of feed.items ?? []) {
      if (allCandidates.length >= MAX_NEW_ARTICLES) break
      fetched++
      // ... existing item push logic
    }
  } catch (err) {
    if (String(err).includes('Status code 429')) {
      await setBackoff(source.id, String(err))
    }
    console.warn(`[scraper/news] Failed to parse feed ${source.url}: ${err}`)
  }
}
```

A single feed being backed off does not skip the others.

---

## Backoff Integration in Bills, Hansard, and MPPs Scrapers

All three scrapers have inner per-item loops with catch blocks that swallow errors. The 429 check must be applied at the inner catch level. After calling `setBackoff`, break out of the inner loop so no further items are attempted on a rate-limited source.

**Pattern for bills.ts (per-item catch):**

```ts
} catch (err) {
  if ((err as any)?.response?.status === 429) {
    await setBackoff('ola-bills', String(err))
    break  // stop processing further items — source is rate-limited
  }
  console.warn(`[scraper/bills] failed for bill ${billNumber}: ${err}`)
}
```

**Same pattern applies to `hansard.ts`** (per-document catch) and **`mpps.ts`** (per-row catch — `mpps.ts` also has an inner `for (const row of rows)` loop, not a top-level catch). Use `'ola-hansard'` and `'ola-mpps'` respectively.

Each scraper also checks `isBackedOff` at the top before starting:

```ts
if (await isBackedOff('ola-bills')) {
  console.warn('[scraper/bills] backed off, skipping')
  return emptyResult
}
```

After `setBackoff` and `break`, the scraper returns its partial results. On the next cron run, `isBackedOff` returns `true` and the scraper is skipped entirely until the backoff expires.

---

## Files Changed

| Action | File |
|---|---|
| New | `lib/scraper/backoff.ts` |
| New | `lib/scraper/newsapi.ts` |
| Modified | `lib/scraper/news.ts` (export `PendingItem`, integrate NewsAPI + `fetched` increment, add per-RSS-source backoff checks) |
| Modified | `lib/scraper/bills.ts` (top-level + per-item backoff) |
| Modified | `lib/scraper/hansard.ts` (top-level + per-item backoff) |
| Modified | `lib/scraper/mpps.ts` (top-level + per-item backoff) |
| Modified | `lib/scraper/rss-sources.ts` (add `id` field to interface and all five source objects) |
| Modified | `prisma/schema.prisma` |
| Modified | `.env.example` |

---

## Deployment Notes

Two-step process:

**1. Locally** — generate the migration file:
```bash
npx prisma migrate dev --name add_source_backoff
```

**2. Production (Neon DB)** — apply the generated migration:
```bash
npx prisma migrate deploy
```

Run `migrate deploy` against the production Neon DB before deploying the new scraper code to Vercel. The new `SourceBackoff` table starts empty; scrapers will populate it on first rate-limit hit.

---

## Out of Scope

- Configurable backoff durations per source
- Admin UI to view/clear backoff state
- Retry-after header parsing (use fixed 1hr default)
- NewsAPI replacing any existing RSS feeds
