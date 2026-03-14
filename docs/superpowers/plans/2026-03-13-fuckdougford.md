# Fuck Doug Ford — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a civic accountability dashboard that scrapes Ontario Legislature bills and political scandal news, classifies them for Toronto impact, and presents them as a newspaper-style Next.js site.

**Architecture:** Five Vercel Cron jobs feed a Neon/PostgreSQL database via Prisma — bill scraper (chunked pagination), news RSS scraper (AI-classified), Hansard scraper, MPP roster scraper, and a weekly keyword discovery job. A Next.js App Router frontend renders everything as Server Components with a single Client Component for table sorting.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma, Neon PostgreSQL, axios, cheerio, rss-parser, figlet, Vitest, OpenAI SDK (pointing at GitHub Models)

---

## File Map

```
prisma/
  schema.prisma                          # DB schema (Bills, MPP, NewsEvent, ScrapeState, KeywordSuggestion)

lib/
  db.ts                                  # Prisma client singleton (prevents hot-reload connection exhaustion)
  scraper/
    utils.ts                             # delay(), fetchWithHeaders(), checkRobotsTxt(), normaliseText()
    rss-sources.ts                       # RSS_SOURCES config array
    bills.ts                             # OLA bill list page + detail page scraper → NormalisedBill[]
    mpps.ts                              # OLA MPP roster scraper → NormalisedMPP[]
    hansard.ts                           # OLA Hansard latest-page scraper → bill number mentions
    news.ts                              # RSS feed fetcher + deduplication → RawArticle[]
  classifier/
    keywords.ts                          # KEYWORDS taxonomy + NEGATIVE_MODIFIERS + loadActiveSuggestions()
    score.ts                             # scoreBill(bill, taxonomy) → { impact_score, tags, topic, toronto_flagged }
  ai/
    classify.ts                          # classifyArticle(headline, excerpt) → ArticleClassification
    discover.ts                          # discoverKeywords(bills, currentTerms) → KeywordSuggestion[]

app/
  layout.tsx                             # Root layout: fonts, metadata, body class
  globals.css                            # Tailwind base styles
  page.tsx                               # Dashboard — Server Component
  bills/
    [id]/
      page.tsx                           # Bill detail — Server Component
  mpps/
    [id]/
      page.tsx                           # MPP profile — Server Component
  api/
    bills/
      route.ts                           # GET /api/bills — public read API
    cron/
      scrape-bills/
        route.ts                         # POST — bills cron handler
      scrape-news/
        route.ts                         # POST — news cron handler
      scrape-hansard/
        route.ts                         # POST — hansard cron handler
      scrape-mpps/
        route.ts                         # POST — mpps cron handler
      discover-keywords/
        route.ts                         # POST — keyword discovery cron handler

  components/
    layout/
      Masthead.tsx                       # <pre> with pre-rendered ASCII art
      DatelineBar.tsx                    # Date + LIVE pill + bill counts
      SectionDivider.tsx                 # Ruled section header
    bills/
      TorontoAlertBanner.tsx             # Highest-impact active Toronto bill
      KPIStrip.tsx                       # 4-column stat grid
      BillTable.tsx                      # 'use client' — sortable table
      BillRow.tsx                        # Single bill row
      StatusBadge.tsx                    # Coloured reading-stage badge
      ImpactScore.tsx                    # ▼ 8.4 or — 2.1
    news/
      ScandalFeed.tsx                    # List of scandal items
      NewsItem.tsx                       # Source badge + headline + tags
    mpps/
      MPPCard.tsx                        # Name, party, riding, GTA flag
      VoteBreakdown.tsx                  # Party-by-party vote table
      LinkedNews.tsx                     # NewsEvents linked to this MPP's bills

vercel.json                              # Cron schedule
.env.example                            # Documented env vars (no secrets)

tests/
  lib/
    classifier/
      score.test.ts                      # Unit tests for scoring algorithm
    scraper/
      utils.test.ts                      # Unit tests for normaliseText(), delay()
    ai/
      classify.test.ts                   # Unit tests for response parsing
```

---

## Chunk 1: Foundation — Dependencies, DB Schema, Base Utilities

### Task 1: Install dependencies and set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1.1: Install runtime dependencies**

```bash
cd /Users/mehrad/Projects/meh-labs/fuckdougford
pnpm add @prisma/client prisma axios cheerio rss-parser openai
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 1.2: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 1.3: Create test setup file**

Create `tests/setup.ts`:

```ts
// Global test setup — add any mocks or env vars needed across all tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'
process.env.GITHUB_TOKEN = 'test-token'
process.env.CRON_SECRET = 'test-secret'
```

- [ ] **Step 1.4: Add test script to package.json**

Add to the `scripts` section in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 1.5: Run tests to confirm Vitest works (no tests yet — expect 0 passing)**

```bash
pnpm test
```
Expected: `No test files found` or `0 tests passed`.

- [ ] **Step 1.6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts tests/setup.ts
git commit -m "feat: install dependencies and configure Vitest"
```

---

### Task 2: Prisma schema and DB client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 2.1: Initialise Prisma**

```bash
pnpm dlx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`.

- [ ] **Step 2.2: Write the schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Bill {
  id              String      @id @default(cuid())
  bill_number     String      @unique
  title           String
  sponsor         String
  status          String
  date_introduced DateTime?
  reading_stage   String?
  vote_results    Json?
  vote_by_party   Json?
  url             String
  impact_score    Float       @default(0)
  tags            String[]
  toronto_flagged Boolean     @default(false)
  last_scraped    DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  sponsor_mpp     MPP?        @relation(fields: [sponsorMppId], references: [id])
  sponsorMppId    String?
  newsEvents      NewsEvent[]
}

model MPP {
  id           String   @id @default(cuid())
  name         String
  party        String
  riding       String
  email        String?
  url          String?
  toronto_area Boolean  @default(false)
  bills        Bill[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model NewsEvent {
  id           String   @id @default(cuid())
  headline     String
  url          String   @unique
  source       String
  published_at DateTime
  topic        String?
  sentiment    String?
  is_scandal   Boolean  @default(false)
  tags         String[]
  bill         Bill?    @relation(fields: [billId], references: [id])
  billId       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ScrapeState {
  id              String   @id @default("singleton")
  last_bill_page  Int      @default(0)
  last_scraped_at DateTime @default(now())
}

model KeywordSuggestion {
  id           String   @id @default(cuid())
  term         String   @unique
  weight       Int
  category     String
  seen_count   Int      @default(1)
  status       String   @default("pending")
  source_bills String[]
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2.3: Create the Prisma client singleton**

Create `lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2.4: Generate Prisma client**

```bash
pnpm dlx prisma generate
```

Expected: `Generated Prisma Client`.

- [ ] **Step 2.5: Set up Neon and run migration**

1. Create a Neon project at [neon.tech](https://neon.tech) (free tier)
2. Copy the connection string into `.env` as `DATABASE_URL`
3. Use the **pooled** connection string (Neon provides two — use `?pgbouncer=true` version for serverless)

```bash
pnpm dlx prisma migrate dev --name init
```

Expected: Migration applied, all five tables created.

- [ ] **Step 2.6: Commit**

```bash
git add prisma/schema.prisma lib/db.ts
git commit -m "feat: add Prisma schema and DB client singleton"
```

---

### Task 3: Scraper utilities

**Files:**
- Create: `lib/scraper/utils.ts`
- Create: `tests/lib/scraper/utils.test.ts`

- [ ] **Step 3.1: Write failing tests for `normaliseText` and `delay`**

Create `tests/lib/scraper/utils.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { normaliseText, delay, buildHeaders } from '@/lib/scraper/utils'

describe('normaliseText', () => {
  it('trims whitespace and collapses internal spaces', () => {
    expect(normaliseText('  Bill  97  ')).toBe('Bill 97')
  })

  it('returns empty string for blank input', () => {
    expect(normaliseText('   ')).toBe('')
  })
})

describe('buildHeaders', () => {
  it('includes a User-Agent string', () => {
    const headers = buildHeaders()
    expect(headers['User-Agent']).toContain('FuckDougFord')
  })
})

describe('delay', () => {
  it('resolves after approximately the given ms', async () => {
    const start = Date.now()
    await delay(50)
    expect(Date.now() - start).toBeGreaterThanOrEqual(40)
  })
})
```

- [ ] **Step 3.2: Run tests — confirm they fail**

```bash
pnpm test tests/lib/scraper/utils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scraper/utils'`

- [ ] **Step 3.3: Implement utils**

Create `lib/scraper/utils.ts`:

```ts
import robotsParser from 'robots-parser'
import axios from 'axios'

export const USER_AGENT =
  'FuckDougFord/1.0 (civic transparency project; contact@YOUR_EMAIL.com)'

export function normaliseText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function buildHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-CA,en;q=0.9',
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROBOTS_CACHE: Map<string, { allowed: boolean; checkedAt: number }> = new Map()
const ROBOTS_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
  const cached = ROBOTS_CACHE.get(baseUrl)
  if (cached && Date.now() - cached.checkedAt < ROBOTS_TTL_MS) {
    return cached.allowed
  }

  try {
    const { data } = await axios.get(`${baseUrl}/robots.txt`, {
      headers: buildHeaders(),
      timeout: 5000,
    })
    const robots = robotsParser(`${baseUrl}/robots.txt`, data)
    const allowed = robots.isAllowed(path, USER_AGENT) !== false
    ROBOTS_CACHE.set(baseUrl, { allowed, checkedAt: Date.now() })
    return allowed
  } catch {
    // If robots.txt is unreachable, assume allowed
    return true
  }
}
```

> **Note:** `robots-parser` must be installed:
> ```bash
> pnpm add robots-parser
> pnpm add -D @types/robots-parser
> ```

- [ ] **Step 3.4: Run tests — confirm they pass**

```bash
pnpm test tests/lib/scraper/utils.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
git add lib/scraper/utils.ts tests/lib/scraper/utils.test.ts
git commit -m "feat: add scraper utilities (delay, headers, robots.txt check)"
```

---

### Task 4: Keyword classifier and scoring

**Files:**
- Create: `lib/classifier/keywords.ts`
- Create: `lib/classifier/score.ts`
- Create: `tests/lib/classifier/score.test.ts`

- [ ] **Step 4.1: Write failing tests for the scoring algorithm**

Create `tests/lib/classifier/score.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { scoreBill } from '@/lib/classifier/score'
import type { BillInput } from '@/lib/classifier/score'

describe('scoreBill', () => {
  it('scores zero for a bill with no keyword matches', () => {
    const bill: BillInput = { title: 'An Act to amend the Corporations Act', sponsor: 'Ted Arnott', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBe(0)
    expect(result.toronto_flagged).toBe(false)
  })

  it('scores a direct Toronto match at weight 4', () => {
    const bill: BillInput = { title: 'City of Toronto Amendment Act', sponsor: 'Doug Ford', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBeGreaterThanOrEqual(4)
    expect(result.toronto_flagged).toBe(true)
  })

  it('applies 1.5x multiplier when title contains a negative modifier', () => {
    const bill: BillInput = { title: 'An Act to Remove Bike Lanes in Toronto', sponsor: 'Doug Ford', scraperTags: [] }
    const result = scoreBill(bill)
    // "bike lanes" (3) + "toronto" (4) = 7, × 1.5 = 10.5, capped at 10
    expect(result.impact_score).toBe(10)
    expect(result.toronto_flagged).toBe(true)
  })

  it('caps score at 10', () => {
    const bill: BillInput = { title: 'Toronto Transit TTC Bike Lanes Greenbelt Zoning Rent', sponsor: 'x', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBe(10)
  })

  it('does not read classifier-written tags — only scraperTags', () => {
    // scraperTags should be the ONLY tags passed to scorer
    const bill: BillInput = { title: 'Generic Act', sponsor: 'x', scraperTags: ['housing'] }
    const result = scoreBill(bill)
    // "housing" is not a keyword term — scraperTags are matched against keyword terms
    expect(result.impact_score).toBe(0)
  })

  it('returns a topic for matched category', () => {
    const bill: BillInput = { title: 'Ontario Greenbelt Protection Act', sponsor: 'x', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.topic).toBe('housing')
  })
})
```

- [ ] **Step 4.2: Run tests — confirm they fail**

```bash
pnpm test tests/lib/classifier/score.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/classifier/score'`

- [ ] **Step 4.3: Implement the keyword taxonomy**

Create `lib/classifier/keywords.ts`:

```ts
import { prisma } from '@/lib/db'

export type KeywordCategory =
  | 'direct'
  | 'toronto_flashpoints'
  | 'housing'
  | 'transit'
  | 'municipal'

export interface KeywordTier {
  weight: number
  terms: string[]
}

export const STATIC_KEYWORDS: Record<KeywordCategory, KeywordTier> = {
  direct: {
    weight: 4,
    terms: ['toronto', 'city of toronto', 'ttc', 'toronto transit commission'],
  },
  toronto_flashpoints: {
    weight: 3,
    terms: [
      'bike lanes', 'ontario place', 'strong mayor', 'fourplex',
      'gardiner', 'scarborough', 'eg west', 'bloor',
    ],
  },
  housing: {
    weight: 2,
    terms: [
      'greenbelt', 'rent', 'rent control', 'zoning', 'official plan',
      'infill', 'severance', 'residential intensification',
    ],
  },
  transit: {
    weight: 2,
    terms: ['transit', 'subway', 'lrt', 'metrolinx', 'go train', 'rapid transit'],
  },
  municipal: {
    weight: 1,
    terms: ['municipal', 'planning act', 'conservation authority', 'omb', 'lpat'],
  },
}

export const NEGATIVE_MODIFIERS = [
  'removes', 'strips', 'repeals', 'overrides', 'eliminates',
  'reduces', 'cancels', 'revokes',
]

export type Taxonomy = Record<string, { weight: number; category: KeywordCategory }>

/** Build a flat term→weight lookup from static config + any active DB suggestions */
export function buildStaticTaxonomy(): Taxonomy {
  const taxonomy: Taxonomy = {}
  for (const [category, tier] of Object.entries(STATIC_KEYWORDS)) {
    for (const term of tier.terms) {
      taxonomy[term] = { weight: tier.weight, category: category as KeywordCategory }
    }
  }
  return taxonomy
}

/** Load active keyword suggestions from DB and merge with static taxonomy */
export async function loadTaxonomy(): Promise<Taxonomy> {
  const taxonomy = buildStaticTaxonomy()

  try {
    const active = await prisma.keywordSuggestion.findMany({
      where: { status: 'active' },
    })
    for (const suggestion of active) {
      taxonomy[suggestion.term] = {
        weight: suggestion.weight,
        category: suggestion.category as KeywordCategory,
      }
    }
  } catch {
    // If DB is unreachable, fall back to static taxonomy
  }

  return taxonomy
}
```

- [ ] **Step 4.4: Implement the scoring algorithm**

Create `lib/classifier/score.ts`:

```ts
import { buildStaticTaxonomy, NEGATIVE_MODIFIERS } from './keywords'
import type { Taxonomy } from './keywords'

export interface BillInput {
  title: string
  sponsor: string
  scraperTags: string[]  // tags from the scraper only — never classifier-written tags
}

export interface ScoreResult {
  impact_score: number
  tags: string[]
  topic: string | null
  toronto_flagged: boolean
}

export function scoreBill(bill: BillInput, taxonomy?: Taxonomy): ScoreResult {
  const t = taxonomy ?? buildStaticTaxonomy()
  const searchText = [bill.title, bill.sponsor, ...bill.scraperTags]
    .join(' ')
    .toLowerCase()
  const titleLower = bill.title.toLowerCase()

  let score = 0
  const matchedTags: string[] = []
  const categoryCounts: Record<string, number> = {}

  for (const [term, { weight, category }] of Object.entries(t)) {
    if (searchText.includes(term)) {
      score += weight
      matchedTags.push(category)
      categoryCounts[category] = (categoryCounts[category] ?? 0) + weight
    }
  }

  const hasNegativeModifier = NEGATIVE_MODIFIERS.some((mod) =>
    titleLower.includes(mod)
  )
  if (hasNegativeModifier && score > 0) {
    score *= 1.5
    matchedTags.push('negative')
  }

  score = Math.min(score, 10)
  score = Math.round(score * 10) / 10

  // Determine primary topic by highest accumulated weight
  const topic =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  const toronto_flagged = score >= 3

  const tags = [...new Set(matchedTags)]
  if (toronto_flagged) tags.push('toronto')

  return { impact_score: score, tags, topic, toronto_flagged }
}
```

- [ ] **Step 4.5: Run tests — confirm they pass**

```bash
pnpm test tests/lib/classifier/score.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 4.6: Commit**

```bash
git add lib/classifier/keywords.ts lib/classifier/score.ts tests/lib/classifier/score.test.ts
git commit -m "feat: add keyword taxonomy and bill scoring algorithm"
```

---

### Task 5: AI classify wrapper

**Files:**
- Create: `lib/ai/classify.ts`
- Create: `tests/lib/ai/classify.test.ts`

- [ ] **Step 5.1: Write failing tests for the response parser**

Create `tests/lib/ai/classify.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseClassification } from '@/lib/ai/classify'

describe('parseClassification', () => {
  it('parses a valid AI response', () => {
    const raw = JSON.stringify({
      topic: 'housing',
      sentiment: 'scandal',
      is_scandal: true,
      tags: ['greenbelt', 'conflict of interest'],
    })
    const result = parseClassification(raw)
    expect(result.topic).toBe('housing')
    expect(result.is_scandal).toBe(true)
    expect(result.tags).toContain('greenbelt')
  })

  it('returns safe defaults for malformed JSON', () => {
    const result = parseClassification('not json at all')
    expect(result.topic).toBe('other')
    expect(result.is_scandal).toBe(false)
    expect(result.sentiment).toBe('neutral')
  })

  it('returns safe defaults for a JSON object missing fields', () => {
    const result = parseClassification(JSON.stringify({ topic: 'transit' }))
    expect(result.topic).toBe('transit')
    expect(result.is_scandal).toBe(false)
  })
})
```

- [ ] **Step 5.2: Run tests — confirm they fail**

```bash
pnpm test tests/lib/ai/classify.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/ai/classify'`

- [ ] **Step 5.3: Implement the AI classifier**

Create `lib/ai/classify.ts`:

```ts
import OpenAI from 'openai'

// Swap provider by changing these two values:
const AI_BASE_URL = 'https://models.inference.ai.azure.com'  // GitHub Models
const AI_MODEL = 'gpt-4o-mini'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: AI_BASE_URL,
      apiKey: process.env.GITHUB_TOKEN ?? '',
    })
  }
  return _client
}

export interface ArticleClassification {
  topic: 'housing' | 'transit' | 'ethics' | 'environment' | 'finance' | 'other'
  sentiment: 'scandal' | 'critical' | 'neutral' | 'positive'
  is_scandal: boolean
  tags: string[]
}

const DEFAULTS: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
}

export function parseClassification(raw: string): ArticleClassification {
  try {
    const parsed = JSON.parse(raw)
    return {
      topic: parsed.topic ?? DEFAULTS.topic,
      sentiment: parsed.sentiment ?? DEFAULTS.sentiment,
      is_scandal: parsed.is_scandal ?? DEFAULTS.is_scandal,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

const PROMPT_TEMPLATE = (headline: string, excerpt: string) => `
Classify this Ontario provincial politics news article.
Headline: "${headline}"
Excerpt: "${excerpt}"

Return valid JSON only, no prose:
{
  "topic": "housing" | "transit" | "ethics" | "environment" | "finance" | "other",
  "sentiment": "scandal" | "critical" | "neutral" | "positive",
  "is_scandal": boolean,
  "tags": string[]
}
`.trim()

export async function classifyArticle(
  headline: string,
  excerpt: string
): Promise<ArticleClassification> {
  try {
    const response = await getClient().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(headline, excerpt) }],
      temperature: 0,
      max_tokens: 200,
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return parseClassification(raw)
  } catch (err) {
    console.error('[classify] AI call failed:', err)
    return { ...DEFAULTS }
  }
}

/** Extract bill number from text using regex, e.g. "Bill 97" → "Bill 97" */
export function extractBillNumber(text: string): string | null {
  const match = text.match(/Bill\s+(\d+)/i)
  return match ? `Bill ${match[1]}` : null
}
```

- [ ] **Step 5.4: Run tests — confirm they pass**

```bash
pnpm test tests/lib/ai/classify.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5.5: Run all tests**

```bash
pnpm test
```

Expected: All tests pass (utils + score + classify = ~12 tests).

- [ ] **Step 5.6: Commit**

```bash
git add lib/ai/classify.ts tests/lib/ai/classify.test.ts
git commit -m "feat: add AI article classifier with GitHub Models (swappable)"
```

---

## Chunk 2: Scraping Pipeline

### Task 6: RSS sources config + news scraper

**Files:**
- Create: `lib/scraper/rss-sources.ts`
- Create: `lib/scraper/news.ts`

- [ ] **Step 6.1: Create RSS sources config**

Create `lib/scraper/rss-sources.ts`:

```ts
export interface RssSource {
  name: string
  url: string
}

export const RSS_SOURCES: RssSource[] = [
  { name: 'CBC Politics',   url: 'https://www.cbc.ca/cmlink/rss-politics' },
  { name: 'CBC Ontario',    url: 'https://www.cbc.ca/cmlink/rss-canada-toronto' },
  { name: 'The Narwhal',    url: 'https://thenarwhal.ca/feed/' },
  { name: 'Toronto Star',   url: 'https://www.thestar.com/search/?f=rss&t=article&q=ontario+government' },
  { name: 'Global News ON', url: 'https://globalnews.ca/ontario/feed/' },
  { name: 'TVO Today',      url: 'https://www.tvo.org/rss.xml' },
]
```

- [ ] **Step 6.2: Create news scraper**

Create `lib/scraper/news.ts`:

```ts
import Parser from 'rss-parser'
import { RSS_SOURCES } from './rss-sources'
import { buildHeaders } from './utils'

export interface RawArticle {
  headline: string
  url: string
  source: string
  published_at: Date
  excerpt: string
}

const parser = new Parser({
  headers: buildHeaders(),
  timeout: 10000,
})

const ONTARIO_KEYWORDS = [
  'ontario', 'ford', 'queen\'s park', 'toronto', 'doug ford',
  'provincial', 'legislature', 'mpp', 'minister',
]

function isOntarioRelevant(title: string, content: string): boolean {
  const text = (title + ' ' + content).toLowerCase()
  return ONTARIO_KEYWORDS.some((kw) => text.includes(kw))
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const articles: RawArticle[] = []

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)
      for (const item of feed.items ?? []) {
        if (!item.link || !item.title) continue
        if (!isOntarioRelevant(item.title, item.contentSnippet ?? '')) continue

        articles.push({
          headline: item.title.trim(),
          url: item.link,
          source: source.name,
          published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
          excerpt: (item.contentSnippet ?? '').slice(0, 500),
        })
      }
    } catch (err) {
      console.error(`[news] Failed to fetch ${source.name}:`, err)
    }
  }

  return articles
}
```

- [ ] **Step 6.3: Commit**

```bash
git add lib/scraper/rss-sources.ts lib/scraper/news.ts
git commit -m "feat: add RSS sources config and news scraper"
```

---

### Task 7: OLA Bill scraper

**Files:**
- Create: `lib/scraper/bills.ts`

- [ ] **Step 7.1: Create the bill scraper**

Create `lib/scraper/bills.ts`:

```ts
import axios from 'axios'
import * as cheerio from 'cheerio'
import { buildHeaders, delay, normaliseText } from './utils'

const OLA_BASE = 'https://www.ola.org'
const BILLS_PAGE = '/en/legislative-business/bills/current'
const REQUEST_DELAY_MS = 1500

export interface NormalisedBill {
  bill_number: string    // "Bill 97"
  title: string
  sponsor: string
  status: string
  reading_stage: string | null
  date_introduced: Date | null
  url: string
  vote_results: { yea: number; nay: number; absent: number } | null
  vote_by_party: Record<string, { yea: number; nay: number; absent?: number }> | null
  sponsor_mpp_url: string | null  // OLA MPP page URL for cross-reference
}

export async function scrapeBillsPage(page: number): Promise<NormalisedBill[]> {
  const url = `${OLA_BASE}${BILLS_PAGE}?page=${page}`
  const { data } = await axios.get<string>(url, {
    headers: buildHeaders(),
    timeout: 15000,
  })

  const $ = cheerio.load(data)
  const bills: NormalisedBill[] = []

  // OLA bill list renders as a table or dl — selector may need adjustment
  // after inspecting the live page. Current OLA structure (2025):
  $('table.bills-list tbody tr, .view-bills .views-row').each((_, el) => {
    const $el = $(el)

    const billNumberText = normaliseText($el.find('.bill-number, td:nth-child(1)').text())
    const title = normaliseText($el.find('.bill-title, td:nth-child(2)').text())
    const sponsor = normaliseText($el.find('.bill-sponsor, td:nth-child(3)').text())
    const status = normaliseText($el.find('.bill-status, td:nth-child(4)').text())
    const detailHref = $el.find('a').first().attr('href') ?? ''

    if (!billNumberText || !title) return

    bills.push({
      bill_number: billNumberText,
      title,
      sponsor,
      status,
      reading_stage: parseReadingStage(status),
      date_introduced: null,  // populated from detail page
      url: detailHref.startsWith('http') ? detailHref : `${OLA_BASE}${detailHref}`,
      vote_results: null,
      vote_by_party: null,
      sponsor_mpp_url: null,
    })
  })

  return bills
}

export async function scrapeBillDetail(bill: NormalisedBill): Promise<NormalisedBill> {
  await delay(REQUEST_DELAY_MS)

  try {
    const { data } = await axios.get<string>(bill.url, {
      headers: buildHeaders(),
      timeout: 15000,
    })
    const $ = cheerio.load(data)

    // Date introduced
    const dateText = normaliseText($('.date-introduced, .field--name-field-date-intro').text())
    if (dateText) {
      const parsed = new Date(dateText)
      if (!isNaN(parsed.getTime())) bill.date_introduced = parsed
    }

    // Sponsor MPP link
    const mppHref = $('a[href*="/members/"]').first().attr('href')
    if (mppHref) {
      bill.sponsor_mpp_url = mppHref.startsWith('http') ? mppHref : `${OLA_BASE}${mppHref}`
    }

    // Vote results — present only after 3rd reading
    const voteTable = $('table.vote-results, .field--name-field-vote-results table')
    if (voteTable.length) {
      bill.vote_results = parseVoteTable($, voteTable)
      bill.vote_by_party = parseVoteByParty($, voteTable)
    }
  } catch (err) {
    console.error(`[bills] Detail page fetch failed for ${bill.bill_number}:`, err)
  }

  return bill
}

function parseReadingStage(status: string): string | null {
  const s = status.toLowerCase()
  if (s.includes('1st')) return '1st Reading'
  if (s.includes('2nd')) return '2nd Reading'
  if (s.includes('3rd')) return '3rd Reading'
  if (s.includes('royal assent')) return 'Royal Assent'
  if (s.includes('committee')) return 'Committee'
  if (s.includes('withdrawn')) return 'Withdrawn'
  if (s.includes('proclaimed')) return 'Proclaimed in Force'
  return null
}

function parseVoteTable(
  $: cheerio.CheerioAPI,
  table: cheerio.Cheerio<cheerio.Element>
): { yea: number; nay: number; absent: number } {
  const rows: Record<string, number> = {}
  table.find('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length >= 2) {
      const label = normaliseText($(cells[0]).text()).toLowerCase()
      const value = parseInt(normaliseText($(cells[1]).text()), 10)
      if (!isNaN(value)) rows[label] = value
    }
  })
  return {
    yea: rows['yea'] ?? rows['yes'] ?? 0,
    nay: rows['nay'] ?? rows['no'] ?? 0,
    absent: rows['absent'] ?? rows['paired'] ?? 0,
  }
}

function parseVoteByParty(
  $: cheerio.CheerioAPI,
  table: cheerio.Cheerio<cheerio.Element>
): Record<string, { yea: number; nay: number }> {
  // OLA may not always break votes by party — return empty object if not found
  const result: Record<string, { yea: number; nay: number }> = {}
  // Look for party breakdown columns; format varies by bill — best-effort parse
  table.find('th').each((i, header) => {
    const party = normaliseText($(header).text())
    if (['PC', 'NDP', 'Liberal', 'Green', 'Independent'].includes(party)) {
      result[party] = { yea: 0, nay: 0 }
    }
  })
  return result
}
```

- [ ] **Step 7.2: Commit**

```bash
git add lib/scraper/bills.ts
git commit -m "feat: add OLA bill list and detail page scraper"
```

---

### Task 8: MPP roster scraper

**Files:**
- Create: `lib/scraper/mpps.ts`

- [ ] **Step 8.1: Create the MPP scraper**

Create `lib/scraper/mpps.ts`:

```ts
import axios from 'axios'
import * as cheerio from 'cheerio'
import { buildHeaders, normaliseText } from './utils'

const OLA_BASE = 'https://www.ola.org'
const MEMBERS_PAGE = '/en/members/all'

export interface NormalisedMPP {
  name: string
  party: string
  riding: string
  email: string | null
  url: string
  toronto_area: boolean
}

// Ridings that are inside the City of Toronto or inner GTA
const TORONTO_GTA_RIDINGS = new Set([
  'Beaches-East York', 'Davenport', 'Don Valley East', 'Don Valley North',
  'Don Valley West', 'Eglinton-Lawrence', 'Etobicoke Centre', 'Etobicoke-Lakeshore',
  'Etobicoke North', 'Humber River-Black Creek', 'Mississauga–Erin Mills',
  'Mississauga East-Cooksville', 'Mississauga-Lakeshore', 'Mississauga-Malton',
  'Mississauga-Streetsville', 'Oakville', 'Parkdale-High Park', 'Scarborough-Agincourt',
  'Scarborough Centre', 'Scarborough East', 'Scarborough-Guildwood',
  'Scarborough-Rouge Park', 'Scarborough Southwest', 'Spadina-Fort York',
  'St. Paul\'s', 'Thornhill', 'Toronto Centre', 'Toronto-Danforth',
  'Toronto-St. Paul\'s', 'University-Rosedale', 'Willowdale', 'York Centre',
  'York-Simcoe', 'York South-Weston',
])

export async function scrapeMPPRoster(): Promise<NormalisedMPP[]> {
  const { data } = await axios.get<string>(`${OLA_BASE}${MEMBERS_PAGE}`, {
    headers: buildHeaders(),
    timeout: 15000,
  })

  const $ = cheerio.load(data)
  const mpps: NormalisedMPP[] = []

  // OLA members page lists MPPs in a table or card grid
  $('table.members-list tbody tr, .view-members .views-row').each((_, el) => {
    const $el = $(el)
    const name = normaliseText($el.find('.member-name, td:nth-child(1)').text())
    const party = normaliseText($el.find('.member-party, td:nth-child(3)').text())
    const riding = normaliseText($el.find('.member-riding, td:nth-child(2)').text())
    const href = $el.find('a').first().attr('href') ?? ''
    const url = href.startsWith('http') ? href : `${OLA_BASE}${href}`

    if (!name) return

    // Normalise party names
    const normalisedParty = normaliseParty(party)

    mpps.push({
      name,
      party: normalisedParty,
      riding,
      email: null,  // Not available on roster page; would need individual MPP page scrape
      url,
      toronto_area: TORONTO_GTA_RIDINGS.has(riding),
    })
  })

  return mpps
}

function normaliseParty(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('progressive conservative') || s.includes(' pc')) return 'PC'
  if (s.includes('ndp') || s.includes('new democratic')) return 'NDP'
  if (s.includes('liberal')) return 'Liberal'
  if (s.includes('green')) return 'Green'
  return 'Independent'
}
```

- [ ] **Step 8.2: Commit**

```bash
git add lib/scraper/mpps.ts
git commit -m "feat: add OLA MPP roster scraper"
```

---

### Task 9: Hansard scraper

**Files:**
- Create: `lib/scraper/hansard.ts`

- [ ] **Step 9.1: Create the Hansard scraper**

Create `lib/scraper/hansard.ts`:

```ts
import axios from 'axios'
import * as cheerio from 'cheerio'
import { buildHeaders, normaliseText } from './utils'

const OLA_BASE = 'https://www.ola.org'
const HANSARD_PAGE = '/en/legislative-business/hansard'

export interface HansardMention {
  bill_number: string  // "Bill 97"
  context: string      // surrounding sentence for logging
}

export async function scrapeLatestHansard(): Promise<HansardMention[]> {
  // Step 1: Get latest transcript URL from the Hansard index
  const { data: indexHtml } = await axios.get<string>(`${OLA_BASE}${HANSARD_PAGE}`, {
    headers: buildHeaders(),
    timeout: 15000,
  })

  const $index = cheerio.load(indexHtml)
  const latestHref = $index('.views-row a, table.hansard-list a').first().attr('href')

  if (!latestHref) {
    console.error('[hansard] Could not find latest transcript link')
    return []
  }

  const transcriptUrl = latestHref.startsWith('http')
    ? latestHref
    : `${OLA_BASE}${latestHref}`

  // Step 2: Fetch and parse the transcript
  const { data: transcriptHtml } = await axios.get<string>(transcriptUrl, {
    headers: buildHeaders(),
    timeout: 15000,
  })

  const $ = cheerio.load(transcriptHtml)
  const fullText = normaliseText($('body').text())
  const mentions: HansardMention[] = []
  const seen = new Set<string>()

  // Find all "Bill NNN" mentions
  const regex = /Bill\s+(\d+)/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(fullText)) !== null) {
    const billNumber = `Bill ${match[1]}`
    if (seen.has(billNumber)) continue
    seen.add(billNumber)

    // Extract up to 200 chars of surrounding context
    const start = Math.max(0, match.index - 100)
    const end = Math.min(fullText.length, match.index + 100)
    const context = fullText.slice(start, end).replace(/\s+/g, ' ')

    mentions.push({ bill_number: billNumber, context })
  }

  return mentions
}
```

- [ ] **Step 9.2: Commit**

```bash
git add lib/scraper/hansard.ts
git commit -m "feat: add Hansard latest-transcript scraper"
```

---

### Task 10: Keyword discovery AI module

**Files:**
- Create: `lib/ai/discover.ts`

- [ ] **Step 10.1: Create the keyword discovery module**

Create `lib/ai/discover.ts`:

```ts
import OpenAI from 'openai'
import { parseClassification } from './classify'

const AI_BASE_URL = 'https://models.inference.ai.azure.com'
const AI_MODEL = 'gpt-4o-mini'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ baseURL: AI_BASE_URL, apiKey: process.env.GITHUB_TOKEN ?? '' })
  return _client
}

export interface SuggestedKeyword {
  term: string
  weight: 1 | 2 | 3 | 4
  category: 'direct' | 'toronto_flashpoints' | 'housing' | 'transit' | 'municipal'
}

interface BillSummary {
  bill_number: string
  title: string
  tags: string[]
}

export async function discoverKeywords(
  bills: BillSummary[],
  currentTerms: string[]
): Promise<SuggestedKeyword[]> {
  if (bills.length === 0) return []

  const prompt = `
You are helping maintain a keyword taxonomy for an Ontario politics accountability tracker.

The following bills received significant news coverage but scored low on our Toronto-impact keyword system.
Bills: ${JSON.stringify(bills)}

Current keyword list: ${JSON.stringify(currentTerms)}

Suggest new terms that are politically significant for Toronto residents and are NOT already in the list.
Return valid JSON only:
[{ "term": string, "weight": 1|2|3|4, "category": "direct"|"toronto_flashpoints"|"housing"|"transit"|"municipal" }]
`.trim()

  try {
    const response = await getClient().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 500,
    })

    const raw = response.choices[0]?.message?.content ?? '[]'
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is SuggestedKeyword =>
        typeof item.term === 'string' &&
        [1, 2, 3, 4].includes(item.weight) &&
        ['direct', 'toronto_flashpoints', 'housing', 'transit', 'municipal'].includes(item.category)
    )
  } catch (err) {
    console.error('[discover] AI call failed:', err)
    return []
  }
}
```

- [ ] **Step 10.2: Commit**

```bash
git add lib/ai/discover.ts
git commit -m "feat: add keyword discovery AI module"
```

---

## Chunk 3: Cron API Routes

### Task 11: Cron authentication middleware

**Files:**
- Create: `lib/cron-auth.ts`

- [ ] **Step 11.1: Create auth helper**

Create `lib/cron-auth.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'

export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    console.error('[cron-auth] CRON_SECRET env var is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  return null  // null = authenticated, proceed
}
```

- [ ] **Step 11.2: Commit**

```bash
git add lib/cron-auth.ts
git commit -m "feat: add cron secret authentication middleware"
```

---

### Task 12: `scrape-bills` cron route

**Files:**
- Create: `app/api/cron/scrape-bills/route.ts`

- [ ] **Step 12.1: Create the route**

Create `app/api/cron/scrape-bills/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { scrapeBillsPage, scrapeBillDetail } from '@/lib/scraper/bills'
import { checkRobotsTxt } from '@/lib/scraper/utils'
import { scoreBill } from '@/lib/classifier/score'
import { loadTaxonomy } from '@/lib/classifier/keywords'
import { delay } from '@/lib/scraper/utils'

const OLA_BASE = 'https://www.ola.org'

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  // robots.txt check
  const allowed = await checkRobotsTxt(OLA_BASE, '/en/legislative-business/bills/current')
  if (!allowed) {
    console.log('[scrape-bills] robots.txt disallows scraping — skipping')
    return NextResponse.json({ skipped: true, reason: 'robots.txt' })
  }

  // Load current page cursor
  const state = await prisma.scrapeState.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', last_bill_page: 0 },
    update: {},
  })

  const page = state.last_bill_page

  try {
    // Load taxonomy once for this invocation
    const taxonomy = await loadTaxonomy()

    // Scrape the page
    const bills = await scrapeBillsPage(page)

    if (bills.length === 0) {
      // Past end of list — reset cursor for full re-scan
      await prisma.scrapeState.update({
        where: { id: 'singleton' },
        data: { last_bill_page: 0, last_scraped_at: new Date() },
      })
      return NextResponse.json({ done: true, reset: true, page })
    }

    // Fetch detail pages and upsert
    for (const bill of bills) {
      const detailed = await scrapeBillDetail(bill)
      const score = scoreBill(
        { title: detailed.title, sponsor: detailed.sponsor, scraperTags: [] },
        taxonomy
      )

      // Find or create sponsor MPP
      let sponsorMppId: string | undefined
      if (detailed.sponsor_mpp_url) {
        const existing = await prisma.mPP.findFirst({
          where: { url: detailed.sponsor_mpp_url },
        })
        sponsorMppId = existing?.id
      }

      await prisma.bill.upsert({
        where: { bill_number: detailed.bill_number },
        create: {
          bill_number: detailed.bill_number,
          title: detailed.title,
          sponsor: detailed.sponsor,
          status: detailed.status,
          date_introduced: detailed.date_introduced,
          reading_stage: detailed.reading_stage,
          vote_results: detailed.vote_results ?? undefined,
          vote_by_party: detailed.vote_by_party ?? undefined,
          url: detailed.url,
          impact_score: score.impact_score,
          tags: score.tags,
          toronto_flagged: score.toronto_flagged,
          last_scraped: new Date(),
          sponsorMppId,
        },
        update: {
          title: detailed.title,
          sponsor: detailed.sponsor,
          status: detailed.status,
          reading_stage: detailed.reading_stage,
          vote_results: detailed.vote_results ?? undefined,
          vote_by_party: detailed.vote_by_party ?? undefined,
          impact_score: score.impact_score,
          tags: score.tags,
          toronto_flagged: score.toronto_flagged,
          last_scraped: new Date(),
          sponsorMppId,
        },
      })

      await delay(1500)
    }

    // Advance cursor
    await prisma.scrapeState.update({
      where: { id: 'singleton' },
      data: { last_bill_page: page + 1, last_scraped_at: new Date() },
    })

    return NextResponse.json({ ok: true, page, processed: bills.length })
  } catch (err) {
    console.error('[scrape-bills] Error on page', page, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 12.2: Commit**

```bash
git add app/api/cron/scrape-bills/route.ts
git commit -m "feat: add scrape-bills cron route with chunked pagination"
```

---

### Task 13: `scrape-news` cron route

**Files:**
- Create: `app/api/cron/scrape-news/route.ts`

- [ ] **Step 13.1: Create the route**

Create `app/api/cron/scrape-news/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { fetchAllFeeds } from '@/lib/scraper/news'
import { classifyArticle, extractBillNumber } from '@/lib/ai/classify'

const MAX_ARTICLES_PER_RUN = 25

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  try {
    const rawArticles = await fetchAllFeeds()

    // Deduplicate against existing URLs
    const existingUrls = new Set(
      (await prisma.newsEvent.findMany({ select: { url: true } })).map((e) => e.url)
    )
    const newArticles = rawArticles
      .filter((a) => !existingUrls.has(a.url))
      .slice(0, MAX_ARTICLES_PER_RUN)

    let processed = 0

    for (const article of newArticles) {
      try {
        const classification = await classifyArticle(article.headline, article.excerpt)

        // Attempt bill linkage via regex
        const billNumberText = extractBillNumber(article.headline + ' ' + article.excerpt)
        let billId: string | undefined
        if (billNumberText) {
          const bill = await prisma.bill.findUnique({ where: { bill_number: billNumberText } })
          billId = bill?.id
        }

        await prisma.newsEvent.upsert({
          where: { url: article.url },
          create: {
            headline: article.headline,
            url: article.url,
            source: article.source,
            published_at: article.published_at,
            topic: classification.topic,
            sentiment: classification.sentiment,
            is_scandal: classification.is_scandal,
            tags: classification.tags,
            billId,
          },
          update: {
            topic: classification.topic,
            sentiment: classification.sentiment,
            is_scandal: classification.is_scandal,
            tags: classification.tags,
            billId,
          },
        })
        processed++
      } catch (err) {
        console.error('[scrape-news] Failed to process article:', article.url, err)
      }
    }

    return NextResponse.json({ ok: true, processed, skipped: rawArticles.length - processed })
  } catch (err) {
    console.error('[scrape-news] Fatal error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 13.2: Commit**

```bash
git add app/api/cron/scrape-news/route.ts
git commit -m "feat: add scrape-news cron route with AI classification"
```

---

### Task 14: Remaining cron routes (`scrape-hansard`, `scrape-mpps`, `discover-keywords`)

**Files:**
- Create: `app/api/cron/scrape-hansard/route.ts`
- Create: `app/api/cron/scrape-mpps/route.ts`
- Create: `app/api/cron/discover-keywords/route.ts`

- [ ] **Step 14.1: Create `scrape-hansard` route**

Create `app/api/cron/scrape-hansard/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { scrapeLatestHansard } from '@/lib/scraper/hansard'
import { checkRobotsTxt } from '@/lib/scraper/utils'

const OLA_BASE = 'https://www.ola.org'

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const allowed = await checkRobotsTxt(OLA_BASE, '/en/legislative-business/hansard')
  if (!allowed) {
    return NextResponse.json({ skipped: true, reason: 'robots.txt' })
  }

  try {
    const mentions = await scrapeLatestHansard()
    let updated = 0

    for (const mention of mentions) {
      const bill = await prisma.bill.findUnique({ where: { bill_number: mention.bill_number } })
      if (!bill) continue

      if (!bill.tags.includes('hansard-mention')) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { tags: { push: 'hansard-mention' } },
        })
        updated++
      }
    }

    return NextResponse.json({ ok: true, mentions: mentions.length, updated })
  } catch (err) {
    console.error('[scrape-hansard] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 14.2: Create `scrape-mpps` route**

Create `app/api/cron/scrape-mpps/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { scrapeMPPRoster } from '@/lib/scraper/mpps'
import { checkRobotsTxt } from '@/lib/scraper/utils'
import { delay } from '@/lib/scraper/utils'

const OLA_BASE = 'https://www.ola.org'

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const allowed = await checkRobotsTxt(OLA_BASE, '/en/members/all')
  if (!allowed) {
    return NextResponse.json({ skipped: true, reason: 'robots.txt' })
  }

  try {
    const mpps = await scrapeMPPRoster()
    let upserted = 0

    for (const mpp of mpps) {
      await prisma.mPP.upsert({
        where: { name_riding: { name: mpp.name, riding: mpp.riding } } as never,
        // Note: schema needs @@unique([name, riding]) — see schema update below
        create: mpp,
        update: {
          party: mpp.party,
          toronto_area: mpp.toronto_area,
          url: mpp.url,
        },
      })
      upserted++
      await delay(200)
    }

    return NextResponse.json({ ok: true, upserted })
  } catch (err) {
    console.error('[scrape-mpps] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

> **Schema update needed:** Add `@@unique([name, riding])` to the `MPP` model in `prisma/schema.prisma` and run `pnpm dlx prisma migrate dev --name add-mpp-unique`.

- [ ] **Step 14.3: Add `@@unique` to MPP model and migrate**

In `prisma/schema.prisma`, add to the `MPP` model:
```prisma
  @@unique([name, riding])
```

Then:
```bash
pnpm dlx prisma migrate dev --name add-mpp-unique
pnpm dlx prisma generate
```

- [ ] **Step 14.4: Create `discover-keywords` route**

Create `app/api/cron/discover-keywords/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/db'
import { discoverKeywords } from '@/lib/ai/discover'
import { buildStaticTaxonomy } from '@/lib/classifier/keywords'

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  try {
    // Find bills with >= 2 news events but impact_score < 3
    const missed = await prisma.bill.findMany({
      where: { impact_score: { lt: 3 } },
      include: { _count: { select: { newsEvents: true } } },
    })
    const candidates = missed
      .filter((b) => b._count.newsEvents >= 2)
      .map((b) => ({ bill_number: b.bill_number, title: b.title, tags: b.tags }))

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, candidates: 0, suggestions: 0 })
    }

    // Current active terms
    const taxonomy = buildStaticTaxonomy()
    const currentTerms = Object.keys(taxonomy)

    const suggestions = await discoverKeywords(candidates, currentTerms)

    let upserted = 0
    for (const suggestion of suggestions) {
      const billIds = candidates.map((b) => b.bill_number)

      const existing = await prisma.keywordSuggestion.findUnique({
        where: { term: suggestion.term },
      })

      if (existing) {
        await prisma.keywordSuggestion.update({
          where: { term: suggestion.term },
          data: {
            seen_count: { increment: 1 },
            source_bills: { push: billIds },
          },
        })
      } else {
        await prisma.keywordSuggestion.create({
          data: {
            term: suggestion.term,
            weight: suggestion.weight,
            category: suggestion.category,
            seen_count: 1,
            source_bills: billIds,
            status: 'pending',
          },
        })
      }
      upserted++
    }

    // Auto-promote suggestions with seen_count >= 3
    const promoted = await prisma.keywordSuggestion.updateMany({
      where: { seen_count: { gte: 3 }, status: 'pending' },
      data: { status: 'active' },
    })

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      suggestions: suggestions.length,
      upserted,
      promoted: promoted.count,
    })
  } catch (err) {
    console.error('[discover-keywords] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 14.5: Commit**

```bash
git add app/api/cron/scrape-hansard/route.ts app/api/cron/scrape-mpps/route.ts app/api/cron/discover-keywords/route.ts
git commit -m "feat: add remaining cron routes (hansard, mpps, discover-keywords)"
```

---

### Task 15: `vercel.json` and `.env.example`

**Files:**
- Create: `vercel.json`
- Create: `.env.example`

- [ ] **Step 15.1: Create `vercel.json`**

Create `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/scrape-bills",       "schedule": "0 */6 * * *" },
    { "path": "/api/cron/scrape-news",        "schedule": "0 * * * *"   },
    { "path": "/api/cron/scrape-hansard",     "schedule": "0 8 * * *"   },
    { "path": "/api/cron/scrape-mpps",        "schedule": "0 8 * * 1"   },
    { "path": "/api/cron/discover-keywords",  "schedule": "0 9 * * 1"   }
  ]
}
```

- [ ] **Step 15.2: Create `.env.example`**

Create `.env.example`:

```bash
# Neon PostgreSQL — use the POOLED connection string for Vercel serverless
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/neondb?pgbouncer=true&connect_timeout=15"

# GitHub Personal Access Token — used for GitHub Models AI (free)
# Create at: https://github.com/settings/tokens (no special scopes needed for Models)
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Cron secret — generate with: openssl rand -base64 32
# Set this in Vercel project settings → Environment Variables
CRON_SECRET="your-generated-secret-here"
```

- [ ] **Step 15.3: Commit**

```bash
git add vercel.json .env.example
git commit -m "feat: add vercel.json cron schedule and .env.example"
```

---

## Chunk 4: Frontend — Layout, Components, Pages

### Task 16: Root layout and global styles

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 16.1: Update root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fuck Doug Ford — Ontario Legislative Tracker',
  description: 'Ontario civic accountability dashboard. Tracking bills and scandals at Queen\'s Park.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f7] text-[#1a1a1a] antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 16.2: Update globals.css**

Replace `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --cream: #faf9f7;
  --ink: #1a1a1a;
  --red: #c8102e;
  --rule: #e5e3de;
  --muted: #6b6b6b;
}

body {
  font-family: Georgia, 'Times New Roman', serif;
}

.sans {
  font-family: system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 16.3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: set up root layout and global styles (cream/ink/red palette)"
```

---

### Task 17: Layout components (Masthead, DatelineBar, SectionDivider)

**Files:**
- Create: `app/components/layout/Masthead.tsx`
- Create: `app/components/layout/DatelineBar.tsx`
- Create: `app/components/layout/SectionDivider.tsx`

- [ ] **Step 17.1: Create `Masthead.tsx`**

Create `app/components/layout/Masthead.tsx`:

```tsx
// ASCII art pre-rendered from figlet Bloody font at build time.
// To regenerate: node -e "const f=require('figlet'); console.log(f.textSync('FUCK DOUG', {font:'Bloody'})); console.log(f.textSync('FORD', {font:'Bloody'}))"

const FUCK_DOUG = `  █████▒█    ██  ▄████▄   ██ ▄█▀   ▓█████▄  ▒█████   █    ██   ▄████
▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒    ▒██▀ ██▌▒██▒  ██▒ ██  ▓██▒ ██▒ ▀█▒
▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░    ░██   █▌▒██░  ██▒▓██  ▒██░▒██░▄▄▄░
░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄    ░▓█▄   ▌▒██   ██░▓▓█  ░██░░▓█  ██▓
░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄   ░▒████▓ ░ ████▓▒░▒▒█████▓ ░▒▓███▀▒
 ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒    ▒▒▓  ▒ ░ ▒░▒░▒░ ░▒▓▒ ▒ ▒  ░▒   ▒
 ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░    ░ ▒  ▒   ░ ▒ ▒░ ░░▒░ ░ ░   ░   ░
 ░ ░    ░░░ ░ ░ ░        ░ ░░ ░     ░ ░  ░ ░ ░ ░ ▒   ░░░ ░ ░ ░ ░   ░
          ░     ░ ░      ░  ░         ░        ░ ░     ░           ░   `

const FORD = `  █████▒▒█████   ██▀███  ▓█████▄
▓██   ▒▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌
▒████ ░▒██░  ██▒▓██ ░▄█ ▒░██   █▌
░▓█▒  ░▒██   ██░▒██▀▀█▄  ░▓█▄   ▌
░▒█░   ░ ████▓▒░░██▓ ▒██▒░▒████▓
 ▒ ░   ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒
 ░       ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒
 ░ ░   ░ ░ ░ ▒    ░░   ░  ░ ░  ░
           ░ ░     ░        ░
                          ░      `

export function Masthead() {
  return (
    <div className="border-b-4 border-double border-[#1a1a1a] pb-3 mb-1 overflow-x-auto">
      <pre
        className="font-mono text-[5.8px] leading-[1.25] text-[#1a1a1a] m-0 whitespace-pre"
        aria-label="Fuck Doug"
      >
        {FUCK_DOUG}
      </pre>
      <pre
        className="font-mono text-[5.8px] leading-[1.25] text-[#c8102e] mt-1.5 m-0 whitespace-pre"
        aria-label="Ford"
      >
        {FORD}
      </pre>
      <p className="sans text-[7px] text-[#6b6b6b] tracking-[1.5px] uppercase mt-2">
        Ontario Legislative Accountability Project
      </p>
    </div>
  )
}
```

- [ ] **Step 17.2: Create `DatelineBar.tsx`**

Create `app/components/layout/DatelineBar.tsx`:

```tsx
interface DatelineBarProps {
  activeBills: number
  torontoBills: number
}

export function DatelineBar({ activeBills, torontoBills }: DatelineBarProps) {
  const date = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="sans flex justify-between items-center border-b border-[#1a1a1a] py-1 mb-3 text-[7px]">
      <span className="text-[#6b6b6b]">{date}</span>
      <span className="bg-[#c8102e] text-white font-bold px-1.5 py-px">● LIVE UPDATES</span>
      <span className="text-[#6b6b6b]">
        {activeBills} Active Bills · {torontoBills} Toronto-Flagged
      </span>
    </div>
  )
}
```

- [ ] **Step 17.3: Create `SectionDivider.tsx`**

Create `app/components/layout/SectionDivider.tsx`:

```tsx
interface SectionDividerProps {
  label: string
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="sans border-t-[3px] border-b border-[#1a1a1a] py-[3px] mb-2.5">
      <span className="text-[9px] font-black uppercase tracking-[1px]">{label}</span>
    </div>
  )
}
```

- [ ] **Step 17.4: Commit**

```bash
git add app/components/layout/
git commit -m "feat: add Masthead, DatelineBar, SectionDivider layout components"
```

---

### Task 18: Bill UI components

**Files:**
- Create: `app/components/bills/StatusBadge.tsx`
- Create: `app/components/bills/ImpactScore.tsx`
- Create: `app/components/bills/KPIStrip.tsx`
- Create: `app/components/bills/TorontoAlertBanner.tsx`
- Create: `app/components/bills/BillRow.tsx`
- Create: `app/components/bills/BillTable.tsx`

- [ ] **Step 18.1: Create `StatusBadge.tsx`**

Create `app/components/bills/StatusBadge.tsx`:

```tsx
const STATUS_STYLES: Record<string, string> = {
  '1st Reading':          'text-[#4a7cc7]',
  '2nd Reading':          'text-[#4a7cc7]',
  '3rd Reading':          'text-[#4a7cc7]',
  'Committee':            'text-[#d97706]',
  'Royal Assent':         'text-[#2d8a4e] font-bold',
  'Proclaimed in Force':  'text-[#2d8a4e] font-bold',
  'Withdrawn':            'text-[#9b9b9b]',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'text-[#6b6b6b]'
  return (
    <span className={`sans text-[7px] font-semibold ${style}`}>{status}</span>
  )
}
```

- [ ] **Step 18.2: Create `ImpactScore.tsx`**

Create `app/components/bills/ImpactScore.tsx`:

```tsx
interface ImpactScoreProps {
  score: number
  toronto_flagged: boolean
}

export function ImpactScore({ score, toronto_flagged }: ImpactScoreProps) {
  if (!toronto_flagged || score === 0) {
    return (
      <span className="sans text-[8px] font-semibold text-[#9b9b9b]">
        — {score.toFixed(1)}
      </span>
    )
  }
  return (
    <span className="sans text-[8px] font-bold text-[#c8102e]">
      ▼ {score.toFixed(1)}
    </span>
  )
}
```

- [ ] **Step 18.3: Create `KPIStrip.tsx`**

Create `app/components/bills/KPIStrip.tsx`:

```tsx
interface KPIStripProps {
  torontoBills: number
  activeBills: number
  scandals: number
  passedLaws: number
}

export function KPIStrip({ torontoBills, activeBills, scandals, passedLaws }: KPIStripProps) {
  const kpis = [
    { label: 'Toronto Bills', value: torontoBills, red: true },
    { label: 'Active Bills',  value: activeBills,  red: false },
    { label: 'Active Scandals', value: scandals,   red: true },
    { label: 'Passed Laws',   value: passedLaws,   red: false },
  ]

  return (
    <div className="grid grid-cols-4 border border-[#1a1a1a] mb-3.5 overflow-hidden">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className={`p-2 text-center ${i < 3 ? 'border-r border-[#e5e3de]' : ''}`}
        >
          <div
            className={`sans text-[18px] font-black leading-none ${
              kpi.red ? 'text-[#c8102e]' : 'text-[#1a1a1a]'
            }`}
          >
            {kpi.value}
          </div>
          <div className="sans text-[6px] text-[#6b6b6b] uppercase tracking-[0.5px] mt-0.5">
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 18.4: Create `TorontoAlertBanner.tsx`**

Create `app/components/bills/TorontoAlertBanner.tsx`:

```tsx
import type { Bill } from '@prisma/client'
import Link from 'next/link'

interface TorontoAlertBannerProps {
  bill: Bill | null
}

export function TorontoAlertBanner({ bill }: TorontoAlertBannerProps) {
  if (!bill) return null

  return (
    <div className="border-2 border-[#c8102e] px-3 py-2.5 mb-3.5 bg-[#fff8f8]">
      <p className="sans text-[8px] text-[#c8102e] font-bold uppercase tracking-[0.8px] mb-1">
        ⚠ Toronto Alert — Highest Impact This Session
      </p>
      <Link href={`/bills/${bill.id}`}>
        <h2 className="text-[16px] font-black text-[#1a1a1a] leading-[1.25] tracking-[-0.3px] hover:underline">
          {bill.bill_number} — {bill.title}
        </h2>
      </Link>
      <p className="sans text-[8px] text-[#6b6b6b] mt-1.5 border-t border-[#f0dede] pt-1.5">
        Sponsored by {bill.sponsor} · Toronto Impact Score:{' '}
        <strong className="text-[#c8102e]">{bill.impact_score.toFixed(1)} / 10</strong>
        {bill.reading_stage ? ` · ${bill.reading_stage}` : ''}
      </p>
    </div>
  )
}
```

- [ ] **Step 18.5: Create `BillRow.tsx`**

Create `app/components/bills/BillRow.tsx`:

```tsx
import type { Bill } from '@prisma/client'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { ImpactScore } from './ImpactScore'

interface BillRowProps {
  bill: Bill
}

export function BillRow({ bill }: BillRowProps) {
  const topic = bill.tags.find((t) =>
    ['housing', 'transit', 'municipal', 'direct', 'toronto_flashpoints'].includes(t)
  )

  return (
    <tr
      className={`border-b border-[#e5e3de] ${
        bill.toronto_flagged ? 'bg-[#fff8f8]' : ''
      }`}
    >
      <td className="py-[5px] pr-1 sans text-[8px] font-extrabold text-[#c8102e]">
        <Link href={`/bills/${bill.id}`} className="hover:underline">
          {bill.bill_number.replace('Bill ', '')}
        </Link>
      </td>
      <td className="py-[5px] px-1 text-[8px] text-[#1a1a1a]">
        <Link href={`/bills/${bill.id}`} className="hover:underline">
          {bill.title}
        </Link>
      </td>
      <td className="py-[5px] px-1 sans text-[7px] text-[#6b6b6b]">{bill.sponsor}</td>
      <td className="py-[5px] px-1">
        <StatusBadge status={bill.reading_stage ?? bill.status} />
      </td>
      <td className="py-[5px] px-1 sans text-[7px] text-[#6b6b6b] capitalize">{topic ?? '—'}</td>
      <td className="py-[5px] pl-1 text-right">
        <ImpactScore score={bill.impact_score} toronto_flagged={bill.toronto_flagged} />
      </td>
    </tr>
  )
}
```

- [ ] **Step 18.6: Create `BillTable.tsx` (Client Component)**

Create `app/components/bills/BillTable.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { Bill } from '@prisma/client'
import { BillRow } from './BillRow'

type SortKey = 'impact_score' | 'bill_number' | 'date_introduced' | 'reading_stage'
type SortDir = 'asc' | 'desc'

interface BillTableProps {
  bills: Bill[]
}

const COLUMNS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: 'bill_number',     label: 'Bill',    defaultDir: 'asc'  },
  { key: 'bill_number',     label: 'Title',   defaultDir: 'asc'  }, // non-sortable visual column
  { key: 'bill_number',     label: 'Sponsor', defaultDir: 'asc'  }, // non-sortable visual column
  { key: 'reading_stage',   label: 'Stage',   defaultDir: 'asc'  },
  { key: 'impact_score',    label: 'Topic',   defaultDir: 'desc' }, // non-sortable visual column
  { key: 'impact_score',    label: 'Impact',  defaultDir: 'desc' },
]

export function BillTable({ bills }: BillTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('impact_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = [...bills].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'impact_score') {
      cmp = a.impact_score - b.impact_score
    } else if (sortKey === 'date_introduced') {
      cmp = (a.date_introduced?.getTime() ?? 0) - (b.date_introduced?.getTime() ?? 0)
    } else if (sortKey === 'reading_stage') {
      cmp = (a.reading_stage ?? '').localeCompare(b.reading_stage ?? '')
    } else {
      cmp = a.bill_number.localeCompare(b.bill_number)
    }
    // Tie-break: bill_number ASC
    if (cmp === 0) cmp = a.bill_number.localeCompare(b.bill_number)
    return sortDir === 'asc' ? cmp : -cmp
  })

  function handleSort(key: SortKey, defaultDir: SortDir) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(defaultDir)
    }
  }

  const sortableHeaders: { key: SortKey; label: string; defaultDir: SortDir }[] = [
    { key: 'bill_number',   label: 'Bill',    defaultDir: 'asc'  },
    { key: 'bill_number',   label: 'Title',   defaultDir: 'asc'  },
    { key: 'bill_number',   label: 'Sponsor', defaultDir: 'asc'  },
    { key: 'reading_stage', label: 'Stage',   defaultDir: 'asc'  },
    { key: 'impact_score',  label: 'Topic',   defaultDir: 'desc' },
    { key: 'impact_score',  label: 'Impact',  defaultDir: 'desc' },
  ]

  return (
    <table className="w-full border-collapse mb-3.5 sans">
      <thead>
        <tr className="border-b-2 border-[#1a1a1a]">
          {[
            { key: 'bill_number' as SortKey,   label: 'Bill',    defaultDir: 'asc'  as SortDir },
            { key: 'bill_number' as SortKey,   label: 'Title',   defaultDir: 'asc'  as SortDir },
            { key: 'bill_number' as SortKey,   label: 'Sponsor', defaultDir: 'asc'  as SortDir },
            { key: 'reading_stage' as SortKey, label: 'Stage',   defaultDir: 'asc'  as SortDir },
            { key: 'impact_score' as SortKey,  label: 'Topic',   defaultDir: 'desc' as SortDir },
            { key: 'impact_score' as SortKey,  label: 'Impact',  defaultDir: 'desc' as SortDir },
          ].map(({ key, label, defaultDir }) => (
            <th
              key={label}
              className="text-left text-[7px] font-bold text-[#6b6b6b] uppercase tracking-[0.5px] py-[3px] px-1 cursor-pointer hover:text-[#1a1a1a]"
              onClick={() => handleSort(key, defaultDir)}
            >
              {label}
              {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((bill) => (
          <BillRow key={bill.id} bill={bill} />
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 18.7: Commit**

```bash
git add app/components/bills/
git commit -m "feat: add bill UI components (StatusBadge, ImpactScore, KPIStrip, TorontoAlertBanner, BillTable)"
```

---

### Task 19: News and MPP components

**Files:**
- Create: `app/components/news/NewsItem.tsx`
- Create: `app/components/news/ScandalFeed.tsx`
- Create: `app/components/mpps/MPPCard.tsx`
- Create: `app/components/mpps/VoteBreakdown.tsx`
- Create: `app/components/mpps/LinkedNews.tsx`

- [ ] **Step 19.1: Create `NewsItem.tsx`**

Create `app/components/news/NewsItem.tsx`:

```tsx
import type { NewsEvent } from '@prisma/client'

interface NewsItemProps {
  item: NewsEvent
}

export function NewsItem({ item }: NewsItemProps) {
  const ago = formatAgo(item.published_at)
  return (
    <div className="mb-2.5 pb-2 border-b border-[#e5e3de]">
      <div className="flex gap-1.5 items-center mb-[3px]">
        <span className="sans bg-[#c8102e] text-white text-[6px] font-bold px-1.5 py-px uppercase">
          {item.source}
        </span>
        <span className="sans text-[7px] text-[#9b9b9b]">
          {ago}{item.topic ? ` · ${item.topic}` : ''}
        </span>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-bold text-[#1a1a1a] leading-[1.3] hover:underline"
      >
        {item.headline}
      </a>
      {item.tags.length > 0 && (
        <p className="sans text-[8px] text-[#6b6b6b] mt-0.5">
          Tagged: {item.tags.join(' · ')}
        </p>
      )}
    </div>
  )
}

function formatAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH < 1) return 'Just now'
  if (diffH < 24) return `${diffH}h ago`
  return `${Math.floor(diffH / 24)}d ago`
}
```

- [ ] **Step 19.2: Create `ScandalFeed.tsx`**

Create `app/components/news/ScandalFeed.tsx`:

```tsx
import type { NewsEvent } from '@prisma/client'
import { NewsItem } from './NewsItem'

interface ScandalFeedProps {
  items: NewsEvent[]
}

export function ScandalFeed({ items }: ScandalFeedProps) {
  if (items.length === 0) {
    return <p className="sans text-[8px] text-[#9b9b9b] italic">No recent scandals found.</p>
  }
  return (
    <div>
      {items.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </div>
  )
}
```

- [ ] **Step 19.3: Create MPP components**

Create `app/components/mpps/MPPCard.tsx`:

```tsx
import type { MPP } from '@prisma/client'

interface MPPCardProps {
  mpp: MPP
}

export function MPPCard({ mpp }: MPPCardProps) {
  const partyColor: Record<string, string> = {
    PC: '#1a1a1a', NDP: '#f97316', Liberal: '#ef4444', Green: '#22c55e', Independent: '#9b9b9b',
  }

  return (
    <div className="border border-[#e5e3de] p-3 rounded-sm">
      <p className="font-bold text-[12px] text-[#1a1a1a]">{mpp.name}</p>
      <p
        className="sans text-[8px] font-bold uppercase mt-0.5"
        style={{ color: partyColor[mpp.party] ?? '#6b6b6b' }}
      >
        {mpp.party}
      </p>
      <p className="sans text-[8px] text-[#6b6b6b] mt-0.5">{mpp.riding}</p>
      {mpp.toronto_area && (
        <span className="sans text-[6px] bg-[#fff8f8] border border-[#c8102e] text-[#c8102e] px-1 py-px mt-1 inline-block">
          Toronto Area
        </span>
      )}
    </div>
  )
}
```

Create `app/components/mpps/VoteBreakdown.tsx`:

```tsx
interface PartyVote {
  yea: number
  nay: number
  absent?: number
}

interface VoteBreakdownProps {
  voteByParty: Record<string, PartyVote> | null
  voteResults: { yea: number; nay: number; absent: number } | null
}

export function VoteBreakdown({ voteByParty, voteResults }: VoteBreakdownProps) {
  if (!voteResults) {
    return <p className="sans text-[8px] text-[#9b9b9b] italic">Vote data not yet available.</p>
  }

  return (
    <div>
      <div className="sans flex gap-4 mb-2">
        <span className="text-[#2d8a4e] font-bold text-[12px]">✓ {voteResults.yea} Yea</span>
        <span className="text-[#c8102e] font-bold text-[12px]">✗ {voteResults.nay} Nay</span>
        {voteResults.absent > 0 && (
          <span className="text-[#9b9b9b] text-[12px]">{voteResults.absent} Absent</span>
        )}
      </div>
      {voteByParty && Object.keys(voteByParty).length > 0 && (
        <table className="sans w-full border-collapse text-[8px]">
          <thead>
            <tr className="border-b border-[#e5e3de]">
              <th className="text-left text-[#6b6b6b] py-1 pr-2">Party</th>
              <th className="text-right text-[#6b6b6b] py-1 px-2">Yea</th>
              <th className="text-right text-[#6b6b6b] py-1 px-2">Nay</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(voteByParty).map(([party, votes]) => (
              <tr key={party} className="border-b border-[#f0ede8]">
                <td className="py-1 pr-2 font-semibold">{party}</td>
                <td className="py-1 px-2 text-right text-[#2d8a4e]">{votes.yea}</td>
                <td className="py-1 px-2 text-right text-[#c8102e]">{votes.nay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

Create `app/components/mpps/LinkedNews.tsx`:

```tsx
import type { NewsEvent } from '@prisma/client'
import { NewsItem } from '../news/NewsItem'

interface LinkedNewsProps {
  items: NewsEvent[]
}

export function LinkedNews({ items }: LinkedNewsProps) {
  if (items.length === 0) {
    return <p className="sans text-[8px] text-[#9b9b9b] italic">No linked news articles.</p>
  }
  return (
    <div>
      {items.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </div>
  )
}
```

- [ ] **Step 19.4: Commit**

```bash
git add app/components/news/ app/components/mpps/
git commit -m "feat: add news and MPP UI components"
```

---

### Task 20: Main dashboard page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 20.1: Implement the dashboard**

Replace `app/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import { Masthead } from './components/layout/Masthead'
import { DatelineBar } from './components/layout/DatelineBar'
import { SectionDivider } from './components/layout/SectionDivider'
import { TorontoAlertBanner } from './components/bills/TorontoAlertBanner'
import { KPIStrip } from './components/bills/KPIStrip'
import { BillTable } from './components/bills/BillTable'
import { ScandalFeed } from './components/news/ScandalFeed'

const PASSED_STATUSES = ['Royal Assent', 'Proclaimed in Force']
const INACTIVE_STATUSES = [...PASSED_STATUSES, 'Withdrawn']
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

export default async function DashboardPage() {
  const [bills, torontoBills, activeBillCount, passedCount, scandals, alertBill] =
    await Promise.all([
      prisma.bill.findMany({ orderBy: { impact_score: 'desc' } }),
      prisma.bill.count({ where: { toronto_flagged: true } }),
      prisma.bill.count({ where: { status: { notIn: INACTIVE_STATUSES } } }),
      prisma.bill.count({ where: { status: { in: PASSED_STATUSES } } }),
      prisma.newsEvent.findMany({
        where: { is_scandal: true },
        orderBy: { published_at: 'desc' },
        take: 20,
      }),
      prisma.bill.findFirst({
        where: {
          toronto_flagged: true,
          status: { notIn: INACTIVE_STATUSES },
        },
        orderBy: { impact_score: 'desc' },
      }),
      prisma.newsEvent.count({
        where: {
          is_scandal: true,
          published_at: { gte: THIRTY_DAYS_AGO },
        },
      }),
    ])

  const scandalCount = await prisma.newsEvent.count({
    where: { is_scandal: true, published_at: { gte: THIRTY_DAYS_AGO } },
  })

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <Masthead />
      <DatelineBar activeBills={activeBillCount} torontoBills={torontoBills} />
      <TorontoAlertBanner bill={alertBill} />
      <KPIStrip
        torontoBills={torontoBills}
        activeBills={activeBillCount}
        scandals={scandalCount}
        passedLaws={passedCount}
      />
      <SectionDivider label="Legislative Bills Tracker" />
      <BillTable bills={bills} />
      <SectionDivider label="Scandals & Investigations" />
      <ScandalFeed items={scandals} />
    </main>
  )
}
```

- [ ] **Step 20.2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement main dashboard page (Server Component)"
```

---

### Task 21: Bill detail and MPP profile pages

**Files:**
- Create: `app/bills/[id]/page.tsx`
- Create: `app/mpps/[id]/page.tsx`
- Create: `app/api/bills/route.ts`

- [ ] **Step 21.1: Create bill detail page**

Create `app/bills/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { SectionDivider } from '@/app/components/layout/SectionDivider'
import { StatusBadge } from '@/app/components/bills/StatusBadge'
import { ImpactScore } from '@/app/components/bills/ImpactScore'
import { VoteBreakdown } from '@/app/components/mpps/VoteBreakdown'
import { LinkedNews } from '@/app/components/mpps/LinkedNews'

interface Props { params: Promise<{ id: string }> }

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { sponsor_mpp: true, newsEvents: { orderBy: { published_at: 'desc' } } },
  })

  if (!bill) notFound()

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/" className="sans text-[8px] text-[#6b6b6b] hover:underline mb-4 block">
        ← Back to dashboard
      </Link>

      <div className="border-b-2 border-[#1a1a1a] pb-3 mb-4">
        <p className="sans text-[8px] text-[#c8102e] font-bold uppercase tracking-[0.8px] mb-1">
          {bill.bill_number}
        </p>
        <h1 className="text-[22px] font-black text-[#1a1a1a] leading-[1.2] tracking-[-0.5px]">
          {bill.title}
        </h1>
        <div className="sans flex gap-3 items-center mt-2 text-[8px] text-[#6b6b6b]">
          <span>Sponsored by {bill.sponsor}</span>
          {bill.date_introduced && (
            <span>Introduced {new Date(bill.date_introduced).toLocaleDateString('en-CA')}</span>
          )}
          <StatusBadge status={bill.reading_stage ?? bill.status} />
          <ImpactScore score={bill.impact_score} toronto_flagged={bill.toronto_flagged} />
        </div>
        {bill.tags.length > 0 && (
          <p className="sans text-[7px] text-[#9b9b9b] mt-1">
            Tags: {bill.tags.join(', ')}
          </p>
        )}
      </div>

      {bill.sponsor_mpp && (
        <>
          <SectionDivider label="Sponsor" />
          <Link href={`/mpps/${bill.sponsor_mpp.id}`} className="hover:underline">
            <p className="font-bold text-[11px]">{bill.sponsor_mpp.name}</p>
          </Link>
          <p className="sans text-[8px] text-[#6b6b6b]">
            {bill.sponsor_mpp.party} · {bill.sponsor_mpp.riding}
            {bill.sponsor_mpp.toronto_area ? ' · Toronto Area' : ''}
          </p>
        </>
      )}

      <SectionDivider label="Vote Results" />
      <VoteBreakdown
        voteResults={bill.vote_results as { yea: number; nay: number; absent: number } | null}
        voteByParty={bill.vote_by_party as Record<string, { yea: number; nay: number }> | null}
      />

      <SectionDivider label="Related News" />
      <LinkedNews items={bill.newsEvents} />
    </main>
  )
}
```

- [ ] **Step 21.2: Create MPP profile page**

Create `app/mpps/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { SectionDivider } from '@/app/components/layout/SectionDivider'
import { MPPCard } from '@/app/components/mpps/MPPCard'
import { StatusBadge } from '@/app/components/bills/StatusBadge'
import { ImpactScore } from '@/app/components/bills/ImpactScore'

interface Props { params: Promise<{ id: string }> }

export default async function MPPProfilePage({ params }: Props) {
  const { id } = await params
  const mpp = await prisma.mPP.findUnique({
    where: { id },
    include: {
      bills: {
        orderBy: { impact_score: 'desc' },
        include: { newsEvents: { take: 3, orderBy: { published_at: 'desc' } } },
      },
    },
  })

  if (!mpp) notFound()

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/" className="sans text-[8px] text-[#6b6b6b] hover:underline mb-4 block">
        ← Back to dashboard
      </Link>

      <div className="mb-4">
        <MPPCard mpp={mpp} />
        {mpp.url && (
          <a
            href={mpp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="sans text-[7px] text-[#6b6b6b] hover:underline mt-1 block"
          >
            View on OLA website →
          </a>
        )}
      </div>

      <SectionDivider label={`Sponsored Bills (${mpp.bills.length})`} />
      {mpp.bills.length === 0 ? (
        <p className="sans text-[8px] text-[#9b9b9b] italic">No sponsored bills found.</p>
      ) : (
        <table className="w-full border-collapse sans">
          <thead>
            <tr className="border-b-2 border-[#1a1a1a]">
              <th className="text-left text-[7px] font-bold text-[#6b6b6b] uppercase tracking-[0.5px] py-[3px] pr-2">Bill</th>
              <th className="text-left text-[7px] font-bold text-[#6b6b6b] uppercase tracking-[0.5px] py-[3px] px-1">Title</th>
              <th className="text-left text-[7px] font-bold text-[#6b6b6b] uppercase tracking-[0.5px] py-[3px] px-1">Stage</th>
              <th className="text-right text-[7px] font-bold text-[#6b6b6b] uppercase tracking-[0.5px] py-[3px] pl-1">Impact</th>
            </tr>
          </thead>
          <tbody>
            {mpp.bills.map((bill) => (
              <tr key={bill.id} className={`border-b border-[#e5e3de] ${bill.toronto_flagged ? 'bg-[#fff8f8]' : ''}`}>
                <td className="py-[5px] pr-2 text-[8px] font-extrabold text-[#c8102e]">
                  <Link href={`/bills/${bill.id}`} className="hover:underline">{bill.bill_number}</Link>
                </td>
                <td className="py-[5px] px-1 text-[8px] text-[#1a1a1a]">
                  <Link href={`/bills/${bill.id}`} className="hover:underline">{bill.title}</Link>
                </td>
                <td className="py-[5px] px-1">
                  <StatusBadge status={bill.reading_stage ?? bill.status} />
                </td>
                <td className="py-[5px] pl-1 text-right">
                  <ImpactScore score={bill.impact_score} toronto_flagged={bill.toronto_flagged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
```

- [ ] **Step 21.3: Create public bills API**

Create `app/api/bills/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const bills = await prisma.bill.findMany({
    orderBy: { impact_score: 'desc' },
    select: {
      id: true,
      bill_number: true,
      title: true,
      sponsor: true,
      status: true,
      reading_stage: true,
      impact_score: true,
      tags: true,
      toronto_flagged: true,
      date_introduced: true,
      url: true,
    },
  })
  return NextResponse.json(bills)
}
```

- [ ] **Step 21.4: Commit**

```bash
git add app/bills/ app/mpps/ app/api/bills/
git commit -m "feat: add bill detail, MPP profile pages and public bills API"
```

---

## Chunk 5: Final Wiring, Testing, and Deployment

### Task 22: Run dev server and verify pages render

- [ ] **Step 22.1: Start the dev server**

```bash
pnpm dev
```

Open `http://localhost:3000`. Expected: Dashboard renders. Masthead ASCII art visible. Tables show "No data" states (DB is empty until scraper runs).

- [ ] **Step 22.2: Manually trigger scraper (dev)**

With the dev server running, make a GET request to test cron routes:

```bash
# Set your CRON_SECRET in .env first, then:
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2 | tr -d '"')" \
  http://localhost:3000/api/cron/scrape-mpps
```

Expected: `{ "ok": true, "upserted": N }` — MPP table populated.

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2 | tr -d '"')" \
  http://localhost:3000/api/cron/scrape-bills
```

Expected: `{ "ok": true, "page": 0, "processed": N }` — Bills table populated.

Reload `http://localhost:3000` — bills should now appear in the table.

- [ ] **Step 22.3: Verify bill detail page**

Visit `http://localhost:3000/bills/<id>` for any bill ID from the DB. Expected: Detail page renders with vote breakdown, sponsor, and linked news sections.

---

### Task 23: Run scrape-news and verify AI classification

- [ ] **Step 23.1: Trigger news scraper**

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2 | tr -d '"')" \
  http://localhost:3000/api/cron/scrape-news
```

Expected: `{ "ok": true, "processed": N }`. Check Neon console or Prisma Studio to see `NewsEvent` rows with `topic`, `sentiment`, `is_scandal` populated.

```bash
pnpm dlx prisma studio
```

Open `http://localhost:5555` to browse the DB.

---

### Task 24: Fix OLA HTML selectors if needed

The OLA site structure may differ from what the scraper assumes. After running `scrape-bills` and inspecting the results:

- [ ] **Step 24.1: Check scraped bill data quality**

```bash
# In Prisma Studio or via psql, check a bill row:
pnpm dlx prisma studio
```

If `title`, `sponsor`, or `status` is blank, inspect the live OLA HTML:

```bash
curl -s "https://www.ola.org/en/legislative-business/bills/current" | \
  node -e "
    const cheerio = require('cheerio');
    let html = '';
    process.stdin.on('data', d => html += d);
    process.stdin.on('end', () => {
      const $ = cheerio.load(html);
      // Print first 3 table rows to identify selectors
      $('table tbody tr').slice(0,3).each((i,el) => {
        console.log(i, $(el).html()?.slice(0,200));
      });
    });
  "
```

Update selectors in `lib/scraper/bills.ts` to match actual HTML structure, then re-run.

- [ ] **Step 24.2: Commit selector fixes if needed**

```bash
git add lib/scraper/bills.ts lib/scraper/mpps.ts lib/scraper/hansard.ts
git commit -m "fix: update OLA HTML selectors to match live site structure"
```

---

### Task 25: Full test suite

- [ ] **Step 25.1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass. If any fail, fix the issue before proceeding.

- [ ] **Step 25.2: Build for production**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

---

### Task 26: Deploy to Vercel

- [ ] **Step 26.1: Install Vercel CLI and deploy**

```bash
pnpm add -g vercel
vercel
```

Follow prompts. When asked about framework: Next.js (auto-detected).

- [ ] **Step 26.2: Set environment variables in Vercel**

In Vercel dashboard → Project → Settings → Environment Variables, add:
- `DATABASE_URL` — Neon pooled connection string
- `GITHUB_TOKEN` — GitHub personal access token
- `CRON_SECRET` — your generated secret (`openssl rand -base64 32`)

- [ ] **Step 26.3: Redeploy with env vars**

```bash
vercel --prod
```

- [ ] **Step 26.4: Trigger cron manually to seed DB**

In Vercel dashboard → Project → Cron Jobs, manually trigger:
1. `scrape-mpps` — seed MPP roster
2. `scrape-bills` (run several times to paginate through all bills)
3. `scrape-hansard`
4. `scrape-news`

- [ ] **Step 26.5: Verify production site**

Open your Vercel URL. Confirm:
- [ ] Masthead ASCII art renders correctly
- [ ] KPI strip shows real numbers
- [ ] Bills table is populated and sortable
- [ ] Toronto Alert Banner appears if any toronto_flagged bills exist
- [ ] Scandal feed shows news items
- [ ] Bill detail pages work
- [ ] MPP profile pages work

- [ ] **Step 26.6: Final commit**

```bash
git add .
git commit -m "chore: production deployment verified"
```

---

## Summary

| Chunk | Tasks | What it produces |
|---|---|---|
| 1: Foundation | 1–5 | DB schema, Prisma, utils, classifier, AI wrapper — all tested |
| 2: Scrapers | 6–10 | OLA bills, MPPs, Hansard, RSS news, keyword discovery |
| 3: Cron routes | 11–15 | 5 cron endpoints, `vercel.json`, `.env.example` |
| 4: Frontend | 16–21 | Dashboard, bill detail, MPP pages, all UI components |
| 5: Deployment | 22–26 | Dev verification, selector fixes, full build, Vercel deploy |
