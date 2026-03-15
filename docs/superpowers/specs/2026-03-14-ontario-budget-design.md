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
  deficit       BigInt                    // positive = deficit, in cents
  scraped_at    DateTime         @default(now())
  ministries    BudgetMinistry[]
}

model BudgetMinistry {
  id         String          @id @default(cuid())
  snapshot   BudgetSnapshot  @relation(fields: [snapshotId], references: [id])
  snapshotId String
  name       String          // "Ministry of Health"
  sector     String?         // "Health", "Education", etc.
  amount     BigInt          // operating + capital, in cents
  sort_order Int             @default(0)
  programs   BudgetProgram[]
}

model BudgetProgram {
  id         String         @id @default(cuid())
  ministry   BudgetMinistry @relation(fields: [ministryId], references: [id])
  ministryId String
  name       String         // Vote/Item name
  amount     BigInt         // in cents
  sort_order Int            @default(0)
}
```

All dollar amounts stored as `BigInt` cents to avoid float precision issues at the billion-dollar scale.

---

## Scraper

**File:** `lib/scraper/budget.ts`

Two-pass scrape following existing patterns in `bills.ts` / `mpps.ts`:

### Pass 1 — Budget Summary
- **Source:** `https://budget.ontario.ca/2025/chapter-3.html`
- Parse the fiscal summary table: total revenue, total expense, deficit
- Parse the sector spending table: ministry/sector names + dollar amounts
- Upsert a `BudgetSnapshot` row (keyed on `fiscal_year`) + `BudgetMinistry` rows

### Pass 2 — Sub-programs
- **Source:** `https://www.ontario.ca/page/expenditure-estimates-volume-1-table-contents-2025-26`
- Fetch the TOC page to extract per-ministry expenditure estimate URLs
- For each ministry page, parse the "Program Summary" table (Vote name + amount)
- Match ministry names between Pass 1 and Pass 2 via fuzzy normalization (strip "Ministry of", lowercase, trim whitespace)
- Upsert `BudgetProgram` rows under the matching `BudgetMinistry`

### Error handling
- If Pass 2 fails for a given ministry, log a warning and continue — partial data is acceptable
- If Pass 1 fails entirely, throw to abort the cron run

---

## Cron Route

**File:** `app/api/cron/scrape-budget/route.ts`

- Same `cron-auth` middleware as existing cron routes
- Calls `scrapeBudget()` from `lib/scraper/budget.ts`
- Returns `{ ok: true, fiscal_year, ministries_scraped, programs_scraped }`
- Added to `vercel.json` on schedule `0 6 1 4 *` (April 1st, 06:00 — Ontario budget day)
- Manually triggerable at any time

---

## Homepage Changes

**File:** `app/components/bills/KPIStrip.tsx`

Two new tiles appended to the existing strip, fetched server-side from the latest `BudgetSnapshot`:
- **Deficit** — formatted as `$14.6B`, labelled "Provincial Deficit", coloured red
- **Total Spend** — formatted as `$232.5B`, labelled "Annual Spend"

Both tiles link to `/budget`. If no `BudgetSnapshot` exists yet, tiles are hidden (graceful degradation).

`app/page.tsx` gains one additional parallel query: `prisma.budgetSnapshot.findFirst({ orderBy: { fiscal_year: 'desc' }, select: { deficit: true, total_expense: true, fiscal_year: true } })`.

---

## Budget Page

**File:** `app/budget/page.tsx`
**Components:** `app/components/budget/BudgetSummaryBar.tsx`, `app/components/budget/MinistryTable.tsx`, `app/components/budget/MinistryRow.tsx`

### Layout
```
MASTHEAD + DATELINE BAR
─────────────────────────────────────────────────────
SECTION: 2025–26 Ontario Budget
  BudgetSummaryBar:
    Revenue: $218.0B  |  Expenses: $232.5B  |  Deficit: $14.6B  |  Fiscal Year: 2025–26
─────────────────────────────────────────────────────
SECTION: Spending by Ministry
  MinistryTable:
    [MinistryRow × N]  — sorted by amount desc
    Each row: name | dollar amount | % of total | inline CSS width bar | expand chevron
    On expand (client component): reveals BudgetProgram sub-rows
─────────────────────────────────────────────────────
FOOTER: "Last scraped: [date] · Source: Ontario Budget 2025"
```

### MinistryRow expand behaviour
- `MinistryRow` is a `'use client'` component with local `useState` for open/closed
- Sub-programs rendered inline below the ministry row when expanded
- No external charting library — percentage bar is a `<div>` with `style={{ width: X% }}` and a Tailwind colour class

### Data fetch
```ts
const snapshot = await prisma.budgetSnapshot.findFirst({
  orderBy: { fiscal_year: 'desc' },
  include: { ministries: { include: { programs: true }, orderBy: { amount: 'desc' } } },
})
```

### Empty state
If no snapshot exists: display "Budget data not yet loaded. Run the scraper to populate." with a mono-styled empty state matching existing patterns.

---

## File Checklist

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `BudgetSnapshot`, `BudgetMinistry`, `BudgetProgram` models |
| `lib/scraper/budget.ts` | New — two-pass scraper |
| `app/api/cron/scrape-budget/route.ts` | New — cron handler |
| `vercel.json` | Add annual cron entry |
| `app/components/bills/KPIStrip.tsx` | Add deficit + spend tiles |
| `app/page.tsx` | Add budget snapshot query |
| `app/budget/page.tsx` | New — budget page |
| `app/components/budget/BudgetSummaryBar.tsx` | New |
| `app/components/budget/MinistryTable.tsx` | New |
| `app/components/budget/MinistryRow.tsx` | New (client component) |

---

## Out of Scope

- Year-over-year comparison
- Inflation-adjusted figures
- Charting library
- Sub-sub-program level (standard account detail)
