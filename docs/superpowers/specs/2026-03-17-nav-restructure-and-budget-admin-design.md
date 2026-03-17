# Design: Navigation Restructure, List Pages, Budget Cleanup & Admin Panel

**Date:** 2026-03-17
**Project:** fuckdougford (Ontario Accountability Dashboard)
**Approach:** Incremental, section-by-section (Option A)

---

## Overview

Five coordinated changes to restructure the site's navigation, move sections off the home page into dedicated routes, fix budget data quality, and add a budget admin panel.

---

## Section 1: Layout Restructuring

### DatelineBar Position
- Move `<DatelineBar />` so it is rendered **before** `<Masthead />` in JSX in every page's `return` — i.e. `<DatelineBar />` is the first child of `<main>`, followed by `<Masthead />`. DatelineBar is not moved inside the Masthead component.
- Affected files: `app/page.tsx`, `app/budget/page.tsx`, `app/bills/[id]/page.tsx`, `app/mpps/[id]/page.tsx`, `app/scandals/[slug]/page.tsx`
- No component changes — just swap render order in each page.

### KPI Strip Removal
- Remove `<KPIStrip />` component and its data queries from `app/page.tsx`.
- Queries to remove: `torontoBills`, `activeBillsCount`, `scandalsCount`, `passedLawsCount`, and the `budgetSnapshot` (used only for KPI).
- Also remove the `topBillTitle` variable (was only used for the commented-out `TorontoAlertBanner`).
- The `KPIStrip.tsx` component file is left on disk (unused) — do not delete.

### Tab Navigation
- Replace the two `<Link>` items in `Masthead.tsx` nav with a `<TabNav />` client component.
- Tabs: **Home · Bills · MPPs · Budget** — each navigates to its URL route.
- Active tab detected via `usePathname()` — requires `'use client'` sub-component.
- Active tab uses **prefix matching**: a tab is active if the current pathname starts with its route prefix (e.g. `/bills/[id]` activates the `Bills` tab, `/mpps/[id]` activates `MPPs`). Exception: `Home` uses exact match on `/` only.
- **No `Scandals` tab** — this is intentional. Scandals are home-page content surfaced via timeline and `ScandalFeed`; individual scandal pages (`/scandals/[slug]`) are reachable via links but are not a top-level nav destination. A scandals tab may be added in a future iteration.
- Active tab styled with a clear visual indicator (underline or border-bottom on the active item).
- `TabNav` is extracted into `app/components/layout/TabNav.tsx`.
- Masthead imports and renders `<TabNav />` in place of the old `<nav>` block.

**Resulting page header structure (all pages):**
```
┌─────────────────────────────────────────────────────────┐
│  Mon, March 17, 2026           Toronto · Ontario Leg.   │  ← DatelineBar
├─────────────────────────────────────────────────────────┤
│                  FUCK DOUG FORD (ASCII)                 │  ← Masthead
│         Ontario's Premier Accountability Dashboard      │
│   [ Home ]  [ Bills ]  [ MPPs ]  [ Budget ]             │  ← TabNav
└─────────────────────────────────────────────────────────┘
```

---

## Section 2: Bills List Page

### New route: `app/bills/page.tsx`
- Server component (`force-dynamic`).
- Fetches all published bills: `prisma.bill.findMany({ where: { published: true }, orderBy: { impact_score: 'desc' }, include: { sponsor_mpp: { select: { party: true, riding: true } } } })`.
- No `take` limit — show all published bills.
- Layout: `<DatelineBar />` → `<Masthead />` → `SectionDivider label="Bills"` → `<BillTable />` → footer.
- Footer: copy the footer from `app/page.tsx` — "Data sourced from Ontario Legislative Assembly · Updated every 6 hours".
- Reuses existing `BillTable` component unchanged.

### Home page changes
- Remove from `app/page.tsx`:
  - `topBills` query
  - `Bills Section` JSX block (`SectionDivider label="Bills Affecting Toronto"` + `BillTable`)
  - `topBillTitle` variable
  - The commented-out `<TorontoAlertBanner>` JSX line and the `import TorontoAlertBanner` import (dead after `topBillTitle` removal)
- The **Scandals section** (inline `recentScandals` query + timeline JSX) and the **Queen's Park Watch** `ScandalFeed` section **stay on the home page** — they are the primary content of the home page after bills and MPPs are moved out.

### Breadcrumb update
- `app/bills/[id]/page.tsx`: change breadcrumb from `Dashboard →` to `Bills →` with a link to `/bills`.

---

## Section 3: MPPs List Page

### New route: `app/mpps/page.tsx`
- Server component (`force-dynamic`).
- Fetches **all MPPs**, no `toronto_area` filter, no `take` limit:
  ```ts
  prisma.mPP.findMany({
    include: { _count: { select: { bills: true } } },
    orderBy: { name: 'asc' },
  })
  ```
- Layout: `<DatelineBar />` → `<Masthead />` → two sections:
  1. `SectionDivider label="Toronto Area MPPs"` → MPPs filtered by `toronto_area === true` in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid using `<MPPCard />`
  2. `SectionDivider label="All MPPs"` → remainder (where `toronto_area === false`) in same grid
- Reuses existing `MPPCard` component unchanged.
- Footer: copy the footer from `app/page.tsx` — "Data sourced from Ontario Legislative Assembly · Updated every 6 hours".

### Home page changes
- Remove from `app/page.tsx`:
  - `torontoMpps` query and the `import type { MPP }` at the top (unused after removal)
  - `Toronto Area MPPs` section JSX
  - The two-column grid wrapper (`grid-cols-1 lg:grid-cols-3`) — the `ScandalFeed` `<section>` moves out of the grid and becomes a top-level section. Also remove the `lg:col-span-2` class from the ScandalFeed `<section>` element since it's no longer inside a grid.

### Breadcrumb update
- `app/mpps/[id]/page.tsx`: change breadcrumb from `Dashboard →` to `MPPs →` with a link to `/mpps`.

---

## Section 4: Budget Title Cleanup (Scraper)

### Problem
Budget ministry and program names scraped from Ontario budget pages can contain:
- Footnote superscript numbers appended to names (e.g. `"Ministry of Health1"`)
- Unicode superscript digits (e.g. `"Education Programs²"`)
- Duplicates where `(Base)` and `(Total)` rows produce the same ministry under different norm keys

### Fix in `lib/scraper/budget.ts`

**Improve `cleanName` pipeline in `parseBudgetSummary`:**
```ts
let cleanName = rawName
  .replace(/\s*\([\s\w]+\)\s*$/i, '')    // Existing: strip (Base), (Total), etc.
  .replace(/sup.*$/i, '')                 // Existing: strip leaked sup markers
  .replace(/\d+$/, '')                    // NEW: strip trailing footnote digits
  .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '')       // NEW: strip unicode superscripts
  .replace(/\s+/g, ' ')
  .trim()
```

**`normName` dedup:** No separate change needed. Since `normName = normaliseMinistryName(cleanName)` is computed *after* `cleanName` is already stripped of trailing digits, `"Ministry of Health1"` → `cleanName = "Ministry of Health"` → `normName = "health"`. The existing dedup logic (prefer larger amount on collision) is unchanged and sufficient.

**Apply same cleanup to `parseMinistryPrograms`:** program row names get the same `cleanName` treatment.

### No DB migration needed
Cleaned names are written on the next scrape run. Existing dirty data remains until re-scraped. The admin panel (Section 5) provides manual correction in the meantime.

---

## Section 5: Budget Admin Panel

### New component: `app/admin/components/BudgetPanel.tsx`
- Added as a new `<section>` block at the bottom of `app/admin/page.tsx`, matching the existing pattern (stacked sections with `<h2>` headings — not client-side tabs).
- `AdminPage` (server component) fetches the snapshot in the `Promise.all` and **serialises all `bigint` fields to `string` before passing to `BudgetPanel`** (required because `BudgetPanel` is a client component and BigInt is not JSON-serialisable). The prop type is:
  ```ts
  {
    id: string;
    fiscal_year: string;
    ministries: Array<{
      id: string;
      name: string;
      amount: string; // bigint.toString() — cents
      programs: Array<{ id: string; name: string; amount: string }>
    }>
  } | null
  ```
  `BudgetPanel` converts `amount` strings back to BigInt only when calling `formatBudgetAmount` for display.
- If prop is `null`, `BudgetPanel` renders an empty-state message "No budget data. Run the scraper first."
- Shows the current budget snapshot's ministries in an expandable accordion list.
- Each ministry row:
  - Inline-editable name (click → edit field → Enter to save / Escape to cancel)
  - Read-only formatted amount (scraper-managed)
  - Delete button (with confirmation) — cascades to programs via Prisma `onDelete: Cascade`
  - Expand/collapse to reveal program sub-rows
- Each program sub-row:
  - Inline-editable name and amount
  - Delete button
- **"Add Program"** button per ministry — opens an inline form with name + amount fields
- **"Add Ministry"** button at list bottom — creates a new ministry under the current snapshot

### New API routes: `app/api/admin/budget/`

| Method | Path | Action |
|--------|------|--------|
| `PATCH` | `/api/admin/budget/ministry/[id]` | Update ministry name (amount is read-only) |
| `DELETE` | `/api/admin/budget/ministry/[id]` | Delete ministry (cascades programs) |
| `POST` | `/api/admin/budget/ministry` | Create new ministry under current snapshot |
| `PATCH` | `/api/admin/budget/program/[id]` | Update program name/amount |
| `DELETE` | `/api/admin/budget/program/[id]` | Delete program |
| `POST` | `/api/admin/budget/program` | Create new program under a ministry |

All routes protected by existing Clerk auth middleware (same pattern as `/api/admin/*`). API routes return `401` on auth failure (not a redirect) — `BudgetPanel` must check `response.ok` on every fetch and display an inline error message on failure. No optimistic UI updates — wait for the API response before re-rendering.

### State management strategy
`BudgetPanel` holds the full ministry+program list in local `useState` (initialised from the server prop). On each successful mutation (create/update/delete), update the local state directly — do **not** call `router.refresh()`. This matches the pattern used by `BillsPanel` and `ScandalsPanel` which manage their own local state after mutations.

### API request/response contracts

**`POST /api/admin/budget/ministry`**
- Body: `{ name: string, amount: string }` — amount is a dollar string in millions (e.g. `"1200"` = $1,200M), converted to BigInt cents in the route.
- "Current snapshot" resolved as: `prisma.budgetSnapshot.findFirst({ orderBy: { fiscal_year: 'desc' } })`.
- Response: `201` with the created `BudgetMinistry` record (amounts serialised as strings).
- On unique constraint violation (duplicate name under same snapshot): return `409` with `{ error: "A ministry with that name already exists." }`.

**`PATCH /api/admin/budget/ministry/[id]`**
- Body: `{ name?: string }` — **name only**. Ministry amount is read-only (scraper-managed); the route ignores any `amount` field sent in the body.
- Response: `200` with updated record.
- On unique constraint violation (duplicate name under same snapshot): return `409` with `{ error: "A ministry with that name already exists." }`.

**`DELETE /api/admin/budget/ministry/[id]`**
- No body. Response: `204`.

**`POST /api/admin/budget/program`**
- Body: `{ ministryId: string, name: string, amount: string }` — amount in millions string.
- Response: `201` with created `BudgetProgram` record.
- On unique constraint violation (duplicate name under same ministry): return `409` with `{ error: "A program with that name already exists under this ministry." }`.

**`PATCH /api/admin/budget/program/[id]`**
- Body: `{ name?: string, amount?: string }` — same convention.
- Response: `200` with updated record.
- On unique constraint violation: return `409` with same pattern as POST program.

**`DELETE /api/admin/budget/program/[id]`**
- No body. Response: `204`.

### Amount input UX
- Admin enters amounts as **whole millions of dollars** (e.g. `1200` means $1,200M = $1.2B).
- Input field shows a `M$` suffix label.
- Route converts: `BigInt(inputString) * 100_000_000n` — this matches the existing scraper convention where `parseDollarString` with `unit: 'millions'` also multiplies by `100_000_000n` (each million = 100,000,000 cents).
- Display uses existing `formatBudgetAmount(bigintCentsValue)` helper — same helper used on the budget page and home page KPIs.
- `BudgetPanel` receives `amount` as a `string` (already serialised by `AdminPage`). It converts back to BigInt (`BigInt(amountStr)`) only when calling `formatBudgetAmount` for display.

### No new DB models
`BudgetMinistry` and `BudgetProgram` models cover all required operations.

---

## File Change Summary

### New files
- `app/bills/page.tsx` — bills list page
- `app/mpps/page.tsx` — MPPs list page
- `app/components/layout/TabNav.tsx` — client component for tab bar
- `app/admin/components/BudgetPanel.tsx` — budget admin panel
- `app/api/admin/budget/ministry/route.ts` — POST create ministry
- `app/api/admin/budget/ministry/[id]/route.ts` — PATCH/DELETE ministry
- `app/api/admin/budget/program/route.ts` — POST create program
- `app/api/admin/budget/program/[id]/route.ts` — PATCH/DELETE program

### Modified files
- `app/page.tsx` — remove KPI, bills section, MPPs section, related queries; reorder DatelineBar above Masthead; scandals + news sections remain
- `app/budget/page.tsx` — reorder DatelineBar above Masthead
- `app/bills/[id]/page.tsx` — reorder DatelineBar above Masthead; update breadcrumb to link `/bills`
- `app/mpps/[id]/page.tsx` — reorder DatelineBar above Masthead; update breadcrumb to link `/mpps`
- `app/scandals/[slug]/page.tsx` — reorder DatelineBar above Masthead (consistency). **Breadcrumb stays as `Dashboard → [scandal title]` linking to `/`** — the home page remains the logical parent for scandals since there is no `/scandals` list page.
- `app/components/layout/Masthead.tsx` — replace nav with `<TabNav />`
- `app/admin/page.tsx` — add Budget section and fetch snapshot data in Promise.all
- `lib/scraper/budget.ts` — improve title cleanup in `parseBudgetSummary` and `parseMinistryPrograms`

### Already deleted (pre-existing, not part of this work)
- `app/scandals/page.tsx` — was already deleted before this spec; `/scandals` has no list page. Not in scope here.

### Untouched
- `app/components/bills/KPIStrip.tsx` — left on disk, just unused
- All existing admin panels, scandal detail pages, news components
- Prisma schema — no changes
