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

---

## Backoff Utility

**File:** `lib/scraper/backoff.ts`

Three exported functions:

```ts
isBackedOff(source: string): Promise<boolean>
setBackoff(source: string, error?: string, durationMs?: number): Promise<void>
clearBackoff(source: string): Promise<void>
```

- `isBackedOff` queries `SourceBackoff` for the given source and returns `true` if `backoffUntil > now()`
- `setBackoff` upserts a record with `backoffUntil = now() + durationMs` (default: 1 hour). Stores optional error string in `lastError`
- `clearBackoff` deletes the record for the source if it exists

**Usage pattern in each scraper:**

```ts
if (await isBackedOff('ola-bills')) {
  console.warn('[scraper/bills] backed off, skipping')
  return emptyResult
}

try {
  const data = await fetch(...)
  await clearBackoff('ola-bills')
} catch (err) {
  if (is429(err)) await setBackoff('ola-bills', String(err))
  throw err
}
```

**429 detection per scraper type:**

- **RSS (`rss-parser`)** — thrown error message contains `"Status code 429"`
- **Axios scrapers** (bills, hansard, mpps) — `err.response?.status === 429`
- **NewsAPI** — JSON response body has `status: "error"` and `code: "rateLimited"`

---

## NewsAPI Integration

**File:** `lib/scraper/newsapi.ts`

Single exported function:

```ts
fetchNewsApiArticles(): Promise<PendingItem[]>
```

- Checks `isBackedOff('newsapi')` first — returns `[]` if backed off
- Calls NewsAPI `/v2/everything` with:
  - `q=ontario OR "doug ford" OR "queen's park" OR "ontario legislature"`
  - `language=en`
  - `sortBy=publishedAt`
  - `pageSize=25`
- On success: calls `clearBackoff('newsapi')`, returns articles as `PendingItem[]`
- On `rateLimited` error: calls `setBackoff('newsapi')`, returns `[]`
- On other errors: logs warning, returns `[]`

**Environment variable:** `NEWS_API_KEY` — added to `.env.example`

**Integration in `lib/scraper/news.ts`:**

`scrapeNews()` calls `fetchNewsApiArticles()` and merges results into `allCandidates` alongside RSS. Combined list still capped at `MAX_NEW_ARTICLES = 25`. Deduplication is handled by the existing `NewsEvent.url` unique constraint — no additional work needed.

---

## Backoff Integration Per Scraper

Each scraper gets the same treatment:

| File | Source ID | 429 detection |
|---|---|---|
| `lib/scraper/news.ts` (per RSS source) | `rss-{slug}` | `err.message` contains `"Status code 429"` |
| `lib/scraper/newsapi.ts` | `newsapi` | `response.code === "rateLimited"` |
| `lib/scraper/bills.ts` | `ola-bills` | `err.response?.status === 429` |
| `lib/scraper/hansard.ts` | `ola-hansard` | `err.response?.status === 429` |
| `lib/scraper/mpps.ts` | `ola-mpps` | `err.response?.status === 429` |

For RSS sources, each feed is checked individually (not the entire news scraper). A single feed being backed off does not skip the others.

---

## Error Handling

- Backoff DB calls are non-fatal — if `isBackedOff` or `setBackoff` throws (e.g. DB unavailable), scrapers continue as if not backed off
- NewsAPI errors other than rate-limit are logged as warnings and return empty results — they do not set backoff
- Backoff duration defaults to 1 hour; no configurability needed for now

---

## Files Changed

| Action | File |
|---|---|
| New | `lib/scraper/backoff.ts` |
| New | `lib/scraper/newsapi.ts` |
| Modified | `lib/scraper/news.ts` |
| Modified | `lib/scraper/bills.ts` |
| Modified | `lib/scraper/hansard.ts` |
| Modified | `lib/scraper/mpps.ts` |
| Modified | `lib/scraper/rss-sources.ts` (add `id` slug field) |
| Modified | `prisma/schema.prisma` |
| Modified | `.env.example` |

---

## Out of Scope

- Configurable backoff durations per source
- Admin UI to view/clear backoff state
- Retry-after header parsing (use fixed 1hr default)
- NewsAPI replacing any existing RSS feeds
