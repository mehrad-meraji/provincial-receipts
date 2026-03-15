# Ontario Budget Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Ontario provincial budget data (deficit, total spend, per-ministry spending with expandable sub-programs) scraped from budget.ontario.ca and ontario.ca.

**Architecture:** Two-pass scraper stores budget data in three new Prisma models. Homepage KPI strip gains two budget tiles. A new `/budget` page shows the full expandable breakdown. All BigInt→number conversion happens in server components before any client boundary.

**Tech Stack:** Next.js 14 App Router, Prisma + PostgreSQL (Neon), axios + cheerio, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-ontario-budget-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add 3 new models |
| `lib/format.ts` | Create | `formatBudgetAmount`, `centsToNumber` |
| `lib/scraper/budget.ts` | Create | Two-pass budget scraper |
| `app/api/cron/scrape-budget/route.ts` | Create | Cron handler |
| `vercel.json` | Modify | Add annual cron entry |
| `app/components/bills/KPIStrip.tsx` | Modify | Add budget deficit + spend tiles |
| `app/page.tsx` | Modify | Add budget snapshot query |
| `app/components/layout/Masthead.tsx` | Modify | Add Budget nav link |
| `app/budget/page.tsx` | Create | Budget page (server component) |
| `app/components/budget/BudgetSummaryBar.tsx` | Create | Fiscal summary row |
| `app/components/budget/MinistryTable.tsx` | Create | Ministry list (server) |
| `app/components/budget/MinistryRow.tsx` | Create | Expandable row (client) |
| `tests/lib/format.test.ts` | Create | Unit tests for format utilities |
| `tests/lib/scraper/budget.test.ts` | Create | Unit tests for HTML parsers |

---

## Chunk 1: Foundation — Schema + Format Utility

### Task 1: Add Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add three models to the schema**

Append to the bottom of `prisma/schema.prisma`:

```prisma
model BudgetSnapshot {
  id            String           @id @default(cuid())
  fiscal_year   String           @unique
  total_revenue BigInt
  total_expense BigInt
  deficit       BigInt
  scraped_at    DateTime         @default(now()) @updatedAt
  ministries    BudgetMinistry[]
}

model BudgetMinistry {
  id         String          @id @default(cuid())
  snapshot   BudgetSnapshot  @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  snapshotId String
  name       String
  sector     String?
  amount     BigInt
  sort_order Int             @default(0)
  programs   BudgetProgram[]

  @@unique([snapshotId, name])
  @@index([snapshotId])
}

model BudgetProgram {
  id         String         @id @default(cuid())
  ministry   BudgetMinistry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  ministryId String
  name       String
  amount     BigInt
  sort_order Int            @default(0)

  @@unique([ministryId, name])
  @@index([ministryId])
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add_budget_models
```

Expected output: `✓ Your database is now in sync with your schema.`

Also generates `prisma/client` — confirm no TypeScript errors:

```bash
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add BudgetSnapshot, BudgetMinistry, BudgetProgram models"
```

---

### Task 2: Format utility

**Files:**
- Create: `lib/format.ts`
- Create: `tests/lib/format.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatBudgetAmount, centsToNumber } from '@/lib/format'

describe('centsToNumber', () => {
  it('converts bigint cents to dollar number', () => {
    expect(centsToNumber(146000000000n)).toBe(1460000000)
  })

  it('handles zero', () => {
    expect(centsToNumber(0n)).toBe(0)
  })
})

describe('formatBudgetAmount', () => {
  it('formats billions with one decimal', () => {
    expect(formatBudgetAmount(14600000000000n)).toBe('$14.6B')
  })

  it('formats exactly 1 billion', () => {
    expect(formatBudgetAmount(100000000000n)).toBe('$1.0B')
  })

  it('formats hundreds of billions', () => {
    expect(formatBudgetAmount(23250000000000n)).toBe('$232.5B')
  })

  it('rounds to one decimal place', () => {
    // $91.15B rounds to $91.2B
    expect(formatBudgetAmount(9115000000000n)).toBe('$91.2B')
  })

  it('formats millions (sub-billion)', () => {
    expect(formatBudgetAmount(37000000000n)).toBe('$370.0M')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/lib/format.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/format'`

- [ ] **Step 3: Implement the utility**

Create `lib/format.ts`:

```ts
/**
 * Convert bigint cents to plain number of dollars.
 * Use this before passing budget values as props to client components,
 * since BigInt is not JSON-serialisable.
 */
export function centsToNumber(cents: bigint): number {
  return Number(cents) / 100
}

/**
 * Format a bigint cents value as a human-readable dollar string.
 * Values >= $1B are shown as "$X.XB"; values < $1B as "$X.XM".
 * e.g. 14600000000000n → "$14.6B"
 */
export function formatBudgetAmount(cents: bigint): string {
  const dollars = Number(cents) / 100
  if (Math.abs(dollars) >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1)}B`
  }
  return `$${(dollars / 1_000_000).toFixed(1)}M`
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/format.test.ts
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts tests/lib/format.test.ts
git commit -m "feat: add formatBudgetAmount and centsToNumber utilities"
```

---

## Chunk 2: Scraper + Cron Route

### Task 3: Budget scraper (HTML parsers — unit-testable layer)

The scraper is split into two layers:
- **Pure parse functions** — accept HTML strings, return typed data (unit-testable, no network)
- **Fetch + orchestrate functions** — do HTTP, call parsers, call Prisma (integration only)

**Files:**
- Create: `lib/scraper/budget.ts`
- Create: `tests/lib/scraper/budget.test.ts`

- [ ] **Step 1: Write failing tests for the parse functions**

Create `tests/lib/scraper/budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseBudgetSummary, parseMinistryTocUrls, parseMinistryPrograms, normaliseMinistryName } from '@/lib/scraper/budget'

// Minimal fixture HTML that mimics the chapter-3 fiscal summary table structure.
// Real selectors must be verified against live HTML — these fixtures match the
// structure seen at budget.ontario.ca/2025/chapter-3.html on 2026-03-14.
const SUMMARY_HTML = `
<html><body>
<table>
  <caption>Ontario's Fiscal Plan</caption>
  <tbody>
    <tr><td>Total Revenue</td><td>$218.0</td></tr>
    <tr><td>Total Expense</td><td>$232.5</td></tr>
    <tr><td>Reserve</td><td>($0.1)</td></tr>
    <tr><td>Surplus/(Deficit)</td><td>($14.6)</td></tr>
  </tbody>
</table>
<table>
  <caption>Program Expense</caption>
  <tbody>
    <tr><td>Health Sector</td><td>$91.1</td></tr>
    <tr><td>Education Sector</td><td>$41.0</td></tr>
  </tbody>
</table>
</body></html>
`

const TOC_HTML = `
<html><body>
<ul>
  <li><a href="/page/expenditure-estimates-ministry-health-2025-26">Ministry of Health</a></li>
  <li><a href="/page/expenditure-estimates-ministry-education-2025-26">Ministry of Education</a></li>
</ul>
</body></html>
`

const MINISTRY_HTML = `
<html><body>
<table>
  <caption>Program Summary</caption>
  <tbody>
    <tr><td>Ontario Health Insurance Plan</td><td>$60.3</td></tr>
    <tr><td>Hospital Services</td><td>$24.1</td></tr>
  </tbody>
</table>
</body></html>
`

describe('normaliseMinistryName', () => {
  it('strips "Ministry of" prefix and lowercases', () => {
    expect(normaliseMinistryName('Ministry of Health')).toBe('health')
  })

  it('strips "Ministry of the" prefix', () => {
    expect(normaliseMinistryName('Ministry of the Attorney General')).toBe('attorney general')
  })

  it('handles names without prefix', () => {
    expect(normaliseMinistryName('Health Sector')).toBe('health sector')
  })

  it('trims whitespace', () => {
    expect(normaliseMinistryName('  Ministry of Finance  ')).toBe('finance')
  })
})

describe('parseBudgetSummary', () => {
  it('extracts total_revenue and total_expense in cents', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    // $218.0B = 21800000000000n cents
    expect(result.total_revenue).toBe(21800000000000n)
    expect(result.total_expense).toBe(23250000000000n)
  })

  it('computes deficit as total_expense - total_revenue', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    expect(result.deficit).toBe(result.total_expense - result.total_revenue)
  })

  it('returns ministry rows with amounts in cents', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    expect(result.ministries).toHaveLength(2)
    expect(result.ministries[0].name).toBe('Health Sector')
    expect(result.ministries[0].amount).toBe(9110000000000n)
  })

  it('throws if revenue row is missing', () => {
    expect(() => parseBudgetSummary('<html><body></body></html>')).toThrow()
  })
})

describe('parseMinistryTocUrls', () => {
  it('extracts ministry page URLs from TOC', () => {
    const urls = parseMinistryTocUrls(TOC_HTML)
    expect(urls).toHaveLength(2)
    expect(urls[0]).toContain('ministry-health')
  })

  it('filters to expenditure-estimates links only', () => {
    const html = '<html><body><a href="/page/other-link">Other</a><a href="/page/expenditure-estimates-ministry-finance-2025-26">Finance</a></body></html>'
    const urls = parseMinistryTocUrls(html)
    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('finance')
  })

  it('throws if no ministry URLs found', () => {
    expect(() => parseMinistryTocUrls('<html><body></body></html>')).toThrow()
  })
})

describe('parseMinistryPrograms', () => {
  it('extracts program name and amount in cents', () => {
    const programs = parseMinistryPrograms(MINISTRY_HTML)
    expect(programs).toHaveLength(2)
    expect(programs[0].name).toBe('Ontario Health Insurance Plan')
    expect(programs[0].amount).toBe(6030000000000n)
  })

  it('returns empty array if no program summary table found', () => {
    const programs = parseMinistryPrograms('<html><body></body></html>')
    expect(programs).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/lib/scraper/budget.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scraper/budget'`

- [ ] **Step 3: Implement the scraper**

Create `lib/scraper/budget.ts`:

```ts
// lib/scraper/budget.ts
//
// Scrapes the Ontario provincial budget from two public HTML sources:
//   Pass 1: budget.ontario.ca/2025/chapter-3.html  — fiscal summary + ministry totals
//   Pass 2: ontario.ca expenditure estimates TOC    — sub-program detail per ministry
//
// NOTE: HTML selectors are best-effort based on the 2025 budget page structure.
// Verify selectors after each annual budget release and update BUDGET_YEAR below.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { buildHeaders, checkRobotsTxt, delay } from './utils'

// ─── Constants ──────────────────────────────────────────────────────────────

const BUDGET_YEAR = '2025-26'
const BUDGET_SUMMARY_URL = 'https://budget.ontario.ca/2025/chapter-3.html'
const ESTIMATES_TOC_URL =
  'https://www.ontario.ca/page/expenditure-estimates-volume-1-table-contents-2025-26'
const ESTIMATES_BASE_URL = 'https://www.ontario.ca'
const FETCH_DELAY_MS = 800

// ─── Public result type ──────────────────────────────────────────────────────

export interface BudgetScrapeResult {
  fiscal_year: string
  ministries_scraped: number
  programs_scraped: number
  match_rate: number // 0–1: fraction of pass-1 ministries matched in pass-2
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface SummaryResult {
  total_revenue: bigint
  total_expense: bigint
  deficit: bigint
  ministries: Array<{ name: string; amount: bigint }>
}

interface ProgramRow {
  name: string
  amount: bigint
}

// ─── Dollar-string parser ────────────────────────────────────────────────────

/**
 * Parse an Ontario budget dollar string into bigint cents.
 * Handles formats: "$218.0", "$91.1", "($14.6)", "218,000" (millions in tables).
 * The chapter-3 table uses billions (e.g. "$91.1" = $91.1B).
 * The per-ministry tables use millions (e.g. "$60,310" = $60,310M).
 */
function parseDollarString(raw: string, unit: 'billions' | 'millions'): bigint {
  // Strip $, commas, parens (parens = negative in accounting notation)
  const negative = raw.includes('(')
  const cleaned = raw.replace(/[$(),\s]/g, '')
  const num = parseFloat(cleaned)
  if (isNaN(num)) throw new Error(`Cannot parse dollar string: "${raw}"`)
  const dollars = unit === 'billions' ? num * 1_000_000_000 : num * 1_000_000
  const cents = Math.round(dollars * 100)
  return negative ? BigInt(-cents) : BigInt(cents)
}

// ─── Exported parse functions (pure — accept HTML, return data) ──────────────

/**
 * Normalise a ministry name for fuzzy matching between pass-1 and pass-2 sources.
 * e.g. "Ministry of Health" → "health", "Health Sector" → "health sector"
 */
export function normaliseMinistryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^ministry of the\s+/i, '')
    .replace(/^ministry of\s+/i, '')
    .trim()
}

/**
 * Parse the fiscal summary and ministry totals from chapter-3 HTML.
 * Throws if the revenue row cannot be found (indicates page structure changed).
 */
export function parseBudgetSummary(html: string): SummaryResult {
  const $ = cheerio.load(html)

  // ── Fiscal summary table ──
  // Find the row containing "Total Revenue" in any table
  let total_revenue: bigint | null = null
  let total_expense: bigint | null = null

  $('table tr').each((_i, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const label = $(cells[0]).text().trim().toLowerCase()
    const valueText = $(cells[1]).text().trim()
    if (label.includes('total revenue')) {
      total_revenue = parseDollarString(valueText, 'billions')
    } else if (label.includes('total expense') || label.includes('total expenditure')) {
      total_expense = parseDollarString(valueText, 'billions')
    }
  })

  if (total_revenue === null) {
    throw new Error('[scraper/budget] Pass 1 failed: could not find Total Revenue row — page structure may have changed')
  }
  if (total_expense === null) {
    throw new Error('[scraper/budget] Pass 1 failed: could not find Total Expense row — page structure may have changed')
  }

  const deficit = (total_expense as bigint) - (total_revenue as bigint)

  // ── Ministry/sector spending table ──
  // Find a table that has a caption containing "Program" or "Expense" or "Sector"
  const ministries: Array<{ name: string; amount: bigint }> = []

  $('table').each((_i, table) => {
    const caption = $(table).find('caption').text().toLowerCase()
    if (!caption.includes('program') && !caption.includes('expense') && !caption.includes('sector')) return

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('td')
      if (cells.length < 2) return
      const name = $(cells[0]).text().trim()
      const valueText = $(cells[1]).text().trim()
      if (!name || !valueText.startsWith('$')) return
      try {
        const amount = parseDollarString(valueText, 'billions')
        if (amount > 0n) {
          ministries.push({ name, amount })
        }
      } catch {
        // skip unparseable rows
      }
    })
  })

  return { total_revenue: total_revenue as bigint, total_expense: total_expense as bigint, deficit, ministries }
}

/**
 * Parse expenditure estimates TOC page and return per-ministry page URLs.
 * Throws if no ministry URLs are found (would silently produce no sub-programs).
 */
export function parseMinistryTocUrls(html: string): string[] {
  const $ = cheerio.load(html)
  const urls: string[] = []

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    if (href.includes('expenditure-estimates-ministry')) {
      const full = href.startsWith('http') ? href : `${ESTIMATES_BASE_URL}${href}`
      urls.push(full)
    }
  })

  if (urls.length === 0) {
    throw new Error('[scraper/budget] Pass 2 TOC returned zero ministry URLs — page structure may have changed')
  }

  return urls
}

/**
 * Parse a per-ministry expenditure estimates page and return program rows.
 * Returns an empty array (does not throw) if no Program Summary table is found —
 * partial sub-program data is acceptable.
 */
export function parseMinistryPrograms(html: string): ProgramRow[] {
  const $ = cheerio.load(html)
  const programs: ProgramRow[] = []

  // Find a table whose caption contains "Program Summary" or "Summary"
  $('table').each((_i, table) => {
    const caption = $(table).find('caption').text().toLowerCase()
    if (!caption.includes('program') && !caption.includes('summary')) return

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('td')
      if (cells.length < 2) return
      const name = $(cells[0]).text().trim()
      const valueText = $(cells[1]).text().trim()
      if (!name || !valueText) return
      try {
        // Per-ministry tables use millions
        const amount = parseDollarString(valueText, 'millions')
        if (amount > 0n) {
          programs.push({ name, amount })
        }
      } catch {
        // skip unparseable rows
      }
    })
  })

  return programs
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const { data, status } = await axios.get<string>(url, {
    headers: buildHeaders(),
    timeout: 20_000,
    validateStatus: () => true, // handle non-200 manually
  })
  if (status !== 200) {
    throw new Error(`[scraper/budget] HTTP ${status} fetching ${url}`)
  }
  return data
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function scrapeBudget(): Promise<BudgetScrapeResult> {
  // ── Pass 1: fiscal summary + ministry totals ──────────────────────────────

  const pass1Allowed = await checkRobotsTxt('https://budget.ontario.ca', '/2025/chapter-3.html')
  if (!pass1Allowed) {
    throw new Error('[scraper/budget] robots.txt disallows scraping budget.ontario.ca')
  }

  const summaryHtml = await fetchHtml(BUDGET_SUMMARY_URL)
  const summary = parseBudgetSummary(summaryHtml)

  // Upsert the snapshot
  const snapshot = await prisma.budgetSnapshot.upsert({
    where: { fiscal_year: BUDGET_YEAR },
    create: {
      fiscal_year: BUDGET_YEAR,
      total_revenue: summary.total_revenue,
      total_expense: summary.total_expense,
      deficit: summary.deficit,
    },
    update: {
      total_revenue: summary.total_revenue,
      total_expense: summary.total_expense,
      deficit: summary.deficit,
    },
  })

  // Upsert ministry totals
  for (let i = 0; i < summary.ministries.length; i++) {
    const m = summary.ministries[i]
    await prisma.budgetMinistry.upsert({
      where: { snapshotId_name: { snapshotId: snapshot.id, name: m.name } },
      create: { snapshotId: snapshot.id, name: m.name, amount: m.amount, sort_order: i },
      update: { amount: m.amount, sort_order: i },
    })
  }

  // ── Pass 2: sub-programs ──────────────────────────────────────────────────

  const pass2Allowed = await checkRobotsTxt(
    'https://www.ontario.ca',
    '/page/expenditure-estimates-volume-1-table-contents-2025-26'
  )
  if (!pass2Allowed) {
    throw new Error('[scraper/budget] robots.txt disallows scraping ontario.ca')
  }

  const tocHtml = await fetchHtml(ESTIMATES_TOC_URL)
  const ministryUrls = parseMinistryTocUrls(tocHtml) // throws if empty

  // Build a lookup of normalised name → ministry db row
  const dbMinistries = await prisma.budgetMinistry.findMany({ where: { snapshotId: snapshot.id } })
  const ministryByNorm = new Map(dbMinistries.map((m) => [normaliseMinistryName(m.name), m]))

  let programs_scraped = 0
  let matched = 0
  let firstFetch = true

  for (const url of ministryUrls) {
    if (!firstFetch) await delay(FETCH_DELAY_MS)
    firstFetch = false

    try {
      const html = await fetchHtml(url)
      const programs = parseMinistryPrograms(html)

      // Derive ministry name from URL slug for matching
      // e.g. ".../expenditure-estimates-ministry-health-2025-26" → "health"
      const slug = url.split('/').pop() ?? ''
      const normSlug = slug
        .replace(/expenditure-estimates-ministry-/, '')
        .replace(/-\d{4}-\d{2}$/, '')
        .replace(/-/g, ' ')
        .trim()

      // Find matching ministry using normalised name or slug
      let dbMinistry = ministryByNorm.get(normSlug)
      if (!dbMinistry) {
        // Fallback: partial match — find any ministry whose normalised name contains the slug
        for (const [norm, m] of ministryByNorm) {
          if (norm.includes(normSlug) || normSlug.includes(norm)) {
            dbMinistry = m
            break
          }
        }
      }

      if (!dbMinistry) {
        console.warn(`[scraper/budget] No matching ministry for URL slug "${normSlug}" (${url})`)
        continue
      }

      matched++

      for (let i = 0; i < programs.length; i++) {
        const p = programs[i]
        await prisma.budgetProgram.upsert({
          where: { ministryId_name: { ministryId: dbMinistry.id, name: p.name } },
          create: { ministryId: dbMinistry.id, name: p.name, amount: p.amount, sort_order: i },
          update: { amount: p.amount, sort_order: i },
        })
        programs_scraped++
      }
    } catch (err) {
      console.warn(
        `[scraper/budget] Failed to scrape ministry URL ${url}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const match_rate = dbMinistries.length > 0 ? matched / dbMinistries.length : 0

  if (match_rate < 0.5) {
    console.warn(
      `[scraper/budget] Low ministry match rate: ${(match_rate * 100).toFixed(0)}% — ministry name normalisation may need updating`
    )
  }

  return {
    fiscal_year: BUDGET_YEAR,
    ministries_scraped: summary.ministries.length,
    programs_scraped,
    match_rate,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/lib/scraper/budget.test.ts
```

Expected: all PASS

> **Note:** The fixture HTML in the tests is a minimal approximation. After implementing, manually test against the live URL to verify selectors, then update fixtures if needed:
> ```bash
> curl -s https://budget.ontario.ca/2025/chapter-3.html | head -200
> ```

- [ ] **Step 5: Commit**

```bash
git add lib/scraper/budget.ts tests/lib/scraper/budget.test.ts
git commit -m "feat: add Ontario budget scraper (two-pass: summary + per-ministry programs)"
```

---

### Task 4: Cron route

**Files:**
- Create: `app/api/cron/scrape-budget/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cron route**

Create `app/api/cron/scrape-budget/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeBudget } from '@/lib/scraper/budget'

// Requires Vercel Pro — pass-2 issues ~29 HTTP requests with 800ms delays
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeBudget()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-budget]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 2: Add the annual cron to vercel.json**

In `vercel.json`, add inside the `"crons"` array:

```json
{ "path": "/api/cron/scrape-budget", "schedule": "0 20 1 4 *" }
```

The schedule `0 20 1 4 *` fires April 1st at 20:00 UTC (~16:00 EST) — after budget day publication. **Note:** Ontario's budget date varies; manual triggering is the primary workflow.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/scrape-budget/route.ts vercel.json
git commit -m "feat: add scrape-budget cron route and vercel.json schedule"
```

---

## Chunk 3: UI — Homepage + Budget Page

### Task 5: Homepage KPI strip update

**Files:**
- Modify: `app/components/bills/KPIStrip.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update KPIStrip to accept budget props**

Replace the contents of `app/components/bills/KPIStrip.tsx`:

```tsx
import Link from 'next/link'
import { formatBudgetAmount } from '@/lib/format'

interface KPIStripProps {
  torontoBills: number
  activeBills: number
  scandals30d: number
  passedLaws: number
  // null when no budget data has been scraped yet
  budgetDeficit: number | null
  budgetTotalSpend: number | null
  budgetFiscalYear: string | null
}

export default function KPIStrip({
  torontoBills,
  activeBills,
  scandals30d,
  passedLaws,
  budgetDeficit,
  budgetTotalSpend,
  budgetFiscalYear,
}: KPIStripProps) {
  const kpis = [
    { label: 'Toronto Bills', value: String(torontoBills), danger: torontoBills > 10, href: null },
    { label: 'Active Bills', value: String(activeBills), danger: false, href: null },
    { label: 'Scandals (30d)', value: String(scandals30d), danger: scandals30d > 0, href: null },
    { label: 'Passed Laws', value: String(passedLaws), danger: false, href: null },
  ]

  if (budgetDeficit !== null && budgetTotalSpend !== null) {
    const deficitBigint = BigInt(Math.round(budgetDeficit * 100))
    const spendBigint = BigInt(Math.round(budgetTotalSpend * 100))
    kpis.push(
      {
        label: `${budgetFiscalYear ?? ''} Deficit`.trim(),
        value: formatBudgetAmount(deficitBigint),
        danger: budgetDeficit > 0,
        href: '/budget',
      },
      {
        label: 'Annual Spend',
        value: formatBudgetAmount(spendBigint),
        danger: false,
        href: '/budget',
      }
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
      {kpis.map(({ label, value, danger, href }) => {
        const inner = (
          <div key={label} className="bg-white dark:bg-zinc-950 px-4 py-3 text-center">
            <div className={`text-2xl font-mono font-bold tabular-nums ${danger ? 'text-red-600 dark:text-red-400' : 'text-zinc-950 dark:text-white'}`}>
              {value}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {label}
            </div>
          </div>
        )
        return href ? (
          <Link key={label} href={href} className="hover:opacity-80 transition-opacity">
            {inner}
          </Link>
        ) : (
          <div key={label}>{inner}</div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add budget query to app/page.tsx**

In `app/page.tsx`, add the budget snapshot to the parallel `Promise.all`. Import `centsToNumber` at the top:

```ts
import { centsToNumber } from '@/lib/format'
```

Add to the destructured `Promise.all` array (after `torontoMpps`):

```ts
    prisma.budgetSnapshot.findFirst({
      orderBy: { fiscal_year: 'desc' },
      select: { deficit: true, total_expense: true, fiscal_year: true },
    }),
```

Destructure it:

```ts
  const [
    torontoBills,
    activeBillsCount,
    scandalsCount,
    passedLawsCount,
    topBills,
    recentNews,
    torontoMpps,
    budgetSnapshot,
  ] = await Promise.all([...])
```

Pass to `KPIStrip`:

```tsx
        <KPIStrip
          torontoBills={torontoBills}
          activeBills={activeBillsCount}
          scandals30d={scandalsCount}
          passedLaws={passedLawsCount}
          budgetDeficit={budgetSnapshot ? centsToNumber(budgetSnapshot.deficit) : null}
          budgetTotalSpend={budgetSnapshot ? centsToNumber(budgetSnapshot.total_expense) : null}
          budgetFiscalYear={budgetSnapshot?.fiscal_year ?? null}
        />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/components/bills/KPIStrip.tsx app/page.tsx
git commit -m "feat: add budget deficit and spend tiles to KPI strip"
```

---

### Task 6: Masthead navigation link

**Files:**
- Modify: `app/components/layout/Masthead.tsx`

- [ ] **Step 1: Add Budget nav link below the subtitle**

In `app/components/layout/Masthead.tsx`, add after the `<p>` subtitle tag and before the closing `</header>`:

```tsx
      <nav className="mt-3 flex justify-center gap-6 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        <a href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Home</a>
        <a href="/budget" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Budget</a>
      </nav>
```

Add the import at the top if not present (Masthead is a server component, plain `<a>` is fine here):

No import needed — plain `<a>` tags work for these simple nav links.

- [ ] **Step 2: Commit**

```bash
git add app/components/layout/Masthead.tsx
git commit -m "feat: add Budget nav link to masthead"
```

---

### Task 7: Budget page and components

**Files:**
- Create: `app/budget/page.tsx`
- Create: `app/components/budget/BudgetSummaryBar.tsx`
- Create: `app/components/budget/MinistryTable.tsx`
- Create: `app/components/budget/MinistryRow.tsx`

- [ ] **Step 1: Create MinistryRow (client component)**

Create `app/components/budget/MinistryRow.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface Program {
  id: string
  name: string
  amount: number // dollars
}

interface MinistryRowProps {
  name: string
  amount: number     // dollars
  totalExpense: number // dollars — for % calculation
  programs: Program[]
  formattedAmount: string
}

export default function MinistryRow({ name, amount, totalExpense, programs, formattedAmount }: MinistryRowProps) {
  const [open, setOpen] = useState(false)
  const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0

  return (
    <>
      <tr
        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="py-3 px-4 font-mono text-sm text-zinc-900 dark:text-white">
          <span className="mr-2 text-zinc-400">{open ? '▼' : '▶'}</span>
          {name}
        </td>
        <td className="py-3 px-4 font-mono text-sm text-right tabular-nums text-zinc-900 dark:text-white">
          {formattedAmount}
        </td>
        <td className="py-3 px-4 hidden sm:table-cell">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-sm h-2 overflow-hidden">
              <div
                className="h-2 bg-zinc-400 dark:bg-zinc-500 rounded-sm"
                style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 w-10 text-right tabular-nums">
              {pct.toFixed(1)}%
            </span>
          </div>
        </td>
      </tr>
      {open && programs.map((p) => (
        <tr key={p.id} className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <td className="py-2 px-4 pl-10 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {p.name}
          </td>
          <td className="py-2 px-4 font-mono text-xs text-right tabular-nums text-zinc-600 dark:text-zinc-400">
            {/* Format sub-program amount */}
            {formatProgramAmount(p.amount)}
          </td>
          <td className="hidden sm:table-cell" />
        </tr>
      ))}
    </>
  )
}

function formatProgramAmount(dollars: number): string {
  if (Math.abs(dollars) >= 1_000_000_000) {
    return `$${(dollars / 1_000_000_000).toFixed(1)}B`
  }
  return `$${(dollars / 1_000_000).toFixed(1)}M`
}
```

- [ ] **Step 2: Create MinistryTable (server component)**

Create `app/components/budget/MinistryTable.tsx`:

```tsx
import MinistryRow from './MinistryRow'
import { formatBudgetAmount, centsToNumber } from '@/lib/format'

interface Program {
  id: string
  name: string
  amount: bigint
}

interface Ministry {
  id: string
  name: string
  amount: bigint
  programs: Program[]
}

interface MinistryTableProps {
  ministries: Ministry[]
  totalExpense: bigint
}

export default function MinistryTable({ ministries, totalExpense }: MinistryTableProps) {
  const totalExpenseDollars = centsToNumber(totalExpense)

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b-2 border-zinc-950 dark:border-white">
          <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Ministry / Program</th>
          <th className="py-2 px-4 text-right text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Amount</th>
          <th className="py-2 px-4 hidden sm:table-cell text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Share</th>
        </tr>
      </thead>
      <tbody>
        {ministries.map((m) => (
          <MinistryRow
            key={m.id}
            name={m.name}
            amount={centsToNumber(m.amount)}
            totalExpense={totalExpenseDollars}
            formattedAmount={formatBudgetAmount(m.amount)}
            programs={m.programs.map((p) => ({
              id: p.id,
              name: p.name,
              amount: centsToNumber(p.amount),
            }))}
          />
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 3: Create BudgetSummaryBar (server component)**

Create `app/components/budget/BudgetSummaryBar.tsx`:

```tsx
import { formatBudgetAmount } from '@/lib/format'

interface BudgetSummaryBarProps {
  fiscalYear: string
  totalRevenue: bigint
  totalExpense: bigint
  deficit: bigint
  scrapedAt: Date
}

export default function BudgetSummaryBar({
  fiscalYear,
  totalRevenue,
  totalExpense,
  deficit,
  scrapedAt,
}: BudgetSummaryBarProps) {
  const isDeficit = deficit > 0n

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4 font-mono">
      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Revenue</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{formatBudgetAmount(totalRevenue)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Expenses</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{formatBudgetAmount(totalExpense)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            {isDeficit ? 'Deficit' : 'Surplus'}
          </div>
          <div className={`text-xl font-bold ${isDeficit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatBudgetAmount(deficit < 0n ? -deficit : deficit)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Fiscal Year</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{fiscalYear}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
        Last scraped: {scrapedAt.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}
        <a
          href={`https://budget.ontario.ca/${fiscalYear.split('-')[0]}/chapter-3.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Source: Ontario Budget {fiscalYear}
        </a>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Create the budget page**

Create `app/budget/page.tsx`:

```tsx
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import BudgetSummaryBar from '@/app/components/budget/BudgetSummaryBar'
import MinistryTable from '@/app/components/budget/MinistryTable'

export const dynamic = 'force-dynamic'

export default async function BudgetPage() {
  const snapshot = await prisma.budgetSnapshot.findFirst({
    orderBy: { fiscal_year: 'desc' },
    include: {
      ministries: {
        include: { programs: { orderBy: { amount: 'desc' } } },
        orderBy: { amount: 'desc' },
      },
    },
  })

  return (
    <main className="min-h-screen">
      <Masthead />
      <DatelineBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {snapshot ? (
          <>
            <section>
              <SectionDivider label={`${snapshot.fiscal_year} Ontario Budget`} />
              <BudgetSummaryBar
                fiscalYear={snapshot.fiscal_year}
                totalRevenue={snapshot.total_revenue}
                totalExpense={snapshot.total_expense}
                deficit={snapshot.deficit}
                scrapedAt={snapshot.scraped_at}
              />
            </section>

            <section>
              <SectionDivider label="Spending by Ministry" />
              <MinistryTable
                ministries={snapshot.ministries}
                totalExpense={snapshot.total_expense}
              />
            </section>
          </>
        ) : (
          <p className="text-sm text-zinc-400 font-mono py-12 text-center">
            Budget data not yet loaded. Run the scraper to populate.
          </p>
        )}
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Budget · Updated annually</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass + new format and budget parser tests pass

- [ ] **Step 7: Commit**

```bash
git add app/budget/ app/components/budget/
git commit -m "feat: add /budget page with ministry breakdown and expandable sub-programs"
```

---

## Post-Implementation: Verify Scraper Selectors

The HTML fixture tests use an approximated structure. After implementation, verify the live selectors work:

- [ ] **Manually trigger the cron route in dev:**

```bash
curl -H "x-cron-secret: test-secret" http://localhost:3000/api/cron/scrape-budget
```

Expected response: `{ "ok": true, "fiscal_year": "2025-26", "ministries_scraped": N, "programs_scraped": N, "match_rate": 0.X }`

- [ ] **If `ministries_scraped` is 0 or `match_rate` < 0.5:**

Inspect the live HTML and update selectors in `lib/scraper/budget.ts`:

```bash
curl -s https://budget.ontario.ca/2025/chapter-3.html | grep -i "revenue\|expense\|health\|education" | head -30
```

Update `parseBudgetSummary` table selectors as needed, update fixture HTML in tests, re-run tests.

- [ ] **Final integration commit if selectors were adjusted:**

```bash
git add lib/scraper/budget.ts tests/lib/scraper/budget.test.ts
git commit -m "fix: update budget scraper selectors to match live HTML"
```

---

## Production Deployment Checklist

- [ ] Run `npx prisma migrate deploy` against the production Neon database before deploying
- [ ] Confirm `CRON_SECRET` is set in Vercel environment variables
- [ ] Confirm Vercel plan is Pro (required for `maxDuration = 300`)
- [ ] Deploy, then manually trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/scrape-budget`
- [ ] Verify `/budget` page renders with data
