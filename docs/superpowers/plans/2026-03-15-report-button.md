# Report Button & Admin Reports Panel — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "report" button to every news item and bill detail page so visitors can flag errors, with an admin panel to review and action those reports.

**Architecture:** A new `Report` Prisma model stores flagged items (soft reference, no FK). A public `POST /api/report` route accepts visitor submissions (Cloudflare Turnstile + per-IP rate limit). Five Clerk-protected admin routes handle review. Two new shared client components (`ReportButton`, `ReportModal`) wire into existing news/bill pages. Two new admin client components (`ReportsPanel`, `ResolveModal`) plug into `app/admin/page.tsx`.

**Tech Stack:** Next.js 16 App Router · Prisma 7 + Neon PostgreSQL · `@clerk/nextjs` v7 · `@marsidev/react-turnstile` · `lucide-react` · Vitest · Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-15-report-button-design.md`

---

## File Map

**New files:**
- `prisma/schema.prisma` ← add `Report` model
- `.env.example` ← add two Turnstile env var stubs
- `lib/report/validate.ts` ← pure input validation, testable in isolation
- `app/api/report/route.ts` ← `POST /api/report` public endpoint
- `app/api/admin/reports/route.ts` ← `GET /api/admin/reports`
- `app/api/admin/reports/[id]/dismiss/route.ts` ← `POST` dismiss
- `app/api/admin/reports/[id]/resolve/route.ts` ← `POST` resolve + item update
- `app/api/admin/reports/[id]/target/route.ts` ← `GET` current field values for pre-fill
- `app/api/admin/reports/bulk/route.ts` ← `POST` bulk dismiss/resolve
- `app/components/shared/ReportButton.tsx` ← flag button, owns modal open state
- `app/components/shared/ReportModal.tsx` ← category checkboxes + Turnstile + submit
- `app/admin/components/ReportsPanel.tsx` ← report cards list + bulk action bar
- `app/admin/components/ResolveModal.tsx` ← per-item edit modal with pre-fill
- `tests/lib/report/validate.test.ts` ← unit tests for validation logic
- `tests/lib/api/report.test.ts` ← route handler tests for POST /api/report

**Modified files:**
- `prisma/schema.prisma` ← add `Report` model block
- `.env.example` ← add two vars
- `app/components/news/NewsItem.tsx` ← add `'use client'` + `<ReportButton>`
- `app/bills/[id]/page.tsx` ← add `<ReportButton>` in bill header
- `app/admin/page.tsx` ← add reports query + `<ReportsPanel>` section

---

## Chunk 1: Schema & Prerequisites

### Task 1: Add Report model, install package, update env example

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`

- [ ] **Step 1: Add Report model to schema**

In `prisma/schema.prisma`, append this model after the `SourceBackoff` model:

```prisma
model Report {
  id          String   @id @default(cuid())
  type        String   // 'news' | 'bill'
  targetId    String
  targetTitle String
  categories  String[]
  comment     String?
  status      String   @default("pending") // 'pending' | 'resolved' | 'dismissed'
  ip          String?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Push schema to production DB**

```bash
pnpm prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Install Turnstile React package and Lucide icons**

```bash
pnpm add @marsidev/react-turnstile lucide-react
```

Expected: both packages added to `dependencies` in `package.json`.

- [ ] **Step 4: Update .env.example**

Open `.env.example`. Add two lines (after existing entries):

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your_site_key_here"
TURNSTILE_SECRET_KEY="your_secret_key_here"
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma .env.example package.json pnpm-lock.yaml
git commit -m "feat: add Report model, install @marsidev/react-turnstile, add Turnstile env stubs"
```

---

## Chunk 2: Validation Library & Public API Route

### Task 2: Validation helper

**Files:**
- Create: `lib/report/validate.ts`
- Create: `tests/lib/report/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/report/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateReportInput } from '@/lib/report/validate'

describe('validateReportInput', () => {
  const valid = {
    type: 'news' as const,
    targetId: 'abc123',
    targetTitle: 'Some headline',
    categories: ['wrong-information'],
    turnstileToken: 'tok_123',
  }

  it('accepts a valid news report', () => {
    expect(validateReportInput(valid)).toBeNull()
  })

  it('accepts a valid bill report', () => {
    expect(validateReportInput({ ...valid, type: 'bill' })).toBeNull()
  })

  it('rejects invalid type', () => {
    expect(validateReportInput({ ...valid, type: 'unknown' as never })).toMatch(/type/)
  })

  it('rejects empty targetId', () => {
    expect(validateReportInput({ ...valid, targetId: '' })).toMatch(/targetId/)
  })

  it('rejects empty targetTitle', () => {
    expect(validateReportInput({ ...valid, targetTitle: '' })).toMatch(/targetTitle/)
  })

  it('rejects empty categories array', () => {
    expect(validateReportInput({ ...valid, categories: [] })).toMatch(/categories/)
  })

  it('rejects non-array categories', () => {
    expect(validateReportInput({ ...valid, categories: 'wrong' as never })).toMatch(/categories/)
  })

  it('rejects missing turnstileToken', () => {
    expect(validateReportInput({ ...valid, turnstileToken: '' })).toMatch(/turnstileToken/)
  })

  it('rejects other category without comment', () => {
    expect(validateReportInput({ ...valid, categories: ['other'] })).toMatch(/comment/)
  })

  it('accepts other category with comment', () => {
    expect(validateReportInput({ ...valid, categories: ['other'], comment: 'details here' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test tests/lib/report/validate.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validation helper**

Create `lib/report/validate.ts`:

```ts
export interface ReportInput {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
  categories: string[]
  comment?: string
  turnstileToken: string
}

/**
 * Returns null if valid, or an error string describing the first problem found.
 */
export function validateReportInput(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid body'
  const b = body as Record<string, unknown>

  if (b.type !== 'news' && b.type !== 'bill') {
    return 'type must be "news" or "bill"'
  }
  if (!b.targetId || typeof b.targetId !== 'string') {
    return 'targetId is required'
  }
  if (!b.targetTitle || typeof b.targetTitle !== 'string') {
    return 'targetTitle is required'
  }
  if (!Array.isArray(b.categories) || b.categories.length === 0) {
    return 'categories must be a non-empty array'
  }
  if (!b.turnstileToken || typeof b.turnstileToken !== 'string') {
    return 'turnstileToken is required'
  }
  if (
    (b.categories as string[]).includes('other') &&
    (!b.comment || typeof b.comment !== 'string' || (b.comment as string).trim() === '')
  ) {
    return 'comment is required when category is "other"'
  }
  return null
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test tests/lib/report/validate.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/report/validate.ts tests/lib/report/validate.test.ts
git commit -m "feat: add report input validation helper with tests"
```

---

### Task 3: POST /api/report route

**Files:**
- Create: `app/api/report/route.ts`
- Create: `tests/lib/api/report.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/api/report.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    report: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock global fetch for Turnstile verification
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '@/app/api/report/route'
import { prisma } from '@/lib/db'

const mockPrisma = prisma as unknown as {
  report: { count: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  type: 'news',
  targetId: 'item-1',
  targetTitle: 'Some headline',
  categories: ['wrong-information'],
  turnstileToken: 'tok_xyz',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.TURNSTILE_SECRET_KEY = 'test-secret'
})

it('returns 400 for invalid input', async () => {
  const res = await POST(makeRequest({ type: 'bad' }))
  expect(res.status).toBe(400)
})

it('returns 403 when Turnstile verification fails', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: false }),
  })
  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(403)
})

it('returns 429 when IP rate limit exceeded', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.count.mockResolvedValueOnce(5)
  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(429)
})

it('skips rate limit check and succeeds when IP header is absent', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.create.mockResolvedValueOnce({ id: 'r2' })

  const reqNoIp = new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // no x-forwarded-for
    body: JSON.stringify(validBody),
  })
  const res = await POST(reqNoIp)
  expect(res.status).toBe(200)
  expect(mockPrisma.report.count).not.toHaveBeenCalled()
})

it('inserts report and returns ok:true on success', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.count.mockResolvedValueOnce(0)
  mockPrisma.report.create.mockResolvedValueOnce({ id: 'r1' })

  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json).toEqual({ ok: true })
  expect(mockPrisma.report.create).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test tests/lib/api/report.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `app/api/report/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateReportInput } from '@/lib/report/validate'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 1. Validate input
  const validationError = validateReportInput(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { type, targetId, targetTitle, categories, comment, turnstileToken } =
    body as {
      type: string
      targetId: string
      targetTitle: string
      categories: string[]
      comment?: string
      turnstileToken: string
    }

  // 2. Verify Turnstile
  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    }
  )
  const verifyData = await verifyRes.json()
  if (verifyData.success !== true) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 })
  }

  // 3. Extract IP from Vercel-set header
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  // 4. Per-IP rate limit: max 5 reports per hour
  if (ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.report.count({
      where: { ip, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 5) {
      return NextResponse.json({ error: 'Too many reports' }, { status: 429 })
    }
  }

  // 5. Insert
  await prisma.report.create({
    data: { type, targetId, targetTitle, categories, comment, status: 'pending', ip },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test tests/lib/api/report.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/report/route.ts tests/lib/api/report.test.ts
git commit -m "feat: add POST /api/report with Turnstile verification and per-IP rate limiting"
```

---

## Chunk 3: Admin API Routes

### Task 4: GET /api/admin/reports

**Files:**
- Create: `app/api/admin/reports/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/reports/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reports = await prisma.report.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      type: true,
      targetId: true,
      targetTitle: true,
      categories: true,
      comment: true,
      status: true,
      createdAt: true,
      // ip intentionally omitted
    },
  })

  return NextResponse.json(
    reports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/reports/route.ts
git commit -m "feat: add GET /api/admin/reports"
```

---

### Task 5: POST /api/admin/reports/[id]/dismiss

**Files:**
- Create: `app/api/admin/reports/[id]/dismiss/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/reports/[id]/dismiss/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.report.update({
    where: { id },
    data: { status: 'dismissed' },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/reports/[id]/dismiss/route.ts
git commit -m "feat: add POST /api/admin/reports/[id]/dismiss"
```

---

### Task 6: POST /api/admin/reports/[id]/resolve

**Files:**
- Create: `app/api/admin/reports/[id]/resolve/route.ts`

Note: This route must handle two Prisma error codes:
- `P2025` — record not found (target item deleted): still mark report resolved, return `{ ok: true, warning: '...' }`
- `P2002` — unique constraint (duplicate URL): return `409`, do NOT update report status

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/reports/[id]/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const body = await req.json()

  // Update underlying item
  try {
    if (report.type === 'news') {
      const { url, topic, is_scandal, hidden } = body as {
        url?: string
        topic?: string
        is_scandal?: boolean
        hidden?: boolean
      }
      const data: Record<string, unknown> = {}
      if (url !== undefined) data.url = url
      if (topic !== undefined) data.topic = topic
      if (is_scandal !== undefined) data.is_scandal = is_scandal
      if (hidden !== undefined) data.hidden = hidden

      if (Object.keys(data).length > 0) {
        await prisma.newsEvent.update({ where: { id: report.targetId }, data })
      }
    } else if (report.type === 'bill') {
      const { url, status: billStatus, toronto_flagged } = body as {
        url?: string
        status?: string
        toronto_flagged?: boolean
      }
      const data: Record<string, unknown> = {}
      if (url !== undefined) data.url = url
      if (billStatus !== undefined) data.status = billStatus
      if (toronto_flagged !== undefined) data.toronto_flagged = toronto_flagged

      if (Object.keys(data).length > 0) {
        await prisma.bill.update({ where: { id: report.targetId }, data })
      }
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        // Unique constraint (e.g. duplicate URL) — do NOT resolve the report
        return NextResponse.json(
          { error: 'That URL is already used by another news item' },
          { status: 409 }
        )
      }
      if (err.code === 'P2025') {
        // Target item no longer exists — still resolve the report
        await prisma.report.update({ where: { id }, data: { status: 'resolved' } })
        return NextResponse.json({ ok: true, warning: 'target item no longer exists' })
      }
    }
    throw err
  }

  await prisma.report.update({ where: { id }, data: { status: 'resolved' } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/reports/[id]/resolve/route.ts
git commit -m "feat: add POST /api/admin/reports/[id]/resolve with P2025 and P2002 handling"
```

---

### Task 7: POST /api/admin/reports/bulk

**Files:**
- Create: `app/api/admin/reports/bulk/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/reports/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, action } = await req.json() as { ids: string[]; action: 'dismiss' | 'resolve' }

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => typeof id === 'string')) {
    return NextResponse.json({ error: 'ids must be a non-empty array of strings' }, { status: 400 })
  }
  if (action !== 'dismiss' && action !== 'resolve') {
    return NextResponse.json({ error: 'action must be "dismiss" or "resolve"' }, { status: 400 })
  }

  const status = action === 'dismiss' ? 'dismissed' : 'resolved'

  const result = await prisma.report.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })

  return NextResponse.json({ ok: true, count: result.count })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/reports/bulk/route.ts
git commit -m "feat: add POST /api/admin/reports/bulk for bulk dismiss/resolve"
```

---

### Task 8: GET /api/admin/reports/[id]/target

**Files:**
- Create: `app/api/admin/reports/[id]/target/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/admin/reports/[id]/target/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  if (report.type === 'news') {
    const item = await prisma.newsEvent.findUnique({
      where: { id: report.targetId },
      select: { url: true, topic: true, is_scandal: true, hidden: true },
    })
    if (!item) return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    return NextResponse.json(item)
  }

  if (report.type === 'bill') {
    const item = await prisma.bill.findUnique({
      where: { id: report.targetId },
      select: { url: true, status: true, toronto_flagged: true },
    })
    if (!item) return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    return NextResponse.json(item)
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/reports/[id]/target/route.ts
git commit -m "feat: add GET /api/admin/reports/[id]/target for ResolveModal pre-fill"
```

---

## Chunk 4: Public UI Components

### Task 9: ReportButton

**Files:**
- Create: `app/components/shared/ReportButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/components/shared/ReportButton.tsx
'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import ReportModal from './ReportModal'

interface ReportButtonProps {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
}

export default function ReportButton({ type, targetId, targetTitle }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        aria-label="Report an error"
      >
        <Flag size={12} />
        report
      </button>

      {isOpen && (
        <ReportModal
          type={type}
          targetId={targetId}
          targetTitle={targetTitle}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/shared/ReportButton.tsx
git commit -m "feat: add ReportButton component (flag icon + modal trigger)"
```

---

### Task 10: ReportModal

**Files:**
- Create: `app/components/shared/ReportModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/components/shared/ReportModal.tsx
'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

const CATEGORIES = [
  { slug: 'wrong-information', label: 'Wrong information' },
  { slug: 'broken-link',       label: 'Broken link' },
  { slug: 'misclassified',     label: 'Misclassified' },
  { slug: 'outdated',          label: 'Outdated' },
  { slug: 'spam-irrelevant',   label: 'Spam / irrelevant' },
  { slug: 'other',             label: 'Other' },
]

interface Props {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
  onClose: () => void
}

export default function ReportModal({ type, targetId, targetTitle, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const needsComment = selected.includes('other')
  const canSubmit =
    selected.length > 0 &&
    token !== null &&
    (!needsComment || comment.trim() !== '') &&
    !submitting

  function toggleCategory(slug: string) {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  async function handleSubmit() {
    if (!canSubmit || !token) return
    setSubmitting(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId,
          targetTitle,
          categories: selected,
          comment: comment.trim() || undefined,
          turnstileToken: token,
        }),
      })
      setDone(true)
      setTimeout(onClose, 1500)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 shadow-lg w-full max-w-sm mx-4 p-5 space-y-4">
        {done ? (
          <p className="text-sm font-mono text-center text-zinc-600 dark:text-zinc-300 py-4">
            Thanks for your report.
          </p>
        ) : (
          <>
            <h2 className="text-sm font-semibold font-mono">Report an error</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{targetTitle}</p>

            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <label key={cat.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="rounded"
                  />
                  {cat.label}
                </label>
              ))}
            </div>

            {needsComment && (
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Please describe the issue…"
                rows={3}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 resize-none"
              />
            )}

            {!needsComment && (
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Additional context (optional)"
                rows={2}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 resize-none"
              />
            )}

            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setToken}
              options={{ size: 'invisible' }}
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40"
              >
                {submitting ? 'sending…' : 'submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/shared/ReportModal.tsx
git commit -m "feat: add ReportModal with category checkboxes, Turnstile widget, and submit logic"
```

---

## Chunk 5: Admin UI Components

### Task 11: ReportsPanel

**Files:**
- Create: `app/admin/components/ReportsPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/admin/components/ReportsPanel.tsx
'use client'

import { useState } from 'react'
import ResolveModal from './ResolveModal'

export interface ReportItem {
  id: string
  type: string
  targetId: string
  targetTitle: string
  categories: string[]
  comment: string | null
  status: string
  createdAt: string
}

interface Props {
  initialReports: ReportItem[]
}

export default function ReportsPanel({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [resolveTarget, setResolveTarget] = useState<ReportItem | null>(null)

  function removeReport(id: string) {
    setReports(prev => prev.filter(r => r.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function selectAll() {
    if (selected.size === reports.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(reports.map(r => r.id)))
    }
  }

  async function handleDismiss(id: string) {
    setLoading(id)
    try {
      await fetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST' })
      removeReport(id)
    } finally {
      setLoading(null)
    }
  }

  async function handleBulk(action: 'dismiss' | 'resolve') {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setLoading('bulk')
    try {
      await fetch('/api/admin/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      })
      ids.forEach(id => removeReport(id))
    } finally {
      setLoading(null)
    }
  }

  if (reports.length === 0) {
    return <p className="text-sm text-zinc-400 font-mono">No pending reports.</p>
  }

  return (
    <>
      {resolveTarget && (
        <ResolveModal
          report={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={id => { removeReport(id); setResolveTarget(null) }}
        />
      )}

      {/* Bulk action bar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={selected.size === reports.length && reports.length > 0}
          onChange={selectAll}
          className="rounded"
          aria-label="Select all"
        />
        <span className="text-xs text-zinc-400 font-mono">{selected.size} selected</span>
        <button
          onClick={() => handleBulk('dismiss')}
          disabled={selected.size === 0 || loading === 'bulk'}
          className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
        >
          dismiss selected
        </button>
        <button
          onClick={() => handleBulk('resolve')}
          disabled={selected.size === 0 || loading === 'bulk'}
          className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
        >
          mark resolved
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div
            key={report.id}
            className={`border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-2 transition-opacity ${loading === report.id ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(report.id)}
                onChange={() => toggleSelect(report.id)}
                className="rounded mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${report.type === 'news' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
                    {report.type}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {new Date(report.createdAt).toLocaleDateString('en-CA')}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {report.targetTitle}
                </p>
                <div className="flex flex-wrap gap-1">
                  {report.categories.map(cat => (
                    <span key={cat} className="text-xs font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
                {report.comment && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{report.comment}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDismiss(report.id)}
                disabled={loading === report.id}
                className="px-3 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                dismiss
              </button>
              <button
                onClick={() => setResolveTarget(report)}
                disabled={loading === report.id}
                className="px-3 py-1 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50"
              >
                resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/components/ReportsPanel.tsx
git commit -m "feat: add ReportsPanel admin component with bulk actions and dismiss/resolve buttons"
```

---

### Task 12: ResolveModal

**Files:**
- Create: `app/admin/components/ResolveModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/admin/components/ResolveModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { ReportItem } from './ReportsPanel'

const NEWS_TOPICS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other']
const BILL_STATUSES = [
  'First Reading',
  'Second Reading',
  'Committee',
  'Third Reading',
  'Royal Assent',
  'Withdrawn',
  'Defeated',
]

interface TargetNews {
  url: string
  topic: string | null
  is_scandal: boolean
  hidden: boolean
}

interface TargetBill {
  url: string
  status: string
  toronto_flagged: boolean
}

interface Props {
  report: ReportItem
  onClose: () => void
  onResolved: (id: string) => void
}

export default function ResolveModal({ report, onClose, onResolved }: Props) {
  const [fetchState, setFetchState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [newsFields, setNewsFields] = useState<TargetNews | null>(null)
  const [billFields, setBillFields] = useState<TargetBill | null>(null)
  const [saving, setSaving] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTarget() {
      try {
        const res = await fetch(`/api/admin/reports/${report.id}/target`)
        if (!res.ok) { setFetchState('error'); return }
        const data = await res.json()
        if (report.type === 'news') setNewsFields(data)
        else setBillFields(data)
        setFetchState('ready')
      } catch {
        setFetchState('error')
      }
    }
    loadTarget()
  }, [report.id, report.type])

  async function handleSave() {
    setSaving(true)
    setInlineError(null)
    const payload = report.type === 'news' ? newsFields : billFields
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) {
        const data = await res.json()
        setInlineError(data.error ?? 'URL conflict')
        return
      }
      onResolved(report.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 shadow-lg w-full max-w-md mx-4 p-5 space-y-4">
        <h2 className="text-sm font-semibold font-mono">Resolve: {report.targetTitle}</h2>

        {fetchState === 'loading' && (
          <p className="text-xs text-zinc-400 font-mono">Loading…</p>
        )}

        {fetchState === 'error' && (
          <p className="text-xs text-red-500 font-mono">Could not load target data.</p>
        )}

        {fetchState === 'ready' && report.type === 'news' && newsFields && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Source URL</label>
              <input
                type="url"
                value={newsFields.url}
                onChange={e => setNewsFields(f => f && ({ ...f, url: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Topic</label>
              <select
                value={newsFields.topic ?? ''}
                onChange={e => setNewsFields(f => f && ({ ...f, topic: e.target.value || null }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              >
                <option value="">— none —</option>
                {NEWS_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Scandal flag</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setNewsFields(f => f && ({ ...f, is_scandal: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${newsFields.is_scandal === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'scandal' : 'not scandal'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Hidden from feed</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setNewsFields(f => f && ({ ...f, hidden: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${newsFields.hidden === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'hidden' : 'visible'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {fetchState === 'ready' && report.type === 'bill' && billFields && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Source URL</label>
              <input
                type="url"
                value={billFields.url}
                onChange={e => setBillFields(f => f && ({ ...f, url: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Status</label>
              <select
                value={billFields.status}
                onChange={e => setBillFields(f => f && ({ ...f, status: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              >
                {BILL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Toronto flagged</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setBillFields(f => f && ({ ...f, toronto_flagged: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${billFields.toronto_flagged === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'yes' : 'no'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {inlineError && (
          <p className="text-xs text-red-500 font-mono">{inlineError}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            disabled={fetchState !== 'ready' || saving}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40"
          >
            {saving ? 'saving…' : 'save & resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/components/ResolveModal.tsx
git commit -m "feat: add ResolveModal with pre-fill fetch, contextual fields, and inline error handling"
```

---

## Chunk 6: Integration

### Task 13: Wire ReportButton into NewsItem

**Files:**
- Modify: `app/components/news/NewsItem.tsx`

The file currently has no `'use client'` directive. Adding it is required because we're importing a client component (`ReportButton`) that owns local state.

- [ ] **Step 1: Update NewsItem.tsx**

Replace the entire file content with:

```tsx
'use client'

import ReportButton from '@/app/components/shared/ReportButton'

interface NewsItemProps {
  item: {
    id: string
    headline: string
    url: string
    source: string
    published_at: Date
    topic: string | null
    sentiment: string | null
    is_scandal: boolean
    tags: string[]
  }
}

export default function NewsItem({ item }: NewsItemProps) {
  const dateStr = new Date(item.published_at).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className={`border-b border-zinc-100 dark:border-zinc-800 py-3 ${item.is_scandal ? 'border-l-2 border-l-red-500 pl-3' : ''}`}>
      {item.is_scandal && (
        <span className="inline-block text-xs font-mono uppercase tracking-wider text-ontario-red dark:text-red-400 font-bold mb-1">
          Scandal
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-medium text-zinc-950 dark:text-white hover:underline leading-snug text-sm flex-1"
        >
          {item.headline}
        </a>
        <ReportButton type="news" targetId={item.id} targetTitle={item.headline} />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        <span>{item.source}</span>
        <span>·</span>
        <span>{dateStr}</span>
        {item.topic && (
          <>
            <span>·</span>
            <span className="uppercase">{item.topic}</span>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Confirm the news feed page passes `id` to NewsItem**

Open `app/page.tsx` (or wherever `NewsItem` is rendered) and confirm the `item` prop includes `id`. The existing `prisma.newsEvent.findMany` select includes `id: true` — if it does not, add it.

- [ ] **Step 3: Verify `LinkedNews` and `ScandalFeed` still work**

Open `app/components/mpps/LinkedNews.tsx` and any `ScandalFeed` component. They import `NewsItem` from a Client Component file — this is valid in Next.js App Router (Server Components can import Client Components). No changes needed to these files; just confirm they compile without errors after the `NewsItem` change.

- [ ] **Step 4: Commit**

```bash
git add app/components/news/NewsItem.tsx
git commit -m "feat: add ReportButton to NewsItem, add 'use client' directive"
```

---

### Task 14: Wire ReportButton into bill detail page

**Files:**
- Modify: `app/bills/[id]/page.tsx`

- [ ] **Step 1: Add import and ReportButton to the bill header**

At the top of `app/bills/[id]/page.tsx`, add the import after the existing imports:

```ts
import ReportButton from '@/app/components/shared/ReportButton'
```

In the bill header section (the `<div className="border-b-4 ...">` block), add the `ReportButton` alongside the existing external link. Replace the `<h1>` block with:

```tsx
<div className="flex items-start justify-between gap-3 mt-2">
  <h1 className="text-2xl font-serif font-bold text-zinc-950 dark:text-white leading-tight flex-1">
    {bill.title}
  </h1>
  <div className="flex items-center gap-3 shrink-0 mt-1">
    <a
      href={bill.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
    >
      full text <ExternalLink size={12} />
    </a>
    <ReportButton
      type="bill"
      targetId={bill.id}
      targetTitle={`${bill.bill_number}: ${bill.title}`}
    />
  </div>
</div>
```

Also add the `ExternalLink` import from lucide-react (add to existing lucide import line if present, or add new):

```ts
import { ExternalLink } from 'lucide-react'
```

And remove the standalone external link at the bottom of the page (the `<div className="mt-8">` block with `View on Ontario Legislative Assembly →`) since it is now in the header.

- [ ] **Step 2: Commit**

```bash
git add app/bills/[id]/page.tsx
git commit -m "feat: add ReportButton and ExternalLink icon to bill detail page header"
```

---

### Task 15: Wire ReportsPanel into admin page

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Update admin/page.tsx**

Replace the entire file:

```tsx
import { prisma } from '@/lib/db'
import ReportsPanel from './components/ReportsPanel'
import ScandalQueue from './components/ScandalQueue'
import NewsFeedOverride from './components/NewsFeedOverride'
import BillsOverride from './components/BillsOverride'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [reports, pendingScandals, recentNews, flaggedBills] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        type: true,
        targetId: true,
        targetTitle: true,
        categories: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    }),
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
          Reports ({reports.length})
        </h2>
        <ReportsPanel
          initialReports={reports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </section>

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

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add ReportsPanel as first section in admin page"
```

---

### Task 16: Build verification

- [ ] **Step 1: Run the test suite**

```bash
pnpm test
```

Expected: all tests pass (including the 10 new validation tests and 4 route tests).

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: build completes without errors.

- [ ] **Step 4: Final commit if needed**

If any type errors were fixed:
```bash
git add -p
git commit -m "fix: resolve type errors found during build verification"
```
