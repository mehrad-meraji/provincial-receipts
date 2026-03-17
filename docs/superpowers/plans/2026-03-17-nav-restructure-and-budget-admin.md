# Nav Restructure, List Pages & Budget Admin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure navigation to use tabs, move bills/MPPs to dedicated list pages, clean up budget scraper title issues, and add a budget admin panel.

**Architecture:** Incremental, section-by-section. Each chunk is self-contained and independently testable. New files are created before existing files are modified to minimise broken states.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Clerk auth, Tailwind CSS, TypeScript, Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-03-17-nav-restructure-and-budget-admin-design.md`

---

## Chunk 1: Layout Restructuring (DatelineBar, KPI, Tab Nav)

**Files:**
- Create: `app/components/layout/TabNav.tsx`
- Modify: `app/components/layout/Masthead.tsx`
- Modify: `app/page.tsx`
- Modify: `app/budget/page.tsx`
- Modify: `app/bills/[id]/page.tsx`
- Modify: `app/mpps/[id]/page.tsx`
- Modify: `app/scandals/[slug]/page.tsx`

---

### Task 1.1: Create TabNav client component

- [ ] **Create `app/components/layout/TabNav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Home',   href: '/' },
  { label: 'Bills',  href: '/bills' },
  { label: 'MPPs',   href: '/mpps' },
  { label: 'Budget', href: '/budget' },
] as const

export default function TabNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Site navigation" className="mt-3 flex justify-center gap-6 text-xs font-mono uppercase tracking-widest">
      {TABS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={
            isActive(href)
              ? 'text-zinc-950 dark:text-white border-b border-zinc-950 dark:border-white pb-0.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors'
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Verify file saved correctly** — check it exists at the right path.

---

### Task 1.2: Update Masthead to use TabNav

- [ ] **Edit `app/components/layout/Masthead.tsx`**

Replace the `import Link from 'next/link'` and the `<nav>` block. The final file should be:

```tsx
import TabNav from './TabNav'

export default function Masthead() {
  return (
    <header className="w-full border-b-4 border-zinc-950 dark:border-white py-6 px-4 text-center">
      {/* ASCII art - pre block with exact characters */}
      <pre
        className="text-[0.45rem] sm:text-[0.55rem] md:text-[0.65rem] leading-none select-none font-mono inline-block text-left"
        aria-hidden="true"
      >
        <span className="flex gap-4">
         {/* "FUCK" in Ontario red */}
          <span style={{ color: '#c8102e' }} className="dark:text-white block">
{`  █████▒█    ██  ▄████▄   ██ ▄█▀
▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒
▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░
░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄
░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄
 ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒
 ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░
 ░ ░    ░░░ ░ ░ ░        ░ ░░ ░
          ░     ░ ░      ░  ░
              ░`}
          </span>
          {/* "DOUG" in dark charcoal */}
          <span style={{ color: '#1a1a1a' }} className="dark:text-white block">
{`▓█████▄  ▒█████   █    ██    ▄████
▒██▀ ██▌▒██▒  ██▒ ██  ▓██▒  ██▒ ▀█▒
░██   █▌▒██░  ██▒▓██  ▒██░ ▒██░▄▄▄░
░▓█▄   ▌▒██   ██░▓▓█  ░██░ ░▓█  ██▓
░▒████▓ ░ ████▓▒░▒▒█████▓  ░▒▓███▀▒
 ▒▒▓  ▒ ░ ▒░▒░▒░ ░▒▓▒ ▒ ▒   ░▒   ▒
 ░ ▒  ▒   ░ ▒ ▒░ ░░▒░ ░ ░    ░   ░
 ░ ░  ░ ░ ░ ░ ▒   ░░░ ░ ░  ░ ░   ░
░        ░ ░     ░          ░   ░
`}
          </span>
        </span>

        {/* "FORD" in Ontario red */}
        <span style={{ color: '#c8102e' }} className="block mt-1">
{`  █████▒▒█████   ██▀███  ▓█████▄
▓██   ▒▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌
▒████ ░▒██░  ██▒▓██ ░▄█ ▒░██   █▌
░▓█▒  ░▒██   ██░▒██▀▀█▄  ░▓█▄   ▌
░▒█░    ░ ████▓▒░░██▓ ▒██▒░▒████▓
 ▒ ░    ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒
 ░        ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒
 ░ ░    ░ ░ ░ ▒    ░░   ░  ░ ░  ░
            ░ ░     ░        ░
                           ░`}
        </span>
      </pre>
      {/* Subtitle */}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
        Ontario&apos;s Premier Accountability Dashboard · Queen&apos;s Park Watch
      </p>
      <TabNav />
    </header>
  )
}
```

- [ ] **Commit**

```bash
git add app/components/layout/TabNav.tsx app/components/layout/Masthead.tsx
git commit -m "feat: add TabNav client component, replace Masthead nav links"
```

---

### Task 1.3: Reorder DatelineBar above Masthead on home page, remove KPI and bills/MPPs sections

Current `app/page.tsx` renders `<Masthead />` then `<DatelineBar />` and has `KPIStrip`, `Bills`, and `MPPs` sections. This task does a **complete file replacement** — replace the entire file with the content below. This single rewrite also covers the home page changes described in Sections 2 and 3 of the spec (Bills removal and MPPs/grid removal) so that Chunk 2 and Chunk 3 do NOT need to touch `app/page.tsx` again.

- [ ] **Replace the entire contents of `app/page.tsx`** with the following:

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Masthead from './components/layout/Masthead'
import DatelineBar from './components/layout/DatelineBar'
import SectionDivider from './components/layout/SectionDivider'
import ScandalFeed from './components/news/ScandalFeed'

// Always SSR — data changes with every cron run
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recentNews, recentScandals] = await Promise.all([
    prisma.newsEvent.findMany({
      where: { hidden: false },
      orderBy: { published_at: 'desc' },
      take: 20,
    }),
    prisma.scandal.findMany({
      where: { published: true },
      orderBy: { date_reported: 'desc' },
      include: {
        _count: { select: { legal_actions: true, news_links: true, bills: true, mpps: true } },
      },
    }),
  ])

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Scandals Section */}
        {recentScandals.length > 0 && (
          <section>
            <SectionDivider label="Documented Scandals" />
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
              {recentScandals.map((scandal) => {
                const dateLabel = new Date(scandal.date_reported).toLocaleDateString('en-CA', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })
                const badges = [
                  { label: 'legal actions', count: scandal._count.legal_actions },
                  { label: 'bills', count: scandal._count.bills },
                  { label: 'news stories', count: scandal._count.news_links },
                  { label: 'MPPs', count: scandal._count.mpps },
                ].filter(b => b.count > 0)
                return (
                  <div key={scandal.id} className="relative mb-8">
                    <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" />
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{dateLabel}</p>
                    <Link
                      href={`/scandals/${scandal.slug}`}
                      className="block border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <h2 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">{scandal.title}</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{scandal.summary}</p>
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {badges.map(b => (
                            <span key={b.label} className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">
                              {b.count} {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Queen's Park Watch */}
        <section>
          <SectionDivider label="Queen's Park Watch" />
          <ScandalFeed items={recentNews} />
        </section>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add app/page.tsx
git commit -m "feat: remove KPI strip, bills, MPPs from home page; reorder DatelineBar above Masthead"
```

---

### Task 1.4: Reorder DatelineBar on remaining pages

Each of these pages currently renders `<Masthead />` then `<DatelineBar />`. Swap the order to `<DatelineBar />` then `<Masthead />` in the JSX return.

- [ ] **Edit `app/budget/page.tsx`** — swap render order:

```tsx
// Before:
<Masthead />
<DatelineBar />

// After:
<DatelineBar />
<Masthead />
```

- [ ] **Edit `app/bills/[id]/page.tsx`** — swap render order AND update breadcrumb:

Swap `<Masthead />` / `<DatelineBar />` order. Also update the breadcrumb nav:
```tsx
// Before:
<Link href="/" className="hover:underline">Dashboard</Link>

// After:
<Link href="/bills" className="hover:underline">Bills</Link>
```

- [ ] **Edit `app/mpps/[id]/page.tsx`** — swap render order AND update breadcrumb:

Swap `<Masthead />` / `<DatelineBar />` order. Also update the breadcrumb nav:
```tsx
// Before:
<Link href="/" className="hover:underline">Dashboard</Link>

// After:
<Link href="/mpps" className="hover:underline">MPPs</Link>
```

- [ ] **Edit `app/scandals/[slug]/page.tsx`** — swap render order only (breadcrumb stays as `Dashboard → [title]` linking to `/`):

Swap `<Masthead />` / `<DatelineBar />` order.

- [ ] **Commit**

```bash
git add app/budget/page.tsx app/bills/[id]/page.tsx app/mpps/[id]/page.tsx app/scandals/[slug]/page.tsx
git commit -m "feat: reorder DatelineBar above Masthead on all pages; update bills/mpps breadcrumbs"
```

---

## Chunk 2: Bills List Page

> **Note:** The home page changes described in spec Section 2 ("Remove Bills section from home page") were already applied in Task 1.3 (full home page rewrite). Do NOT modify `app/page.tsx` again in this chunk.

**Files:**
- Create: `app/bills/page.tsx`

---

### Task 2.1: Create `/bills` list page

- [ ] **Create `app/bills/page.tsx`**

```tsx
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import BillTable from '@/app/components/bills/BillTable'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({
    where: { published: true },
    orderBy: { impact_score: 'desc' },
    include: { sponsor_mpp: { select: { party: true, riding: true } } },
  })

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section>
          <SectionDivider label="Bills" />
          <BillTable bills={bills} />
        </section>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add app/bills/page.tsx
git commit -m "feat: add /bills list page showing all published bills"
```

---

## Chunk 3: MPPs List Page

> **Note:** The home page changes described in spec Section 3 ("Remove MPPs section and grid wrapper from home page") were already applied in Task 1.3 (full home page rewrite). Do NOT modify `app/page.tsx` again in this chunk.

**Files:**
- Create: `app/mpps/page.tsx`

---

### Task 3.1: Create `/mpps` list page

- [ ] **Create `app/mpps/page.tsx`**

```tsx
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import MPPCard from '@/app/components/mpps/MPPCard'

export const dynamic = 'force-dynamic'

export default async function MPPsPage() {
  const mpps = await prisma.mPP.findMany({
    include: { _count: { select: { bills: true } } },
    orderBy: { name: 'asc' },
  })

  const torontoMpps = mpps.filter((m) => m.toronto_area)
  const otherMpps = mpps.filter((m) => !m.toronto_area)

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {torontoMpps.length > 0 && (
          <section>
            <SectionDivider label="Toronto Area MPPs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {torontoMpps.map((mpp) => (
                <MPPCard key={mpp.id} mpp={mpp} />
              ))}
            </div>
          </section>
        )}

        {otherMpps.length > 0 && (
          <section>
            <SectionDivider label="All MPPs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {otherMpps.map((mpp) => (
                <MPPCard key={mpp.id} mpp={mpp} />
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add app/mpps/page.tsx
git commit -m "feat: add /mpps list page showing all MPPs grouped by Toronto area"
```

---

## Chunk 4: Budget Scraper Title Cleanup

**Files:**
- Modify: `lib/scraper/budget.ts`
- Test: `tests/lib/budget.test.ts` (new)

---

### Task 4.1: Write failing tests for title cleanup

- [ ] **Create `tests/lib/budget.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { parseBudgetSummary, parseMinistryPrograms } from '@/lib/scraper/budget'

// Minimal HTML fixtures that exercise the title cleanup paths

const MINISTRY_HTML_WITH_FOOTNOTES = `
<table>
  <caption>Table 3.10 — Total Expense</caption>
  <thead><tr><th>Ministry</th><th>2025-26</th></tr></thead>
  <tbody>
    <tr><td>Ministry of Health1</td><td>$60,310</td></tr>
    <tr><td>Education²</td><td>$35,000</td></tr>
    <tr><td>Treasury Board Secretariat (Base)</td><td>$5,000</td></tr>
    <tr><td>Treasury Board Secretariat (Total)</td><td>$5,200</td></tr>
  </tbody>
</table>
`

const SUMMARY_HTML = `
<table>
  <tr><td>Total Revenue</td><td>$200.0</td></tr>
  <tr><td>Total Expense</td><td>$218.0</td></tr>
</table>
` + MINISTRY_HTML_WITH_FOOTNOTES

const PROGRAMS_HTML_WITH_FOOTNOTES = `
<table>
  <caption>Program Summary</caption>
  <tbody>
    <tr><td>Public Health Program1</td><td>$1,000</td></tr>
    <tr><td>Mental Health³</td><td>$500</td></tr>
  </tbody>
</table>
`

describe('parseBudgetSummary — title cleanup', () => {
  it('strips trailing ASCII digit footnotes from ministry names', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const names = result.ministries.map(m => m.name)
    expect(names).toContain('Ministry of Health')
    expect(names.some(n => /\d$/.test(n))).toBe(false)
  })

  it('strips unicode superscript digits from ministry names', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const names = result.ministries.map(m => m.name)
    expect(names).toContain('Education')
    expect(names.some(n => /[¹²³⁴⁵⁶⁷⁸⁹⁰]/.test(n))).toBe(false)
  })

  it('deduplicates (Base)/(Total) rows, keeping the larger amount', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const treasury = result.ministries.filter(m => m.name.toLowerCase().includes('treasury'))
    expect(treasury).toHaveLength(1)
    expect(treasury[0].amount).toBe(520_000_000_000n) // $5,200M in cents
  })
})

describe('parseMinistryPrograms — title cleanup', () => {
  it('strips trailing ASCII digit footnotes from program names', () => {
    const programs = parseMinistryPrograms(PROGRAMS_HTML_WITH_FOOTNOTES)
    expect(programs.map(p => p.name)).toContain('Public Health Program')
    expect(programs.some(p => /\d$/.test(p.name))).toBe(false)
  })

  it('strips unicode superscript digits from program names', () => {
    const programs = parseMinistryPrograms(PROGRAMS_HTML_WITH_FOOTNOTES)
    expect(programs.map(p => p.name)).toContain('Mental Health')
    expect(programs.some(p => /[¹²³⁴⁵⁶⁷⁸⁹⁰]/.test(p.name))).toBe(false)
  })
})
```

- [ ] **Run tests to verify they fail**

```bash
npx vitest run tests/lib/budget.test.ts
```

Expected: FAIL — `"Ministry of Health1"` is not cleaned yet.

---

### Task 4.2: Implement cleanup in scraper

- [ ] **Edit `lib/scraper/budget.ts` — update `cleanName` in `parseBudgetSummary`**

Find the existing `cleanName` block (around line 187):
```ts
let cleanName = rawName
  .replace(/\s*\([\s\w]+\)\s*$/i, '') // Strips (Base), (Total), (Total programs), etc
  .replace(/sup.*$/i, '')            // Strips sup tags/markers if any leaked in
  .replace(/\s+/g, ' ')
  .trim()
```

Replace with:
```ts
let cleanName = rawName
  .replace(/\s*\([\s\w]+\)\s*$/i, '') // Strips (Base), (Total), (Total programs), etc
  .replace(/sup.*$/i, '')              // Strips sup tags/markers if any leaked in
  .replace(/\d+$/, '')                 // Strip trailing footnote digits
  .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '')    // Strip unicode superscript digits
  .replace(/\s+/g, ' ')
  .trim()
```

- [ ] **Edit `lib/scraper/budget.ts` — update name cleanup in `parseMinistryPrograms`**

Find the existing name extraction in `parseMinistryPrograms` (around line 272):
```ts
const name = $(cells[0]).text().trim()
```

Replace with:
```ts
const rawProgramName = $(cells[0]).text().trim()
const name = rawProgramName
  .replace(/\d+$/, '')              // Strip trailing footnote digits
  .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, '') // Strip unicode superscript digits
  .replace(/\s+/g, ' ')
  .trim()
```

- [ ] **Run tests to verify they pass**

```bash
npx vitest run tests/lib/budget.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Commit**

```bash
git add lib/scraper/budget.ts tests/lib/budget.test.ts
git commit -m "fix: strip footnote digits and unicode superscripts from budget ministry/program names"
```

---

## Chunk 5: Budget Admin Panel

**Files:**
- Create: `app/admin/components/BudgetPanel.tsx`
- Create: `app/api/admin/budget/ministry/route.ts`
- Create: `app/api/admin/budget/ministry/[id]/route.ts`
- Create: `app/api/admin/budget/program/route.ts`
- Create: `app/api/admin/budget/program/[id]/route.ts`
- Modify: `app/admin/page.tsx`

---

### Task 5.1: Create POST/GET ministry route

- [ ] **Create `app/api/admin/budget/ministry/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, amount } = body as { name?: string; amount?: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
  }

  // Get the latest snapshot
  const snapshot = await prisma.budgetSnapshot.findFirst({ orderBy: { fiscal_year: 'desc' } })
  if (!snapshot) {
    return NextResponse.json({ error: 'No budget snapshot found. Run the scraper first.' }, { status: 404 })
  }

  // Convert millions → bigint cents: 1M = 100_000_000 cents
  const amountCents = BigInt(Math.round(Number(amount))) * 100_000_000n

  try {
    const ministry = await prisma.budgetMinistry.create({
      data: {
        snapshotId: snapshot.id,
        name: name.trim(),
        amount: amountCents,
        sort_order: 9999,
      },
    })
    return NextResponse.json(
      { ...ministry, amount: ministry.amount.toString() },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'A ministry with that name already exists.' }, { status: 409 })
    }
    throw err
  }
}
```

---

### Task 5.2: Create PATCH/DELETE ministry route

- [ ] **Create `app/api/admin/budget/ministry/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name } = body as { name?: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  try {
    const ministry = await prisma.budgetMinistry.update({
      where: { id },
      data: { name: name.trim() },
    })
    return NextResponse.json({ ...ministry, amount: ministry.amount.toString() })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'A ministry with that name already exists.' }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.budgetMinistry.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}
```

---

### Task 5.3: Create POST program route

- [ ] **Create `app/api/admin/budget/program/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ministryId, name, amount } = body as { ministryId?: string; name?: string; amount?: string }

  if (!ministryId) return NextResponse.json({ error: 'ministryId is required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
  }

  const amountCents = BigInt(Math.round(Number(amount))) * 100_000_000n

  try {
    const program = await prisma.budgetProgram.create({
      data: {
        ministryId,
        name: name.trim(),
        amount: amountCents,
        sort_order: 9999,
      },
    })
    return NextResponse.json(
      { ...program, amount: program.amount.toString() },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') return NextResponse.json({ error: 'Ministry not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'A program with that name already exists under this ministry.' }, { status: 409 })
    }
    throw err
  }
}
```

---

### Task 5.4: Create PATCH/DELETE program route

- [ ] **Create `app/api/admin/budget/program/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, amount } = body as { name?: string; amount?: string }

  const data: { name?: string; amount?: bigint } = {}
  if (name?.trim()) data.name = name.trim()
  if (amount !== undefined) {
    if (isNaN(Number(amount))) {
      return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
    }
    data.amount = BigInt(Math.round(Number(amount))) * 100_000_000n
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const program = await prisma.budgetProgram.update({ where: { id }, data })
    return NextResponse.json({ ...program, amount: program.amount.toString() })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'A program with that name already exists under this ministry.' }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.budgetProgram.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}
```

- [ ] **Commit API routes**

```bash
git add app/api/admin/budget/
git commit -m "feat: add budget admin API routes (ministry + program CRUD)"
```

---

### Task 5.5: Create BudgetPanel client component

- [ ] **Create `app/admin/components/BudgetPanel.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { formatBudgetAmount } from '@/lib/format'

interface Program {
  id: string
  name: string
  amount: string // bigint as string (cents)
}

interface Ministry {
  id: string
  name: string
  amount: string // bigint as string (cents)
  programs: Program[]
}

interface BudgetSnapshot {
  id: string
  fiscal_year: string
  ministries: Ministry[]
}

interface BudgetPanelProps {
  snapshot: BudgetSnapshot | null
}

function fmtAmount(amountStr: string): string {
  try {
    return formatBudgetAmount(BigInt(amountStr))
  } catch {
    return amountStr
  }
}

function InlineEdit({
  value,
  onSave,
  placeholder,
}: {
  value: string
  onSave: (newValue: string) => Promise<void>
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!draft.trim() || draft === value) { setEditing(false); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft.trim())
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="text-left hover:underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        title="Click to edit"
      >
        {value}
      </button>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setEditing(false)
        }}
        placeholder={placeholder}
        disabled={saving}
        className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm px-2 py-0.5 font-mono rounded w-64"
      />
      {saving && <span className="text-xs text-zinc-400">saving…</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  )
}

function AddProgramForm({
  ministryId,
  onAdd,
  onCancel,
}: {
  ministryId: string
  onAdd: (program: Program) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/budget/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ministryId, name: name.trim(), amount: amount.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add program')
      }
      const program = await res.json()
      onAdd(program)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2 ml-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Program name"
        className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm px-2 py-0.5 font-mono rounded w-48"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (M$)"
        type="number"
        min="0"
        className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm px-2 py-0.5 font-mono rounded w-28"
      />
      <span className="text-xs text-zinc-400 font-mono">M$</span>
      <button type="submit" disabled={saving} className="text-xs font-mono px-2 py-0.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded disabled:opacity-50">
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button type="button" onClick={onCancel} className="text-xs font-mono text-zinc-400 hover:text-zinc-600">
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  )
}

function AddMinistryForm({
  onAdd,
  onCancel,
}: {
  onAdd: (ministry: Ministry) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/budget/ministry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), amount: amount.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add ministry')
      }
      const ministry = await res.json()
      onAdd({ ...ministry, programs: [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ministry name"
        className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm px-2 py-0.5 font-mono rounded w-56"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (M$)"
        type="number"
        min="0"
        className="border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm px-2 py-0.5 font-mono rounded w-28"
      />
      <span className="text-xs text-zinc-400 font-mono">M$</span>
      <button type="submit" disabled={saving} className="text-xs font-mono px-2 py-0.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded disabled:opacity-50">
        {saving ? 'Adding…' : 'Add Ministry'}
      </button>
      <button type="button" onClick={onCancel} className="text-xs font-mono text-zinc-400 hover:text-zinc-600">
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  )
}

export default function BudgetPanel({ snapshot }: BudgetPanelProps) {
  const [ministries, setMinistries] = useState<Ministry[]>(snapshot?.ministries ?? [])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingProgramFor, setAddingProgramFor] = useState<string | null>(null)
  const [addingMinistry, setAddingMinistry] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  if (!snapshot) {
    return (
      <p className="text-sm text-zinc-400 font-mono py-4">
        No budget data. Run the scraper first.
      </p>
    )
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleMinistryRename(id: string, newName: string) {
    const res = await fetch(`/api/admin/budget/ministry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to rename ministry')
    }
    setMinistries((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    )
  }

  async function handleMinistryDelete(id: string) {
    if (!confirm('Delete this ministry and all its programs?')) return
    const res = await fetch(`/api/admin/budget/ministry/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setGlobalError(data.error ?? 'Failed to delete ministry')
      return
    }
    setMinistries((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleProgramRename(ministryId: string, programId: string, newName: string) {
    const res = await fetch(`/api/admin/budget/program/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to rename program')
    }
    setMinistries((prev) =>
      prev.map((m) =>
        m.id === ministryId
          ? { ...m, programs: m.programs.map((p) => (p.id === programId ? { ...p, name: newName } : p)) }
          : m
      )
    )
  }

  async function handleProgramAmountEdit(ministryId: string, programId: string, newAmount: string) {
    const res = await fetch(`/api/admin/budget/program/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: newAmount }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to update amount')
    }
    const updated = await res.json()
    setMinistries((prev) =>
      prev.map((m) =>
        m.id === ministryId
          ? { ...m, programs: m.programs.map((p) => (p.id === programId ? { ...p, amount: updated.amount } : p)) }
          : m
      )
    )
  }

  async function handleProgramDelete(ministryId: string, programId: string) {
    if (!confirm('Delete this program?')) return
    const res = await fetch(`/api/admin/budget/program/${programId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setGlobalError(data.error ?? 'Failed to delete program')
      return
    }
    setMinistries((prev) =>
      prev.map((m) =>
        m.id === ministryId
          ? { ...m, programs: m.programs.filter((p) => p.id !== programId) }
          : m
      )
    )
  }

  return (
    <div className="space-y-1">
      {globalError && (
        <p className="text-sm text-red-500 font-mono mb-2">{globalError}</p>
      )}

      {ministries.map((ministry) => (
        <div key={ministry.id} className="border border-zinc-200 dark:border-zinc-700">
          {/* Ministry row */}
          <div className="flex items-center gap-3 p-3">
            <button
              onClick={() => toggleExpand(ministry.id)}
              className="text-xs font-mono text-zinc-400 w-4 shrink-0"
              title={expanded.has(ministry.id) ? 'Collapse' : 'Expand'}
            >
              {expanded.has(ministry.id) ? '▼' : '▶'}
            </button>

            <div className="flex-1 min-w-0">
              <InlineEdit
                value={ministry.name}
                onSave={(newName) => handleMinistryRename(ministry.id, newName)}
              />
            </div>

            <span className="text-xs font-mono text-zinc-500 shrink-0">
              {fmtAmount(ministry.amount)}
              <span className="ml-1 text-[10px] text-zinc-400">(scraper-managed)</span>
            </span>

            <button
              onClick={() => handleMinistryDelete(ministry.id)}
              className="text-xs font-mono text-red-400 hover:text-red-600 shrink-0"
              title="Delete ministry"
            >
              ✕
            </button>
          </div>

          {/* Programs */}
          {expanded.has(ministry.id) && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 space-y-1">
              {ministry.programs.length === 0 && (
                <p className="text-xs text-zinc-400 font-mono py-1">No programs.</p>
              )}
              {ministry.programs.map((program) => (
                <div key={program.id} className="flex items-center gap-3 py-1 ml-4">
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={program.name}
                      onSave={(newName) => handleProgramRename(ministry.id, program.id, newName)}
                      placeholder="Program name"
                    />
                  </div>
                  <InlineEdit
                    value={String(BigInt(program.amount) / 100_000_000n)}
                    onSave={(newAmount) => handleProgramAmountEdit(ministry.id, program.id, newAmount)}
                    placeholder="Amount (M$)"
                  />
                  <span className="text-[10px] text-zinc-400 font-mono">M$ → {fmtAmount(program.amount)}</span>
                  <button
                    onClick={() => handleProgramDelete(ministry.id, program.id)}
                    className="text-xs font-mono text-red-400 hover:text-red-600 shrink-0"
                    title="Delete program"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {addingProgramFor === ministry.id ? (
                <AddProgramForm
                  ministryId={ministry.id}
                  onAdd={(program) => {
                    setMinistries((prev) =>
                      prev.map((m) =>
                        m.id === ministry.id ? { ...m, programs: [...m.programs, program] } : m
                      )
                    )
                    setAddingProgramFor(null)
                  }}
                  onCancel={() => setAddingProgramFor(null)}
                />
              ) : (
                <button
                  onClick={() => setAddingProgramFor(ministry.id)}
                  className="mt-1 ml-4 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  + Add Program
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {addingMinistry ? (
        <AddMinistryForm
          onAdd={(ministry) => {
            setMinistries((prev) => [...prev, ministry])
            setAddingMinistry(false)
          }}
          onCancel={() => setAddingMinistry(false)}
        />
      ) : (
        <button
          onClick={() => setAddingMinistry(true)}
          className="mt-2 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          + Add Ministry
        </button>
      )}
    </div>
  )
}
```

---

### Task 5.6: Wire BudgetPanel into AdminPage

- [ ] **Edit `app/admin/page.tsx`**

Add the snapshot fetch to the `Promise.all` and import + render `BudgetPanel`.

At the top of the file, add:
```tsx
import BudgetPanel from './components/BudgetPanel'
```

Add the snapshot fetch into the existing `Promise.all`:
```tsx
const [reports, pendingScandals, recentNews, budgetSnapshot] = await Promise.all([
  // ... existing 3 queries unchanged ...
  prisma.budgetSnapshot.findFirst({
    orderBy: { fiscal_year: 'desc' },
    include: {
      ministries: {
        include: { programs: { orderBy: { sort_order: 'asc' } } },
        orderBy: { sort_order: 'asc' },
      },
    },
  }),
])
```

Serialise bigints before passing to the client component. Add after the `Promise.all`:
```tsx
const budgetProp = budgetSnapshot
  ? {
      id: budgetSnapshot.id,
      fiscal_year: budgetSnapshot.fiscal_year,
      ministries: budgetSnapshot.ministries.map((m) => ({
        id: m.id,
        name: m.name,
        amount: m.amount.toString(),
        programs: m.programs.map((p) => ({
          id: p.id,
          name: p.name,
          amount: p.amount.toString(),
        })),
      })),
    }
  : null
```

Add the Budget section at the bottom of the `<main>` JSX (after the existing Bills section):
```tsx
<section>
  <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
    Budget ({budgetProp ? `${budgetProp.fiscal_year} — ${budgetProp.ministries.length} ministries` : 'no data'})
  </h2>
  <BudgetPanel snapshot={budgetProp} />
</section>
```

- [ ] **Commit**

```bash
git add app/admin/components/BudgetPanel.tsx app/admin/page.tsx
git commit -m "feat: add BudgetPanel to admin with inline editing, add/delete for ministries and programs"
```

---

## Final Verification

- [ ] **Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass (including the 5 new budget scraper tests).

- [ ] **Start dev server and manually verify**

```bash
npm run dev
```

Check:
1. Home page (`/`) — no KPI strip, no bills table, no MPPs sidebar; DatelineBar is above Masthead; Scandals + Queen's Park Watch visible; confirm no `import TorontoAlertBanner` remains in `app/page.tsx`
2. Tab nav — Home/Bills/MPPs/Budget tabs visible; active tab has underline; navigating to `/bills` highlights Bills tab, `/mpps` highlights MPPs, `/budget` highlights Budget, `/` highlights Home
3. `/bills` — all published bills shown in BillTable
4. `/mpps` — Toronto Area MPPs section + All MPPs section with MPPCard grid
5. `/bills/[id]` — breadcrumb shows "Bills →" linking to `/bills`
6. `/mpps/[id]` — breadcrumb shows "MPPs →" linking to `/mpps`
7. `/budget` — DatelineBar above Masthead, tabs visible
8. `/scandals/[slug]` — breadcrumb still shows "Dashboard →" linking to `/` (was NOT changed)
9. `/admin` — Budget section at bottom with ministry accordion; can rename ministries, expand to see programs, add program, delete program, add new ministry

- [ ] **Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore: final cleanup after nav restructure and budget admin implementation"
```
