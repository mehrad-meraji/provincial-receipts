# Ontario Budget Feature — Design Spec
**Date:** 2026-03-14
**Project:** fuckdougford (Ontario civic transparency site)
**Status:** Approved

---

## Overview

Add Ontario provincial budget data to the site: deficit, total spend, and per-ministry spending with expandable sub-programs. Data is scraped from public Ontario government HTML pages. Two surfaces: a teaser on the homepage KPI strip and a dedicated `/budget` page.

---

## Data Models

Three new Prisma models added to `prisma/schema.prisma`:

```prisma
model BudgetSnapshot {
  id            String           @id @default(cuid())
  fiscal_year   String           @unique  // e.g. "2025-26"
  total_revenue BigInt                    // in cents
  total_expense BigInt                    // in cents
  deficit       BigInt                    // total_expense - total_revenue; positive = deficit, negative = surplus
  scraped_at    DateTime         @default(now()) @updatedAt
  ministries    BudgetMinistry[]
}

model BudgetMinistry {
  id         String          @id @default(cuid())
  snapshot   BudgetSnapshot  @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  snapshotId String
  name       String          // "Ministry of Health"
  sector     String?         // "Health", "Education", etc.
  amount     BigInt          // operating + capital, in cents
  sort_order Int             @default(0)
  programs   BudgetProgram[]

  @@unique([snapshotId, name])
  @@index([snapshotId])
}

model BudgetProgram {
  id         String         @id @default(cuid())
  ministry   BudgetMinistry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  ministryId String
  name       String         // Vote/Item name
  amount     BigInt         // in cents
  sort_order Int            @default(0)

  @@unique([ministryId, name])
  @@index([ministryId])
}
```

**Notes:**
- All dollar amounts stored as `BigInt` cents to avoid float precision issues at the billion-dollar scale.
- `deficit` is always computed as `total_expense - total_revenue`. A negative value means a surplus.
- `@@unique([snapshotId, name])` and `@@unique([ministryId, name])` are the upsert keys.
- `onDelete: Cascade` ensures child rows are cleaned up if a snapshot is re-created.
- `scraped_at` uses `@updatedAt` so it reflects the most recent scrape, not the original insert time.
- A Prisma migration must be run against the production database before deployment: `prisma migrate deploy`.

---

## Currency Formatting Utility

**File:** `lib/format.ts` (new)

A shared utility for converting `BigInt` cents to human-readable strings is required in multiple places (KPI strip, summary bar, ministry table). `BigInt` is **not JSON-serialisable** — it must be converted to `number` or `string` in the server component before passing as props to any client component.

```ts
// Convert bigint cents to a human-readable string
// e.g. 9110000000000n (cents) → "$91.1B"
export function formatBudgetAmount(cents: bigint): string { ... }

// Convert bigint cents to plain number of dollars (for passing to client components)
export function centsToNumber(cents: bigint): number {
  return Number(cents) / 100
}
```

All server components must call `centsToNumber()` before passing budget values as props. No `BigInt` values reach the client component boundary.

---

## Scraper

**File:** `lib/scraper/budget.ts`

Two-pass scrape following existing patterns in `bills.ts` / `mpps.ts`, including `robots.txt` checks and polite delays.

### Pass 1 — Budget Summary
- **Source:** `https://budget.ontario.ca/2025/chapter-3.html`
- Call `checkRobotsTxt('https://budget.ontario.ca', '/2025/chapter-3.html')` before fetching (matches project convention in all existing scrapers)
- Parse the fiscal summary table: total revenue, total expense
- Compute `deficit = total_expense - total_revenue` (positive = deficit)
- Parse the sector spending table: ministry/sector names + dollar amounts
- Upsert `BudgetSnapshot` keyed on `fiscal_year` (update all fields including `scraped_at`)
- Upsert `BudgetMinistry` rows keyed on `[snapshotId, name]`
- **If Pass 1 fails (non-200 status, parse error, missing table), throw to abort the cron run entirely.**

### Pass 2 — Sub-programs
- **Source:** `https://www.ontario.ca/page/expenditure-estimates-volume-1-table-contents-2025-26`
- Call `checkRobotsTxt('https://www.ontario.ca', '/page/expenditure-estimates-volume-1-table-contents-2025-26')` before fetching
- Fetch the TOC page. **If the TOC fetch fails or returns no ministry URLs (zero matches), throw — do not silently proceed with empty sub-programs.**
- For each ministry URL (up to ~29 URLs), fetch the page and parse the "Program Summary" table (Vote name + amount)
- **Add `await delay(800)` between each per-ministry fetch** (slightly less than `bills.ts`'s 1000ms to reduce total wall time across ~29 requests)
- Match ministry names between Pass 1 and Pass 2 via fuzzy normalization (strip "Ministry of", lowercase, trim whitespace). **If fewer than 50% of Pass 1 ministries are matched, log a warning and surface in the cron response.**
- Upsert `BudgetProgram` rows keyed on `[ministryId, name]`
- If a single ministry fetch fails, log a warning and continue — partial sub-program data is acceptable

### Vercel function timeout
Pass 2 issues ~29 sequential HTTP requests with 800ms delays, totalling ~40+ seconds. The cron route must declare `export const maxDuration = 300` (5 minutes, requires Vercel Pro). If the project is on the Hobby plan, Pass 2 must be moved to a separate cron route or chunked across multiple invocations.

---

## Cron Route

**File:** `app/api/cron/scrape-budget/route.ts`

```ts
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
export const maxDuration = 300
```

Same `cron-auth` pattern as all existing cron routes — requires `CRON_SECRET` env var set in Vercel dashboard.

Returns: `{ ok: true, fiscal_year, ministries_scraped, programs_scraped, match_rate }`

**Cron schedule in `vercel.json`:** `0 20 1 4 *` (April 1st at 20:00 UTC ≈ 15:00–16:00 EST — after the budget is typically published). **Note:** Ontario's budget date varies by year (elections, prorogation). Manual triggering is the expected primary workflow; the annual cron is a backup only.

---

## Homepage Changes

**File:** `app/components/bills/KPIStrip.tsx`

Updated props interface:

```ts
type KPIStripProps = {
  torontoBills: number
  activeBills: number
  scandals30d: number
  passedLaws: number
  // New — both are plain numbers (dollars), null if no budget data exists
  budgetDeficit: number | null
  budgetTotalSpend: number | null
  budgetFiscalYear: string | null
}
```

Two new tiles appended:
- **Deficit** — formatted as `$14.6B`, labelled "Provincial Deficit", coloured red; negative value (surplus) shown in green
- **Total Spend** — formatted as `$232.5B`, labelled "Annual Spend"

Both tiles link to `/budget`. If `budgetDeficit` is `null`, tiles are omitted (graceful degradation — no budget data yet).

`app/page.tsx` gains one additional parallel query:
```ts
prisma.budgetSnapshot.findFirst({
  orderBy: { fiscal_year: 'desc' },
  select: { deficit: true, total_expense: true, fiscal_year: true },
})
```
The `BigInt` fields are converted via `centsToNumber()` before being passed as props to `KPIStrip`.

---

## Budget Page

**Files:**
- `app/budget/page.tsx` — server component
- `app/components/budget/BudgetSummaryBar.tsx` — server component
- `app/components/budget/MinistryTable.tsx` — server component (renders `MinistryRow`s)
- `app/components/budget/MinistryRow.tsx` — `'use client'` component (handles expand state)

### Data fetch
```ts
const snapshot = await prisma.budgetSnapshot.findFirst({
  orderBy: { fiscal_year: 'desc' },
  include: {
    ministries: {
      include: { programs: { orderBy: { amount: 'desc' } } },
      orderBy: { amount: 'desc' },
    },
  },
})
```
All `BigInt` fields on `snapshot`, `ministries`, and `programs` are converted to `number` (via `centsToNumber()`) before being passed to any component.

### Layout
```
MASTHEAD + DATELINE BAR
─────────────────────────────────────────────────────
SECTION: [fiscal_year] Ontario Budget
  BudgetSummaryBar:
    Revenue: $218.0B  |  Expenses: $232.5B  |  Deficit: $14.6B  |  Fiscal Year: 2025–26
─────────────────────────────────────────────────────
SECTION: Spending by Ministry
  MinistryTable:
    [MinistryRow × N]  — sorted by amount desc
    Each row: name | dollar amount | % of total | inline CSS width bar | expand chevron
    On expand: reveals BudgetProgram sub-rows (client state, useState)
─────────────────────────────────────────────────────
FOOTER: "Last scraped: [scraped_at date] · Source: Ontario Budget [fiscal_year]"
```

### MinistryRow
- `'use client'` component, local `useState` for open/closed
- Sub-programs rendered inline below the ministry row when expanded
- No charting library — percentage bar is `<div style={{ width: `${pct}%` }} />` with Tailwind colour class
- % of total computed as `(ministry.amount / snapshot.total_expense) * 100`

### Empty state
If no snapshot exists: mono-styled message "Budget data not yet loaded. Run the scraper to populate." consistent with existing empty state patterns.

---

## Navigation

**File:** `app/components/layout/Masthead.tsx`

Add a "Budget" link to the masthead navigation alongside any existing nav links, pointing to `/budget`.

---

## File Checklist

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `BudgetSnapshot`, `BudgetMinistry`, `BudgetProgram` models |
| *(migration)* | Run `prisma migrate dev` locally and `prisma migrate deploy` in production before deploy |
| `lib/format.ts` | New — `formatBudgetAmount`, `centsToNumber` utilities |
| `lib/scraper/budget.ts` | New — two-pass scraper |
| `app/api/cron/scrape-budget/route.ts` | New — cron handler with `maxDuration = 300` |
| `vercel.json` | Add annual cron entry `0 20 1 4 *` |
| `app/components/bills/KPIStrip.tsx` | Add `budgetDeficit`, `budgetTotalSpend`, `budgetFiscalYear` props + 2 new tiles |
| `app/page.tsx` | Add budget snapshot query; convert BigInt before passing to KPIStrip |
| `app/components/layout/Masthead.tsx` | Add "Budget" nav link |
| `app/budget/page.tsx` | New — budget page; convert BigInt before passing to components |
| `app/components/budget/BudgetSummaryBar.tsx` | New |
| `app/components/budget/MinistryTable.tsx` | New |
| `app/components/budget/MinistryRow.tsx` | New (client component) |

---

## Out of Scope

- Year-over-year comparison
- Inflation-adjusted figures
- Charting library
- Sub-sub-program level (standard account detail)
