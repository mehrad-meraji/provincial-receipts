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
- Move `<DatelineBar />` from **below** the Masthead to **above** it in every page.
- Affected files: `app/page.tsx`, `app/budget/page.tsx`, `app/bills/[id]/page.tsx`, `app/mpps/[id]/page.tsx`
- No component changes — just swap render order.

### KPI Strip Removal
- Remove `<KPIStrip />` component and its data queries from `app/page.tsx`.
- Queries to remove: `torontoBills`, `activeBillsCount`, `scandalsCount`, `passedLawsCount`, and the `budgetSnapshot` (used only for KPI).
- Also remove the `topBillTitle` variable (was only used for the commented-out `TorontoAlertBanner`).
- The `KPIStrip.tsx` component file is left on disk (unused) — do not delete.

### Tab Navigation
- Replace the two `<Link>` items in `Masthead.tsx` nav with a `<TabNav />` client component.
- Tabs: **Home · Bills · MPPs · Budget** — each navigates to its URL route.
- Active tab detected via `usePathname()` — requires `'use client'` sub-component.
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
- Reuses existing `BillTable` component unchanged.

### Home page changes
- Remove from `app/page.tsx`:
  - `topBills` query
  - `Bills Section` JSX block (`SectionDivider` + `BillTable`)
  - `topBillTitle` variable

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
  1. `SectionDivider label="Toronto Area MPPs"` → filtered subset in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid using `<MPPCard />`
  2. `SectionDivider label="All MPPs"` → remainder in same grid
- Reuses existing `MPPCard` component unchanged.

### Home page changes
- Remove from `app/page.tsx`:
  - `torontoMpps` query
  - `Toronto Area MPPs` section JSX
  - The two-column grid wrapper (`grid lg:grid-cols-3`) — `ScandalFeed` expands to full width.

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

**Improve `normName` dedup key:** strip trailing digits *before* normalising, so `"health1"` and `"health"` collapse to the same key.

**Apply same cleanup to `parseMinistryPrograms`:** program row names get the same `cleanName` treatment.

### No DB migration needed
Cleaned names are written on the next scrape run. Existing dirty data remains until re-scraped. The admin panel (Section 5) provides manual correction in the meantime.

---

## Section 5: Budget Admin Panel

### New component: `app/admin/components/BudgetPanel.tsx`
- Added as a new tab in `app/admin/page.tsx` alongside existing panels.
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
| `PATCH` | `/api/admin/budget/ministry/[id]` | Update ministry name/amount |
| `DELETE` | `/api/admin/budget/ministry/[id]` | Delete ministry (cascades programs) |
| `POST` | `/api/admin/budget/ministry` | Create new ministry under current snapshot |
| `PATCH` | `/api/admin/budget/program/[id]` | Update program name/amount |
| `DELETE` | `/api/admin/budget/program/[id]` | Delete program |
| `POST` | `/api/admin/budget/program` | Create new program under a ministry |

All routes protected by existing Clerk auth middleware (same as other admin routes).

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
- `app/page.tsx` — remove KPI, bills section, MPPs section, related queries; reorder DatelineBar
- `app/budget/page.tsx` — reorder DatelineBar above Masthead
- `app/bills/[id]/page.tsx` — reorder DatelineBar; update breadcrumb
- `app/mpps/[id]/page.tsx` — reorder DatelineBar; update breadcrumb
- `app/components/layout/Masthead.tsx` — replace nav with `<TabNav />`
- `app/admin/page.tsx` — add Budget tab/panel
- `lib/scraper/budget.ts` — improve title cleanup in `parseBudgetSummary` and `parseMinistryPrograms`

### Untouched
- `app/components/bills/KPIStrip.tsx` — left on disk, just unused
- All existing admin panels, scandal pages, news components
- Prisma schema — no changes
