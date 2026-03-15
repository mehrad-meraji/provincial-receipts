# Scandal Classification Hardening & Admin Review UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce scandal false positives with a keyword gate and add a Clerk-authenticated admin page for reviewing pending scandals, hiding news articles, and overriding toronto-flagged bills.

**Architecture:** The AI classifier gains a keyword gate that routes borderline articles to a `scandal_review_status: 'pending'` queue instead of auto-flagging. A `middleware.ts` protects `/admin/*` via `@clerk/nextjs` v5. Three admin panels (scandal queue, news override, bills override) each have a dedicated server-side API route. The homepage gains a `hidden: false` filter.

**Tech Stack:** `@clerk/nextjs` v5, Prisma 7, Next.js 16 App Router, Vitest, Tailwind CSS v4, Neon PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-14-scandal-classification-admin-ui-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `excerpt`, `hidden`, `scandal_review_status` to `NewsEvent` |
| Modify | `lib/ai/classify.ts` | Add `ScandalReviewStatus` type, update `ArticleClassification`, keyword gate |
| Modify | `lib/scraper/news.ts` | Write `excerpt`, `hidden`, `scandal_review_status` to DB |
| Modify | `app/page.tsx` | Add `hidden: false` filter to news query |
| **Create** | `middleware.ts` | Clerk route protection for `/admin/*` and `/api/admin/*` |
| **Create** | `app/admin/page.tsx` | Server component — fetches all panel data, renders three panels |
| **Create** | `app/admin/components/ScandalQueue.tsx` | Client component — pending scandal list with confirm/reject |
| **Create** | `app/admin/components/NewsFeedOverride.tsx` | Client component — hide/unhide news articles |
| **Create** | `app/admin/components/BillsOverride.tsx` | Client component — remove/add toronto-flagged bills |
| **Create** | `app/api/admin/scandal-review/route.ts` | POST — confirm or reject scandal flag |
| **Create** | `app/api/admin/news-hide/route.ts` | POST — hide or unhide news article |
| **Create** | `app/api/admin/bill-flag/route.ts` | POST — add or remove toronto flag on bill |
| **Create** | `app/api/admin/bills-search/route.ts` | GET — search unflagged bills by title/sponsor |
| Modify | `tests/lib/ai/classify.test.ts` | Add tests for keyword gate and updated types |
| Modify | `.env.example` | Add Clerk env vars |

---

## Chunk 1: Schema and Classifier Changes

### Task 1: Update Prisma schema — add `NewsEvent` fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add three fields** to the `NewsEvent` model (after the `tags` field):

```prisma
  excerpt               String?
  hidden                Boolean  @default(false)
  scandal_review_status String?
```

Full updated `NewsEvent` model should look like:

```prisma
model NewsEvent {
  id                    String   @id @default(cuid())
  headline              String
  url                   String   @unique
  source                String
  published_at          DateTime
  topic                 String?
  sentiment             String?
  is_scandal            Boolean  @default(false)
  tags                  String[]
  excerpt               String?
  hidden                Boolean  @default(false)
  scandal_review_status String?
  bill                  Bill?    @relation(fields: [billId], references: [id])
  billId                String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

- [ ] **Generate and apply migration locally:**

```bash
npx prisma migrate dev --name add_news_admin_fields
```

Expected: migration file created, Prisma client regenerated.

- [ ] **Commit:**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: add excerpt, hidden, scandal_review_status to NewsEvent schema"
```

---

### Task 2: Write failing tests for updated `classify.ts`

**Files:**
- Modify: `tests/lib/ai/classify.test.ts`

- [ ] **Update the existing import on line 2** of the test file — merge `SCANDAL_KEYWORDS` into it:

```ts
import { parseClassification, SCANDAL_KEYWORDS } from '@/lib/ai/classify'
```

- [ ] **Append the new `describe` blocks** (no import statement — it's already merged above) to the end of the file:

```ts
describe('SCANDAL_KEYWORDS', () => {
  it('exports an array of strings', () => {
    expect(Array.isArray(SCANDAL_KEYWORDS)).toBe(true)
    expect(SCANDAL_KEYWORDS.length).toBeGreaterThan(0)
  })

  it('includes expected terms', () => {
    expect(SCANDAL_KEYWORDS).toContain('corruption')
    expect(SCANDAL_KEYWORDS).toContain('fraud')
    expect(SCANDAL_KEYWORDS).toContain('misconduct')
  })
})

describe('parseClassification — scandal_review_status', () => {
  it('always returns scandal_review_status: null', () => {
    const raw = JSON.stringify({ topic: 'ethics', sentiment: 'scandal', is_scandal: true, tags: [] })
    const result = parseClassification(raw)
    expect(result.scandal_review_status).toBeNull()
  })

  it('returns scandal_review_status: null for malformed JSON', () => {
    const result = parseClassification('not json')
    expect(result.scandal_review_status).toBeNull()
  })
})
```

- [ ] **Run tests to confirm they fail:**

```bash
pnpm test tests/lib/ai/classify.test.ts
```

Expected: FAIL — `SCANDAL_KEYWORDS is not exported`, `scandal_review_status` property not on result.

---

### Task 3: Update `classify.ts` — types, keyword gate

**Files:**
- Modify: `lib/ai/classify.ts`

- [ ] **Add `ScandalReviewStatus` type and update `ArticleClassification`** — replace the existing interface block (lines 19–24):

```ts
export type ScandalReviewStatus = 'pending' | 'confirmed' | 'rejected'

export interface ArticleClassification {
  topic: 'housing' | 'transit' | 'ethics' | 'environment' | 'finance' | 'other'
  sentiment: 'scandal' | 'critical' | 'neutral' | 'positive'
  is_scandal: boolean
  tags: string[]
  scandal_review_status: 'pending' | null
}
```

- [ ] **Update `DEFAULTS`** — add `scandal_review_status: null`:

```ts
const DEFAULTS: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
  scandal_review_status: null,
}
```

- [ ] **Update `parseClassification`** — add `scandal_review_status: null` to the return:

```ts
export function parseClassification(raw: string): ArticleClassification {
  try {
    const parsed = JSON.parse(raw)
    return {
      topic: parsed.topic ?? DEFAULTS.topic,
      sentiment: parsed.sentiment ?? DEFAULTS.sentiment,
      is_scandal: parsed.is_scandal ?? DEFAULTS.is_scandal,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      scandal_review_status: null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}
```

- [ ] **Add `SCANDAL_KEYWORDS` constant** and update `PROMPT_TEMPLATE` — add after `parseClassification`:

```ts
export const SCANDAL_KEYWORDS = [
  'corruption', 'misconduct', 'fraud', 'bribery', 'breach', 'unethical',
  'cover-up', 'coverup', 'scandal', 'probe', 'investigation', 'fired',
  'resigned', 'conflict of interest', 'kickback', 'inappropriate',
  'improper', 'illegal', 'lawsuit', 'charged', 'convicted',
]
```

- [ ] **Update `PROMPT_TEMPLATE`** — add scandal criteria before the JSON block:

```ts
const PROMPT_TEMPLATE = (headline: string, excerpt: string) => `
Classify this Ontario provincial politics news article.
Headline: "${headline}"
Excerpt: "${excerpt}"

Mark is_scandal: true ONLY for credible evidence of misconduct, corruption, ethical breach, or abuse of power. Routine policy criticism, controversy, or opposition complaints are NOT scandals.

Return valid JSON only, no prose:
{
  "topic": "housing" | "transit" | "ethics" | "environment" | "finance" | "other",
  "sentiment": "scandal" | "critical" | "neutral" | "positive",
  "is_scandal": boolean,
  "tags": string[]
}
`.trim()
```

- [ ] **Add keyword gate** inside `classifyArticle()` — replace the `return parseClassification(raw)` line (currently line ~73) with:

```ts
    const result = parseClassification(raw)
    const keywordMatch = SCANDAL_KEYWORDS.some(kw =>
      `${headline} ${excerpt}`.toLowerCase().includes(kw)
    )
    if (result.is_scandal && !keywordMatch) {
      return { ...result, is_scandal: false, scandal_review_status: 'pending' }
    }
    return { ...result, scandal_review_status: null }
```

- [ ] **Verify both `{ ...DEFAULTS }` return sites** — there are two in the file:
  1. `catch` block inside `parseClassification` — already covered by updated `DEFAULTS`
  2. `catch` block inside `classifyArticle` (line ~76) — also covered by `DEFAULTS`

  Confirm both return `scandal_review_status: null` via the spread. No code change needed if `DEFAULTS` is updated correctly.

- [ ] **Run classify tests:**

```bash
pnpm test tests/lib/ai/classify.test.ts
```

Expected: all tests PASS including the new ones.

- [ ] **Run full test suite:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/ai/classify.ts tests/lib/ai/classify.test.ts
git commit -m "feat: add scandal keyword gate and tighten classification prompt"
```

---

### Task 4: Update `news.ts` — write new fields to DB

**Files:**
- Modify: `lib/scraper/news.ts`

- [ ] **Update the manual default initialiser** (lines 114–119) — add `scandal_review_status: null`:

```ts
    let classification: ArticleClassification = {
      topic: 'other',
      sentiment: 'neutral',
      is_scandal: false,
      tags: [],
      scandal_review_status: null,
    }
```

- [ ] **Add `excerpt` to the `prisma.newsEvent.create` data block** — `excerpt` is already computed as `rawExcerpt.slice(0, 500)` on line ~99. Add it to the `data` object along with the two new fields:

```ts
      await prisma.newsEvent.create({
        data: {
          headline,
          url: item.link,
          source: item.sourceName,
          published_at,
          topic: classification.topic,
          sentiment: classification.sentiment,
          is_scandal: classification.is_scandal,
          tags: classification.tags,
          excerpt,
          hidden: false,
          scandal_review_status: classification.scandal_review_status,
          billId: linkedBill?.id ?? undefined,
        },
      })
```

- [ ] **Run full test suite:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add lib/scraper/news.ts
git commit -m "feat: store excerpt, hidden, scandal_review_status on NewsEvent"
```

---

### Task 5: Update `app/page.tsx` — add `hidden: false` filter

**Files:**
- Modify: `app/page.tsx`

- [ ] **Update the `recentNews` query** — add `where: { hidden: false }`:

```ts
    prisma.newsEvent.findMany({
      where: { hidden: false },
      orderBy: { published_at: 'desc' },
      take: 20,
    }),
```

- [ ] **Run tests:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add app/page.tsx
git commit -m "feat: filter hidden articles from homepage news feed"
```

---

## Chunk 2: Clerk Setup and Middleware

### Task 6: Install Clerk and add env vars

**Files:**
- Modify: `.env.example`, `package.json`

- [ ] **Install `@clerk/nextjs`:**

```bash
pnpm add @clerk/nextjs
```

- [ ] **Add to `.env.example`:**

```
# Clerk authentication (clerk.com) — for /admin route protection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_key_here"
```

- [ ] **Wrap the root layout** in `app/layout.tsx` — add `ClerkProvider` import and wrap the return. The full updated `RootLayout` function (preserve all existing font variables and classNames):

```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

Only the `ClerkProvider` wrapper and the `import { ClerkProvider } from '@clerk/nextjs'` line are new — everything else is unchanged from the current file.

- [ ] **Commit:**

```bash
git add .env.example app/layout.tsx package.json pnpm-lock.yaml
git commit -m "chore: install @clerk/nextjs and add env vars"
```

---

### Task 7: Create `middleware.ts`

**Files:**
- Create: `middleware.ts` (project root, same level as `package.json`)

- [ ] **Create the file:**

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isAdminRoute(req)) auth.protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

- [ ] **Run the dev server briefly to confirm it starts without error:**

```bash
pnpm dev
```

Expected: server starts, no middleware errors. Stop with Ctrl+C after confirming.

- [ ] **Commit:**

```bash
git add middleware.ts
git commit -m "feat: add Clerk middleware to protect /admin routes"
```

---

## Chunk 3: Admin API Routes

### Task 8: `POST /api/admin/scandal-review`

**Files:**
- Create: `app/api/admin/scandal-review/route.ts`

- [ ] **Create the file:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { ScandalReviewStatus } from '@/lib/ai/classify'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, action } = body as { id: string; action: 'confirm' | 'reject' }

  if (!id || !['confirm', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const status: ScandalReviewStatus = action === 'confirm' ? 'confirmed' : 'rejected'

  await prisma.newsEvent.update({
    where: { id },
    data: {
      is_scandal: action === 'confirm',
      scandal_review_status: status,
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Run tests:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add app/api/admin/scandal-review/route.ts
git commit -m "feat: add scandal-review admin API route"
```

---

### Task 9: `POST /api/admin/news-hide`

**Files:**
- Create: `app/api/admin/news-hide/route.ts`

- [ ] **Create the file:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, hidden } = body as { id: string; hidden: boolean }

  if (!id || typeof hidden !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await prisma.newsEvent.update({
    where: { id },
    data: { hidden },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit:**

```bash
git add app/api/admin/news-hide/route.ts
git commit -m "feat: add news-hide admin API route"
```

---

### Task 10: `POST /api/admin/bill-flag`

**Files:**
- Create: `app/api/admin/bill-flag/route.ts`

- [ ] **Create the file:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, action } = body as { id: string; action: 'add' | 'remove' }

  if (!id || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await prisma.bill.update({
    where: { id },
    data: { toronto_flagged: action === 'add' },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit:**

```bash
git add app/api/admin/bill-flag/route.ts
git commit -m "feat: add bill-flag admin API route"
```

---

### Task 11: `GET /api/admin/bills-search`

**Files:**
- Create: `app/api/admin/bills-search/route.ts`

- [ ] **Create the file:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''

  if (!q.trim()) {
    return NextResponse.json([])
  }

  const bills = await prisma.bill.findMany({
    where: {
      toronto_flagged: false,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { sponsor: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, bill_number: true, title: true, sponsor: true, status: true },
    take: 20,
  })

  return NextResponse.json(bills)
}
```

- [ ] **Run full test suite:**

```bash
pnpm test
```

- [ ] **Commit:**

```bash
git add app/api/admin/bills-search/route.ts
git commit -m "feat: add bills-search admin API route"
```

---

## Chunk 4: Admin UI

### Task 12: Create `ScandalQueue.tsx`

**Files:**
- Create: `app/admin/components/ScandalQueue.tsx`

- [ ] **Create the file:**

```tsx
'use client'

import { useState } from 'react'

interface ScandalItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  excerpt: string | null
}

export default function ScandalQueue({ initialItems }: { initialItems: ScandalItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: 'confirm' | 'reject') {
    setLoading(id)
    try {
      await fetch('/api/admin/scandal-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setItems(prev => prev.filter(item => item.id !== id))
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-400 font-mono">No pending scandal reviews.</p>
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="font-medium text-sm hover:underline">
                {item.headline}
              </a>
              <p className="text-xs text-zinc-400 font-mono">
                {item.source} · {new Date(item.published_at).toLocaleDateString('en-CA')}
              </p>
              {item.excerpt && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{item.excerpt}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(item.id, 'confirm')}
                disabled={loading === item.id}
                className="px-3 py-1 text-xs bg-ontario-red text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => handleAction(item.id, 'reject')}
                disabled={loading === item.id}
                className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Commit:**

```bash
git add app/admin/components/ScandalQueue.tsx
git commit -m "feat: add ScandalQueue admin component"
```

---

### Task 13: Create `NewsFeedOverride.tsx`

**Files:**
- Create: `app/admin/components/NewsFeedOverride.tsx`

- [ ] **Create the file:**

```tsx
'use client'

import { useState } from 'react'

interface NewsItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  hidden: boolean
}

export default function NewsFeedOverride({ initialItems }: { initialItems: NewsItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  async function toggleHidden(id: string, hidden: boolean) {
    setLoading(id)
    try {
      await fetch('/api/admin/news-hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hidden }),
      })
      setItems(prev => prev.map(item => item.id === id ? { ...item, hidden } : item))
    } finally {
      setLoading(null)
    }
  }

  const visible = items.filter(i => !i.hidden)
  const hidden = items.filter(i => i.hidden)

  function renderItem(item: NewsItem) {
    return (
      <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <div className="flex-1 min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-sm hover:underline truncate block">
            {item.headline}
          </a>
          <p className="text-xs text-zinc-400 font-mono">
            {item.source} · {new Date(item.published_at).toLocaleDateString('en-CA')}
          </p>
        </div>
        <button
          onClick={() => toggleHidden(item.id, !item.hidden)}
          disabled={loading === item.id}
          className="px-3 py-1 text-xs shrink-0 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          {item.hidden ? 'Unhide' : 'Hide'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>{visible.map(renderItem)}</div>
      {hidden.length > 0 && (
        <div>
          <button
            onClick={() => setShowHidden(v => !v)}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-mono mb-2"
          >
            {showHidden ? '▼' : '▶'} Hidden articles ({hidden.length})
          </button>
          {showHidden && <div className="opacity-50">{hidden.map(renderItem)}</div>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit:**

```bash
git add app/admin/components/NewsFeedOverride.tsx
git commit -m "feat: add NewsFeedOverride admin component"
```

---

### Task 14: Create `BillsOverride.tsx`

**Files:**
- Create: `app/admin/components/BillsOverride.tsx`

- [ ] **Create the file:**

```tsx
'use client'

import { useState } from 'react'

interface BillItem {
  id: string
  bill_number: string
  title: string
  sponsor: string
  status: string
}

export default function BillsOverride({ flaggedBills }: { flaggedBills: BillItem[] }) {
  const [bills, setBills] = useState(flaggedBills)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BillItem[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function search(q: string) {
    setQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/bills-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.filter((b: BillItem) => !bills.some(fb => fb.id === b.id)))
    } finally {
      setSearching(false)
    }
  }

  async function flagBill(bill: BillItem, action: 'add' | 'remove') {
    setLoading(bill.id)
    try {
      await fetch('/api/admin/bill-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bill.id, action }),
      })
      if (action === 'remove') {
        setBills(prev => prev.filter(b => b.id !== bill.id))
      } else {
        setBills(prev => [...prev, bill])
        setSearchResults(prev => prev.filter(b => b.id !== bill.id))
      }
    } finally {
      setLoading(null)
    }
  }

  function renderBill(bill: BillItem, action: 'add' | 'remove') {
    return (
      <div key={bill.id} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{bill.bill_number} — {bill.title}</p>
          <p className="text-xs text-zinc-400 font-mono">{bill.sponsor} · {bill.status}</p>
        </div>
        <button
          onClick={() => flagBill(bill, action)}
          disabled={loading === bill.id}
          className={`px-3 py-1 text-xs shrink-0 rounded disabled:opacity-50 ${
            action === 'remove'
              ? 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {action === 'remove' ? 'Remove' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Currently flagged ({bills.length})</h3>
        {bills.length === 0
          ? <p className="text-sm text-zinc-400 font-mono">No bills currently flagged.</p>
          : <div>{bills.map(b => renderBill(b, 'remove'))}</div>
        }
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Search unflagged bills</h3>
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search by title or sponsor…"
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 text-sm bg-transparent mb-2"
        />
        {searching && <p className="text-xs text-zinc-400 font-mono">Searching…</p>}
        {searchResults.length > 0 && (
          <div>{searchResults.map(b => renderBill(b, 'add'))}</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit:**

```bash
git add app/admin/components/BillsOverride.tsx
git commit -m "feat: add BillsOverride admin component"
```

---

### Task 15: Create `app/admin/page.tsx`

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Create the file:**

```tsx
import { prisma } from '@/lib/db'
import ScandalQueue from './components/ScandalQueue'
import NewsFeedOverride from './components/NewsFeedOverride'
import BillsOverride from './components/BillsOverride'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [pendingScandals, recentNews, flaggedBills] = await Promise.all([
    prisma.newsEvent.findMany({
      where: { scandal_review_status: 'pending' },
      orderBy: { published_at: 'desc' },
      select: { id: true, headline: true, url: true, source: true, published_at: true, excerpt: true },
    }),
    prisma.newsEvent.findMany({
      orderBy: { published_at: 'desc' },
      take: 50,
      select: { id: true, headline: true, url: true, source: true, published_at: true, hidden: true },
    }),
    prisma.bill.findMany({
      where: { toronto_flagged: true },
      orderBy: { impact_score: 'desc' },
      select: { id: true, bill_number: true, title: true, sponsor: true, status: true },
    }),
  ])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <h1 className="text-2xl font-bold font-mono">Admin</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Scandal Queue ({pendingScandals.length})
        </h2>
        <ScandalQueue initialItems={pendingScandals.map(n => ({
          ...n,
          published_at: n.published_at.toISOString(),
        }))} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          News Feed Override
        </h2>
        <NewsFeedOverride initialItems={recentNews.map(n => ({
          ...n,
          published_at: n.published_at.toISOString(),
        }))} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Toronto Bills Override
        </h2>
        <BillsOverride flaggedBills={flaggedBills} />
      </section>
    </main>
  )
}
```

- [ ] **Run full test suite:**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Run TypeScript check:**

```bash
pnpm exec tsc --noEmit
```

Expected: no type errors.

- [ ] **Commit:**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin page with scandal queue, news override, and bills override"
```

---

## Deployment

- [ ] **Apply schema migration to production** (before deploying app code):

```bash
DATABASE_URL="<production-neon-url>" npx prisma migrate deploy
```

- [ ] **Add Clerk env vars to Vercel** — in Vercel dashboard, add:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

- [ ] **Deploy to Vercel**

- [ ] **Create Clerk application** at clerk.com, add reviewer email addresses as users
