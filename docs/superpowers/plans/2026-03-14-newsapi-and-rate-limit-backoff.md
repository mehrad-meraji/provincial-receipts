# NewsAPI Integration & Rate-Limit Backoff Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add NewsAPI as a news source and add a DB-backed circuit breaker that skips any scraper source after a 429 response.

**Architecture:** A shared `backoff.ts` utility reads/writes a `SourceBackoff` table in Postgres. Each scraper checks `isBackedOff` before fetching, calls `setBackoff` on 429, and `clearBackoff` on success. A new `newsapi.ts` fetcher integrates alongside existing RSS feeds in `scrapeNews()`.

**Tech Stack:** Prisma 7, axios, `rss-parser`, Vitest, Next.js App Router, Neon PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-14-newsapi-and-rate-limit-backoff-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `SourceBackoff` model |
| Modify | `lib/scraper/rss-sources.ts` | Add `id` slug field to interface + all 5 sources |
| **Create** | `lib/scraper/backoff.ts` | `isBackedOff`, `setBackoff`, `clearBackoff` |
| **Create** | `lib/scraper/newsapi.ts` | Fetch from NewsAPI, return `PendingItem[]` |
| Modify | `lib/scraper/news.ts` | Export `PendingItem`, integrate NewsAPI, add per-RSS backoff |
| Modify | `lib/scraper/bills.ts` | Add top-level + per-item backoff |
| Modify | `lib/scraper/hansard.ts` | Add top-level + per-item backoff |
| Modify | `lib/scraper/mpps.ts` | Add top-level + per-item backoff |
| Modify | `.env.example` | Add `NEWS_API_KEY` |
| **Create** | `tests/lib/scraper/backoff.test.ts` | Unit tests for backoff utility |
| **Create** | `tests/lib/scraper/newsapi.test.ts` | Unit tests for NewsAPI fetcher |

---

## Chunk 1: Schema, RSS Sources, and Backoff Utility

### Task 1: Add `SourceBackoff` to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add the model** to `prisma/schema.prisma` after the `KeywordSuggestion` model:

```prisma
model SourceBackoff {
  source       String   @id
  backoffUntil DateTime
  lastError    String?
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Generate and apply migration locally:**

```bash
npx prisma migrate dev --name add_source_backoff
```

Expected: migration file created under `prisma/migrations/`, Prisma client regenerated.

- [ ] **Commit:**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: add SourceBackoff schema for rate-limit circuit breaker"
```

---

### Task 2: Add `id` slug to `RssSource`

**Files:**
- Modify: `lib/scraper/rss-sources.ts`

- [ ] **Update the interface** — add `id: string` as the first field:

```ts
export interface RssSource {
  id: string         // stable slug used as SourceBackoff.source
  name: string
  url: string
  category: 'politics' | 'toronto' | 'government'
}
```

- [ ] **Add `id` to all five source objects:**

```ts
export const RSS_SOURCES: RssSource[] = [
  {
    id: 'rss-cbc-toronto',
    name: 'CBC Toronto',
    url: 'https://www.cbc.ca/cmlink/rss-canada-toronto',
    category: 'toronto',
  },
  {
    id: 'rss-toronto-star',
    name: 'Toronto Star - Ontario',
    url: 'https://www.thestar.com/search/?f=rss&t=article&c=News/Politics&l=50&s=start_time&sd=desc',
    category: 'politics',
  },
  {
    id: 'rss-globe-and-mail',
    name: "Globe and Mail - Queen's Park",
    url: 'https://www.theglobeandmail.com/feeds/rss/politics/',
    category: 'politics',
  },
  {
    id: 'rss-tvo-today',
    name: 'TVO Today',
    url: 'https://www.tvo.org/rss',
    category: 'politics',
  },
  {
    id: 'rss-ontario-gov',
    name: 'Ontario Government News',
    url: 'https://news.ontario.ca/en/rss',
    category: 'government',
  },
]
```

- [ ] **Run tests to confirm no regressions:**

```bash
pnpm test
```

Expected: all existing tests pass.

- [ ] **Commit:**

```bash
git add lib/scraper/rss-sources.ts
git commit -m "feat: add id slug field to RssSource for backoff tracking"
```

---

### Task 3: Write failing tests for `backoff.ts`

**Files:**
- Create: `tests/lib/scraper/backoff.test.ts`

- [ ] **Create the test file:**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the module under test
vi.mock('@/lib/db', () => ({
  prisma: {
    sourceBackoff: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { isBackedOff, setBackoff, clearBackoff } from '@/lib/scraper/backoff'
import { prisma } from '@/lib/db'

const mockPrisma = prisma as unknown as {
  sourceBackoff: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isBackedOff', () => {
  it('returns false when no record exists', async () => {
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue(null)
    expect(await isBackedOff('test-source')).toBe(false)
  })

  it('returns true when backoffUntil is in the future', async () => {
    const future = new Date(Date.now() + 60_000)
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue({ source: 'test-source', backoffUntil: future })
    expect(await isBackedOff('test-source')).toBe(true)
  })

  it('returns false when backoffUntil is in the past', async () => {
    const past = new Date(Date.now() - 60_000)
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue({ source: 'test-source', backoffUntil: past })
    expect(await isBackedOff('test-source')).toBe(false)
  })

  it('returns false (not throws) when DB call fails', async () => {
    mockPrisma.sourceBackoff.findUnique.mockRejectedValue(new Error('DB down'))
    expect(await isBackedOff('test-source')).toBe(false)
  })
})

describe('setBackoff', () => {
  it('calls upsert with backoffUntil approximately 1 hour from now by default', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source')
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    const backoffUntil: Date = call.create.backoffUntil
    const diffMs = backoffUntil.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(59 * 60 * 1000)
    expect(diffMs).toBeLessThan(61 * 60 * 1000)
  })

  it('stores the error string in lastError', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source', 'Status code 429')
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    expect(call.create.lastError).toBe('Status code 429')
  })

  it('accepts a custom duration', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source', undefined, 2 * 60 * 60 * 1000) // 2 hours
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    const diffMs = call.create.backoffUntil.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(119 * 60 * 1000)
  })
})

describe('clearBackoff', () => {
  it('calls deleteMany with the correct source', async () => {
    mockPrisma.sourceBackoff.deleteMany.mockResolvedValue({ count: 1 })
    await clearBackoff('test-source')
    expect(mockPrisma.sourceBackoff.deleteMany).toHaveBeenCalledWith({
      where: { source: 'test-source' },
    })
  })

  it('is a no-op (no throw) when no record exists', async () => {
    mockPrisma.sourceBackoff.deleteMany.mockResolvedValue({ count: 0 })
    await expect(clearBackoff('test-source')).resolves.not.toThrow()
  })
})
```

- [ ] **Run tests to confirm they fail (module not found):**

```bash
pnpm test tests/lib/scraper/backoff.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scraper/backoff'`

---

### Task 4: Implement `backoff.ts`

**Files:**
- Create: `lib/scraper/backoff.ts`

- [ ] **Create the file:**

```ts
import { prisma } from '@/lib/db'

const DEFAULT_BACKOFF_MS = 60 * 60 * 1000 // 1 hour

export async function isBackedOff(source: string): Promise<boolean> {
  try {
    const record = await prisma.sourceBackoff.findUnique({ where: { source } })
    if (!record) return false
    return record.backoffUntil > new Date()
  } catch {
    // DB unavailable — don't block the scraper
    return false
  }
}

export async function setBackoff(
  source: string,
  error?: string,
  durationMs: number = DEFAULT_BACKOFF_MS
): Promise<void> {
  const backoffUntil = new Date(Date.now() + durationMs)
  await prisma.sourceBackoff.upsert({
    where: { source },
    create: { source, backoffUntil, lastError: error ?? null },
    update: { backoffUntil, lastError: error ?? null },
  })
}

export async function clearBackoff(source: string): Promise<void> {
  await prisma.sourceBackoff.deleteMany({ where: { source } })
}
```

- [ ] **Run tests to confirm they pass:**

```bash
pnpm test tests/lib/scraper/backoff.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Run full test suite to confirm no regressions:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/scraper/backoff.ts tests/lib/scraper/backoff.test.ts
git commit -m "feat: add source backoff utility with DB-backed circuit breaker"
```

---

## Chunk 2: NewsAPI Fetcher

### Task 5: Add `NEWS_API_KEY` to env example

**Files:**
- Modify: `.env.example`

- [ ] **Append to `.env.example`:**

```
# NewsAPI (newsapi.org) — get a free key at newsapi.org/register
NEWS_API_KEY="your_newsapi_key_here"
```

- [ ] **Commit:**

```bash
git add .env.example
git commit -m "chore: add NEWS_API_KEY to env example"
```

---

### Task 6: Write failing tests for `newsapi.ts`

**Files:**
- Create: `tests/lib/scraper/newsapi.test.ts`

- [ ] **Create the test file:**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios')
vi.mock('@/lib/scraper/backoff', () => ({
  isBackedOff: vi.fn().mockResolvedValue(false),
  setBackoff: vi.fn().mockResolvedValue(undefined),
  clearBackoff: vi.fn().mockResolvedValue(undefined),
}))

import axios from 'axios'
import { fetchNewsApiArticles } from '@/lib/scraper/newsapi'
import { isBackedOff, setBackoff, clearBackoff } from '@/lib/scraper/backoff'

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> }
const mockedIsBackedOff = isBackedOff as ReturnType<typeof vi.fn>
const mockedSetBackoff = setBackoff as ReturnType<typeof vi.fn>
const mockedClearBackoff = clearBackoff as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockedIsBackedOff.mockResolvedValue(false)
  process.env.NEWS_API_KEY = 'test-key'
})

describe('fetchNewsApiArticles', () => {
  it('returns empty array when source is backed off', async () => {
    mockedIsBackedOff.mockResolvedValue(true)
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })

  it('returns mapped PendingItems on success', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        status: 'ok',
        articles: [
          {
            title: 'Doug Ford cuts transit funding',
            url: 'https://example.com/article1',
            publishedAt: '2026-03-14T10:00:00Z',
            description: 'Ontario premier slashes GO train budget.',
            content: null,
            source: { name: 'Toronto Star' },
          },
        ],
      },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Doug Ford cuts transit funding')
    expect(result[0].link).toBe('https://example.com/article1')
    expect(result[0].sourceName).toBe('NewsAPI: Toronto Star')
    expect(mockedClearBackoff).toHaveBeenCalledWith('newsapi')
  })

  it('calls setBackoff and returns [] on rateLimited error', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { status: 'error', code: 'rateLimited', message: 'Too many requests' },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedSetBackoff).toHaveBeenCalledWith('newsapi', expect.any(String))
  })

  it('returns [] and does not set backoff on other API errors', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('network error'))
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedSetBackoff).not.toHaveBeenCalled()
  })

  it('filters out articles with no URL', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        status: 'ok',
        articles: [
          { title: 'No URL article', url: null, publishedAt: '2026-03-14T10:00:00Z', description: '', source: { name: 'CBC' } },
          { title: 'Valid article', url: 'https://example.com/valid', publishedAt: '2026-03-14T10:00:00Z', description: '', source: { name: 'CBC' } },
        ],
      },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid article')
  })
})
```

- [ ] **Run tests to confirm they fail:**

```bash
pnpm test tests/lib/scraper/newsapi.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scraper/newsapi'`

---

### Task 7: Export `PendingItem` from `news.ts`

**Files:**
- Modify: `lib/scraper/news.ts`

- [ ] **Export `PendingItem`** — on line 22, change `interface PendingItem` to `export interface PendingItem`. No other changes to the file yet.

- [ ] **Run tests:**

```bash
pnpm test
```

Expected: all existing tests pass.

- [ ] **Commit:**

```bash
git add lib/scraper/news.ts
git commit -m "refactor: export PendingItem interface for use by newsapi fetcher"
```

---

### Task 8: Implement `newsapi.ts`

**Files:**
- Create: `lib/scraper/newsapi.ts`

- [ ] **Create the file:**

```ts
import axios from 'axios'
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
import type { PendingItem } from './news'

const NEWSAPI_URL = 'https://newsapi.org/v2/everything'
const NEWSAPI_QUERY = 'ontario OR "doug ford" OR "queen\'s park" OR "ontario legislature"'
const SOURCE_ID = 'newsapi'

export async function fetchNewsApiArticles(): Promise<PendingItem[]> {
  if (await isBackedOff(SOURCE_ID)) {
    console.warn('[scraper/newsapi] backed off, skipping')
    return []
  }

  try {
    const response = await axios.get(NEWSAPI_URL, {
      params: {
        q: NEWSAPI_QUERY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 25,
        apiKey: process.env.NEWS_API_KEY ?? '',
      },
      timeout: 15_000,
    })

    const data = response.data

    if (data.status === 'error') {
      if (data.code === 'rateLimited') {
        console.warn('[scraper/newsapi] rate limited')
        await setBackoff(SOURCE_ID, `rateLimited: ${data.message}`)
        return []
      }
      console.warn(`[scraper/newsapi] API error: ${data.code} — ${data.message}`)
      return []
    }

    await clearBackoff(SOURCE_ID)

    return (data.articles ?? [])
      .filter((a: { url?: string }) => !!a.url)
      .map((a: { title?: string; url: string; publishedAt?: string; description?: string; content?: string; source?: { name?: string } }) => ({
        title: a.title ?? '',
        link: a.url,
        pubDate: a.publishedAt,
        contentSnippet: a.description ?? '',
        content: a.content ?? '',
        sourceName: `NewsAPI: ${a.source?.name ?? 'Unknown'}`,
      }))
  } catch (err) {
    console.warn(
      `[scraper/newsapi] fetch failed: ${err instanceof Error ? err.message : String(err)}`
    )
    return []
  }
}
```

- [ ] **Run tests to confirm they pass:**

```bash
pnpm test tests/lib/scraper/newsapi.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Run full test suite:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/scraper/newsapi.ts tests/lib/scraper/newsapi.test.ts
git commit -m "feat: add NewsAPI fetcher with backoff integration"
```

---

## Chunk 3: News Scraper Integration

### Task 9: Update `news.ts` — integrate NewsAPI and RSS backoff

**Files:**
- Modify: `lib/scraper/news.ts`

- [ ] **Add imports** at the top of the file (after existing imports):

```ts
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
import { fetchNewsApiArticles } from './newsapi'
```

- [ ] **Replace the `scrapeNews` function body** — the NewsAPI call goes first, then the RSS loop gains per-source backoff. Replace everything from `let fetched = 0` through the end of the RSS loop (lines ~39–75) with:

```ts
  let fetched = 0
  let stored = 0
  let classified = 0

  const allCandidates: PendingItem[] = []

  // --- NewsAPI (runs first, fills initial candidates) ---
  const newsApiArticles = await fetchNewsApiArticles()
  allCandidates.push(...newsApiArticles)
  fetched += newsApiArticles.length

  // --- RSS feeds (fill remaining capacity) ---
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
        const url = item.link ?? ''
        if (!url) continue
        allCandidates.push({
          title: item.title ?? '',
          link: url,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet,
          content: item.content,
          sourceName: source.name,
        })
      }
    } catch (err) {
      const msg = String(err)
      if (msg.includes('Status code 429')) {
        await setBackoff(source.id, msg)
      }
      console.warn(`[scraper/news] Failed to parse feed ${source.url}: ${msg}`)
    }
  }
```

- [ ] **Run tests:**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add lib/scraper/news.ts
git commit -m "feat: integrate NewsAPI and per-source RSS backoff into news scraper"
```

---

## Chunk 4: Bills, Hansard, MPPs Backoff

### Task 10: Add backoff to `bills.ts`

**Files:**
- Modify: `lib/scraper/bills.ts`

- [ ] **Add import** after existing imports:

```ts
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
```

- [ ] **Add top-level backoff check** at the start of `scrapeBillsPage()`, before the `getCurrentParliament()` call:

```ts
  if (await isBackedOff('ola-bills')) {
    console.warn('[scraper/bills] backed off, skipping')
    return { scraped: 0, upserted: 0, page: 0, resetCycle: false }
  }
```

- [ ] **Wrap `fetchBillList`** — surround the call at line ~277 in a try/catch that detects 429:

```ts
  let rows: BillListRow[]
  try {
    rows = await fetchBillList(page, billsPath)
    await clearBackoff('ola-bills')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-bills', String(err))
    }
    throw err
  }
```

Replace the existing `const rows = await fetchBillList(page, billsPath)` line with the above block. The `rows.length === 0` reset-cycle guard that follows on the next line must be preserved — do not delete it.

- [ ] **Add 429 check inside the per-bill catch block** (lines ~363–367). Replace:

```ts
    } catch (err) {
      console.warn(
        `[scraper] Failed to process bill ${row.bill_number}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
```

With:

```ts
    } catch (err) {
      if ((err as any)?.response?.status === 429) {
        await setBackoff('ola-bills', String(err))
        break
      }
      console.warn(
        `[scraper] Failed to process bill ${row.bill_number}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
```

- [ ] **Run tests:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/scraper/bills.ts
git commit -m "feat: add rate-limit backoff to bills scraper"
```

---

### Task 11: Add backoff to `hansard.ts`

**Files:**
- Modify: `lib/scraper/hansard.ts`

- [ ] **Add import** after existing imports:

```ts
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
```

- [ ] **Add top-level backoff check** at the start of `scrapeHansard()`, before `checkRobotsTxt`:

```ts
  if (await isBackedOff('ola-hansard')) {
    console.warn('[scraper/hansard] backed off, skipping')
    return { entries: [] }
  }
```

- [ ] **Wrap `fetchHansardLinks`** — replace the existing call with:

```ts
  let links: HansardLink[]
  try {
    links = await fetchHansardLinks()
    await clearBackoff('ola-hansard')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-hansard', String(err))
    }
    throw err
  }
```

- [ ] **Add 429 check inside the per-document catch block** (lines ~152–156). Replace:

```ts
    } catch (err) {
      console.warn(
        `[scraper/hansard] Failed to fetch document ${link.url}: ${err instanceof Error ? err.message : String(err)}`
      )
      // skip on error — never crash the whole scrape
    }
```

With:

```ts
    } catch (err) {
      if ((err as any)?.response?.status === 429) {
        await setBackoff('ola-hansard', String(err))
        break
      }
      console.warn(
        `[scraper/hansard] Failed to fetch document ${link.url}: ${err instanceof Error ? err.message : String(err)}`
      )
      // skip on error — never crash the whole scrape
    }
```

- [ ] **Run tests:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/scraper/hansard.ts
git commit -m "feat: add rate-limit backoff to hansard scraper"
```

---

### Task 12: Add backoff to `mpps.ts`

**Files:**
- Modify: `lib/scraper/mpps.ts`

- [ ] **Add import** after existing imports:

```ts
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
```

- [ ] **Add top-level backoff check** at the start of `scrapeMpps()`, before `checkRobotsTxt`:

```ts
  if (await isBackedOff('ola-mpps')) {
    console.warn('[scraper/mpps] backed off, skipping')
    return { scraped: 0, upserted: 0 }
  }
```

- [ ] **Wrap `fetchMppList`** — replace the existing call with:

```ts
  let rows: MppListRow[]
  try {
    rows = await fetchMppList()
    await clearBackoff('ola-mpps')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-mpps', String(err))
    }
    throw err
  }
```

- [ ] **Add 429 check inside the per-MPP catch block** (lines ~148–152). Replace:

```ts
    } catch (err) {
      console.warn(
        `[scraper/mpps] Failed to process MPP ${row.name}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
```

With:

```ts
    } catch (err) {
      if ((err as any)?.response?.status === 429) {
        await setBackoff('ola-mpps', String(err))
        break
      }
      console.warn(
        `[scraper/mpps] Failed to process MPP ${row.name}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
```

- [ ] **Run full test suite:**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add lib/scraper/mpps.ts
git commit -m "feat: add rate-limit backoff to MPPs scraper"
```

---

## Deployment

- [ ] Apply schema migration to production Neon DB (run locally targeting production `DATABASE_URL`):

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

- [ ] Add `NEWS_API_KEY` to Vercel environment variables
- [ ] Deploy to Vercel
