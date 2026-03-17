# Bills Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `published` field to bills, a full-featured admin panel to browse/label/publish bills, and update the public feed to use `published` instead of `toronto_flagged`.

**Architecture:** Schema migration adds `published Boolean @default(false)`. Three new API routes handle listing, labeling, and publishing. A single client component `BillsPanel` replaces `BillsOverride` with a table+drawer layout. Public feed queries switch from `toronto_flagged` to `published`. Old admin routes for toronto flagging are deleted.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7 + PostgreSQL (Neon), Clerk auth, Tailwind CSS, Lucide React icons, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-03-15-bills-admin-panel-design.md`

---

## File Map

**Created:**
- `prisma/migrations/<timestamp>_add_bill_published/migration.sql` — schema + backfill
- `app/api/admin/bill-label/route.ts` — POST: add/remove tag on a bill
- `app/api/admin/bill-publish/route.ts` — POST: toggle bill.published
- `app/api/admin/bills/route.ts` — GET: paginated bills list for admin
- `app/admin/components/BillsPanel.tsx` — full client component (table + drawer)
- `tests/lib/api/bill-label.test.ts`
- `tests/lib/api/bill-publish.test.ts`
- `tests/lib/api/admin-bills.test.ts`

**Modified:**
- `prisma/schema.prisma` — add `published Boolean @default(false)` to Bill
- `lib/scraper/bills.ts` — set `published: true` on create when toronto_flagged
- `app/page.tsx` — convert findMany where to `published: true`
- `app/api/bills/route.ts` — convert toronto_only + orderBy
- `app/api/admin/reports/[id]/resolve/route.ts` — remove toronto_flagged from bill branch
- `app/api/admin/reports/[id]/target/route.ts` — remove toronto_flagged from bill select
- `app/admin/components/ResolveModal.tsx` — remove toronto_flagged UI + types
- `app/admin/page.tsx` — swap BillsOverride for BillsPanel, remove flaggedBills query

**Deleted:**
- `app/admin/components/BillsOverride.tsx`
- `app/api/admin/bills-search/route.ts`
- `app/api/admin/bill-flag/route.ts`

---

## Chunk 1: Schema, Migration, Scraper

### Task 1: Add `published` to Prisma schema and create migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the field to schema.prisma**

In the `Bill` model, add after `toronto_flagged`:

```prisma
published       Boolean     @default(false)
```

The Bill model block should look like:
```prisma
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
  published       Boolean     @default(false)
  last_scraped    DateTime    @default(now())
  ...
```

- [ ] **Step 2: Create migration without applying**

```bash
cd /Users/mehrad/Projects/meh-labs/fuckdougford
npx prisma migrate dev --create-only --name add_bill_published
```

Expected: Creates `prisma/migrations/<timestamp>_add_bill_published/migration.sql` with the ALTER TABLE statement.

- [ ] **Step 3: Edit the migration file to add backfill**

Open the newly created `migration.sql` file. It will contain Prisma's generated SQL. Replace the entire file content with:

```sql
-- AddColumn
ALTER TABLE "Bill" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: bills already toronto-flagged become published
UPDATE "Bill" SET "published" = true WHERE "toronto_flagged" = true;
```

- [ ] **Step 4: Apply the migration**

```bash
npx prisma migrate dev
```

Expected output includes: `The following migration(s) have been applied: add_bill_published`

- [ ] **Step 5: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 6: Verify TypeScript picks up the new field**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to `published` field.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add published field to Bill model with migration and backfill"
```

---

### Task 2: Update scraper to set `published` on insert

**Files:**
- Modify: `lib/scraper/bills.ts:344-358` (the `create` block of the upsert)

- [ ] **Step 1: Add conditional published to the create block**

In `lib/scraper/bills.ts`, find the upsert `create` block (around line 344). It currently ends with `sponsorMppId`. Add the conditional after `toronto_flagged`:

```ts
create: {
  bill_number: row.bill_number,
  title: row.title,
  sponsor: row.sponsor,
  status: row.status,
  date_introduced: row.date_introduced ?? undefined,
  reading_stage: detail.reading_stage ?? undefined,
  vote_results: detail.vote_results ?? undefined,
  vote_by_party: detail.vote_by_party ?? undefined,
  url: row.url,
  last_scraped: new Date(),
  tags: scoreResult.tags,
  impact_score: scoreResult.impact_score,
  toronto_flagged: scoreResult.toronto_flagged,
  ...(scoreResult.toronto_flagged ? { published: true } : {}),
  sponsorMppId,
},
```

The `update` block is NOT changed — leave it exactly as-is.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/scraper/bills.ts
git commit -m "feat: set published=true on bill insert when toronto_flagged"
```

---

## Chunk 2: Public Feed + Admin Backend Cleanup

### Task 3: Update public feed queries

**Files:**
- Modify: `app/page.tsx:37`
- Modify: `app/api/bills/route.ts:13,19`

- [ ] **Step 1: Update `app/page.tsx` findMany**

On line 37, change `toronto_flagged: true` to `published: true`:

```ts
// Before
prisma.bill.findMany({
  where: { toronto_flagged: true },

// After
prisma.bill.findMany({
  where: { published: true },
```

**Do NOT** change line 32 (the `count` query — it stays on `toronto_flagged` for KPI semantics).

- [ ] **Step 2: Update `app/api/bills/route.ts`**

Two changes:

1. Line 13 — `toronto_only` param:
```ts
// Before
if (toronto_only) where.toronto_flagged = true
// After
if (toronto_only) where.published = true
```

2. Line 19 — first element of orderBy array:
```ts
// Before
orderBy: [{ toronto_flagged: 'desc' }, { impact_score: 'desc' }, { date_introduced: 'desc' }],
// After
orderBy: [{ published: 'desc' }, { impact_score: 'desc' }, { date_introduced: 'desc' }],
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/api/bills/route.ts
git commit -m "feat: switch public feed from toronto_flagged to published"
```

---

### Task 4: Remove `toronto_flagged` from admin report routes

**Files:**
- Modify: `app/api/admin/reports/[id]/resolve/route.ts:38-47`
- Modify: `app/api/admin/reports/[id]/target/route.ts:29`

- [ ] **Step 1: Update resolve route — remove toronto_flagged from bill branch**

In `app/api/admin/reports/[id]/resolve/route.ts`, replace the bill branch (lines 38–47):

```ts
// Before
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

// After
} else if (report.type === 'bill') {
  const { url, status: billStatus } = body as {
    url?: string
    status?: string
  }
  const data: Record<string, unknown> = {}
  if (url !== undefined) data.url = url
  if (billStatus !== undefined) data.status = billStatus
```

- [ ] **Step 2: Update target route — remove toronto_flagged from bill select**

In `app/api/admin/reports/[id]/target/route.ts`, change line 29:

```ts
// Before
select: { url: true, status: true, toronto_flagged: true },

// After
select: { url: true, status: true },
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/reports/
git commit -m "refactor: remove toronto_flagged from report resolve/target routes"
```

---

### Task 5: Remove `toronto_flagged` from ResolveModal

**Files:**
- Modify: `app/admin/components/ResolveModal.tsx`

- [ ] **Step 1: Update the TargetBill interface**

Remove `toronto_flagged: boolean` from the interface:

```ts
// Before
interface TargetBill {
  url: string
  status: string
  toronto_flagged: boolean
}

// After
interface TargetBill {
  url: string
  status: string
}
```

- [ ] **Step 2: Remove the toronto_flagged UI section**

In the bill branch render (around line 146), remove the entire "Toronto flagged" section (lines 167–180):

```tsx
// Remove this entire block:
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
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors. TypeScript should no longer complain about `toronto_flagged` being on `TargetBill`.

- [ ] **Step 4: Commit**

```bash
git add app/admin/components/ResolveModal.tsx
git commit -m "refactor: remove toronto_flagged from ResolveModal bill form"
```

---

### Task 6: Delete old admin files

**Files:**
- Delete: `app/admin/components/BillsOverride.tsx`
- Delete: `app/api/admin/bills-search/route.ts`
- Delete: `app/api/admin/bill-flag/route.ts`

- [ ] **Step 1: Delete the files**

```bash
rm app/admin/components/BillsOverride.tsx
rm app/api/admin/bills-search/route.ts
rm app/api/admin/bill-flag/route.ts
```

- [ ] **Step 2: Temporarily stub admin/page.tsx to avoid import error**

`app/admin/page.tsx` still imports `BillsOverride`. Temporarily comment out that import and usage so the project compiles while we build `BillsPanel` in the next chunk:

```ts
// import BillsOverride from './components/BillsOverride'
```

And in the JSX, temporarily replace `<BillsOverride flaggedBills={flaggedBills} />` with `<div />` and remove the `flaggedBills` fetch from `Promise.all`. We'll do the full cleanup in Task 11.

Actually, do the full admin/page.tsx update now — it's simpler than stubbing:

In `app/admin/page.tsx`, change the destructuring and Promise.all:

```ts
// Before
const [reports, pendingScandals, recentNews, flaggedBills] = await Promise.all([
  ...
  prisma.bill.findMany({
    where: { toronto_flagged: true },
    orderBy: { impact_score: 'desc' },
    select: { id: true, bill_number: true, title: true, sponsor: true, status: true },
  }),
])

// After
const [reports, pendingScandals, recentNews] = await Promise.all([
  ...
  // flaggedBills query removed — BillsPanel fetches its own data
])
```

And remove the import + usage of `BillsOverride`:
```ts
// Remove: import BillsOverride from './components/BillsOverride'
// And replace the <BillsOverride flaggedBills={flaggedBills} /> JSX with <div>Bills panel coming soon</div>
// (BillsPanel will be added in Task 11)
```

Also update the section heading to "Bills":
```tsx
<h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
  Bills
</h2>
<div>Bills panel coming soon</div>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git rm app/admin/components/BillsOverride.tsx app/api/admin/bills-search/route.ts app/api/admin/bill-flag/route.ts
git commit -m "refactor: remove BillsOverride, bills-search, and bill-flag routes"
```

---

## Chunk 3: New API Routes (TDD)

### Task 7: POST /api/admin/bill-label

**Files:**
- Create: `app/api/admin/bill-label/route.ts`
- Create: `tests/lib/api/bill-label.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/api/bill-label.test.ts`:

```ts
import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/bill-label/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/bill-label', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(401)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ tag: 'housing', action: 'add' }))
  expect(res.status).toBe(400)
})

it('returns 400 when action is invalid', async () => {
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'explode' }))
  expect(res.status).toBe(400)
})

it('returns 400 when adding an invalid tag', async () => {
  const res = await POST(makeRequest({ id: 'b1', tag: 'invalid-tag', action: 'add' }))
  expect(res.status).toBe(400)
})

it('allows removing a legacy tag not in predefined set', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['infrastructure'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: [] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'infrastructure', action: 'remove' }))
  expect(res.status).toBe(200)
})

it('returns 404 when bill not found', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce(null)
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(404)
})

it('adds a tag and returns updated tags', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['transit'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: ['transit', 'housing'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.tags).toEqual(['transit', 'housing'])
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { tags: ['transit', 'housing'] },
    select: { tags: true },
  })
})

it('is a no-op when adding a tag already present', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['housing'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.bill.update).not.toHaveBeenCalled()
  const body = await res.json()
  expect(body.tags).toEqual(['housing'])
})

it('removes a tag and returns updated tags', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['housing', 'transit'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: ['transit'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'remove' }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.tags).toEqual(['transit'])
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { tags: ['transit'] },
    select: { tags: true },
  })
})

it('is a no-op when removing a tag not present', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['transit'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'remove' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.bill.update).not.toHaveBeenCalled()
  const body = await res.json()
  expect(body.tags).toEqual(['transit'])
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/lib/api/bill-label.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/admin/bill-label/route'`

- [ ] **Step 3: Implement the route**

Create `app/api/admin/bill-label/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const VALID_TAGS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other'] as const

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, tag, action } = body as { id?: string; tag?: string; action?: string }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  if (action !== 'add' && action !== 'remove') {
    return NextResponse.json({ error: 'action must be add or remove' }, { status: 400 })
  }
  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'tag is required' }, { status: 400 })
  }
  if (action === 'add' && !VALID_TAGS.includes(tag as typeof VALID_TAGS[number])) {
    return NextResponse.json(
      { error: `tag must be one of: ${VALID_TAGS.join(', ')}` },
      { status: 400 }
    )
  }

  const bill = await prisma.bill.findUnique({ where: { id }, select: { tags: true } })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  if (action === 'add') {
    if (bill.tags.includes(tag)) {
      return NextResponse.json({ tags: bill.tags })
    }
    const updated = await prisma.bill.update({
      where: { id },
      data: { tags: [...bill.tags, tag] },
      select: { tags: true },
    })
    return NextResponse.json({ tags: updated.tags })
  }

  // remove
  if (!bill.tags.includes(tag)) {
    return NextResponse.json({ tags: bill.tags })
  }
  const updated = await prisma.bill.update({
    where: { id },
    data: { tags: bill.tags.filter(t => t !== tag) },
    select: { tags: true },
  })
  return NextResponse.json({ tags: updated.tags })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/lib/api/bill-label.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/bill-label/route.ts tests/lib/api/bill-label.test.ts
git commit -m "feat: add bill-label admin API route with tests"
```

---

### Task 8: POST /api/admin/bill-publish

**Files:**
- Create: `app/api/admin/bill-publish/route.ts`
- Create: `tests/lib/api/bill-publish.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/api/bill-publish.test.ts`:

```ts
import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/bill-publish/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: { update: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/bill-publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'b1', published: true }))
  expect(res.status).toBe(401)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ published: true }))
  expect(res.status).toBe(400)
})

it('returns 400 when published is not a boolean', async () => {
  const res = await POST(makeRequest({ id: 'b1', published: 'yes' }))
  expect(res.status).toBe(400)
})

it('publishes a bill and returns { published: true }', async () => {
  mockPrisma.bill.update.mockResolvedValueOnce({ published: true })
  const res = await POST(makeRequest({ id: 'b1', published: true }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toEqual({ published: true })
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { published: true },
    select: { published: true },
  })
})

it('unpublishes a bill and returns { published: false }', async () => {
  mockPrisma.bill.update.mockResolvedValueOnce({ published: false })
  const res = await POST(makeRequest({ id: 'b1', published: false }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toEqual({ published: false })
})

it('returns 404 when bill not found (P2025)', async () => {
  const { PrismaClientKnownRequestError } = await import('@prisma/client/runtime/library')
  mockPrisma.bill.update.mockRejectedValueOnce(
    new PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: '0' })
  )
  const res = await POST(makeRequest({ id: 'nonexistent', published: true }))
  expect(res.status).toBe(404)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/lib/api/bill-publish.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `app/api/admin/bill-publish/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, published } = body as { id?: string; published?: unknown }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  if (typeof published !== 'boolean') {
    return NextResponse.json({ error: 'published must be a boolean' }, { status: 400 })
  }

  try {
    const bill = await prisma.bill.update({
      where: { id },
      data: { published },
      select: { published: true },
    })
    return NextResponse.json({ published: bill.published })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }
    throw err
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/lib/api/bill-publish.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/bill-publish/route.ts tests/lib/api/bill-publish.test.ts
git commit -m "feat: add bill-publish admin API route with tests"
```

---

### Task 9: GET /api/admin/bills

**Files:**
- Create: `app/api/admin/bills/route.ts`
- Create: `tests/lib/api/admin-bills.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/api/admin-bills.test.ts`:

```ts
import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { GET } from '@/app/api/admin/bills/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/bills')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

const fakeBill = {
  id: 'b1',
  bill_number: 'B-42',
  title: 'Housing Act',
  tags: ['housing'],
  toronto_flagged: true,
  published: true,
  date_introduced: new Date('2026-01-15'),
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await GET(makeRequest())
  expect(res.status).toBe(401)
})

it('returns paginated bills with default params', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([fakeBill])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.page).toBe(1)
  expect(body.pageSize).toBe(25)
  expect(body.total).toBe(1)
  expect(body.bills).toHaveLength(1)
  expect(body.bills[0].id).toBe('b1')
})

it('returns ISO date strings for date_introduced', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([fakeBill])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  const body = await res.json()
  expect(body.bills[0].date_introduced).toBe('2026-01-15T00:00:00.000Z')
})

it('returns null for null date_introduced', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([{ ...fakeBill, date_introduced: null }])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  const body = await res.json()
  expect(body.bills[0].date_introduced).toBeNull()
})

it('applies published filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'published' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ published: true }) })
  )
})

it('applies toronto filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'toronto' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ toronto_flagged: true }) })
  )
})

it('applies unpublished filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'unpublished' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ published: false }) })
  )
})

it('applies search query (case-insensitive) to bill_number and title', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ q: 'housing' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where.OR).toEqual([
    { bill_number: { contains: 'housing', mode: 'insensitive' } },
    { title: { contains: 'housing', mode: 'insensitive' } },
  ])
})

it('treats unknown filter as all (no filter)', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'bogus' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where).not.toHaveProperty('published')
  expect(call.where).not.toHaveProperty('toronto_flagged')
})

it('treats empty q as no search filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ q: '' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where).not.toHaveProperty('OR')
})

it('treats invalid page as page 1', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ page: 'abc' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 0 })
  )
})

it('returns empty bills with correct total for page beyond last', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(5)
  const res = await GET(makeRequest({ page: '99' }))
  const body = await res.json()
  expect(body.bills).toEqual([])
  expect(body.total).toBe(5)
})

it('uses correct sort order', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest())
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.orderBy).toEqual([
    { date_introduced: 'desc' },
    { id: 'asc' },
  ])
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- tests/lib/api/admin-bills.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `app/api/admin/bills/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const filter = searchParams.get('filter') ?? 'all'
  const q = searchParams.get('q') ?? ''

  // Build where clause
  const where: Prisma.BillWhereInput = {}

  if (filter === 'published') where.published = true
  else if (filter === 'toronto') where.toronto_flagged = true
  else if (filter === 'unpublished') where.published = false
  // 'all' or unrecognised: no filter

  if (q.trim()) {
    where.OR = [
      { bill_number: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: [{ date_introduced: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        bill_number: true,
        title: true,
        tags: true,
        toronto_flagged: true,
        published: true,
        date_introduced: true,
      },
    }),
    prisma.bill.count({ where }),
  ])

  return NextResponse.json({
    bills: bills.map(b => ({
      ...b,
      date_introduced: b.date_introduced?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- tests/lib/api/admin-bills.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite to catch regressions**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/bills/route.ts tests/lib/api/admin-bills.test.ts
git commit -m "feat: add GET /api/admin/bills paginated endpoint with tests"
```

---

## Chunk 4: BillsPanel UI + Admin Page

### Task 10: Create BillsPanel component

**Files:**
- Create: `app/admin/components/BillsPanel.tsx`

The component is a client component with no external dependencies beyond what's already installed (Lucide React, Tailwind).

For error feedback, use a self-dismissing inline toast implemented with local state + `setTimeout` — no external library needed.

- [ ] **Step 1: Create the component**

Create `app/admin/components/BillsPanel.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Building2, Globe, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'

const PREDEFINED_TAGS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other'] as const

interface Bill {
  id: string
  bill_number: string
  title: string
  tags: string[]
  toronto_flagged: boolean
  published: boolean
  date_introduced: string | null
}

interface BillsResponse {
  bills: Bill[]
  total: number
  page: number
  pageSize: number
}

type Filter = 'all' | 'published' | 'toronto' | 'unpublished'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function BillsPanel() {
  const [bills, setBills] = useState<Bill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [tagLoading, setTagLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const drawerOpen = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const fetchBills = useCallback(async (p: number, f: Filter, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), filter: f })
      if (q.trim()) params.set('q', q)
      const res = await fetch(`/api/admin/bills?${params}`)
      if (!res.ok) return
      const data: BillsResponse = await res.json()
      setBills(data.bills)
      setTotal(data.total)
      setPage(data.page)
      setPageSize(data.pageSize)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBills(page, filter, query)
  }, [fetchBills, page, filter, query])

  function closeDrawer() {
    setSelectedBill(null)
    drawerOpen.current = false
  }

  function handleFilterChange(f: Filter) {
    setFilter(f)
    setPage(1)
    closeDrawer()
  }

  function handleQueryChange(q: string) {
    setQuery(q)
    setPage(1)
    closeDrawer()
  }

  function handlePageChange(p: number) {
    setPage(p)
    closeDrawer()
  }

  function handleRowClick(bill: Bill) {
    setSelectedBill(bill)
    drawerOpen.current = true
  }

  async function handleTagAction(tag: string, action: 'add' | 'remove') {
    if (!selectedBill || tagLoading) return
    const prevTags = selectedBill.tags
    setTagLoading(true)
    try {
      const res = await fetch('/api/admin/bill-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBill.id, tag, action }),
      })
      if (!drawerOpen.current) return // drawer closed mid-flight — ignore
      if (!res.ok) {
        showToast('Failed to update tags')
        setSelectedBill(b => b ? { ...b, tags: prevTags } : null)
        return
      }
      const data = await res.json()
      setSelectedBill(b => b ? { ...b, tags: data.tags } : null)
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, tags: data.tags } : b))
    } finally {
      setTagLoading(false)
    }
  }

  async function handlePublishToggle() {
    if (!selectedBill) return
    const prevPublished = selectedBill.published
    const nextPublished = !prevPublished
    setSelectedBill(b => b ? { ...b, published: nextPublished } : null)
    setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: nextPublished } : b))
    try {
      const res = await fetch('/api/admin/bill-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBill.id, published: nextPublished }),
      })
      if (!drawerOpen.current) return
      if (!res.ok) {
        showToast('Failed to update visibility')
        setSelectedBill(b => b ? { ...b, published: prevPublished } : null)
        setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: prevPublished } : b))
        return
      }
      const data = await res.json()
      setSelectedBill(b => b ? { ...b, published: data.published } : null)
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: data.published } : b))
    } catch {
      if (!drawerOpen.current) return
      showToast('Failed to update visibility')
      setSelectedBill(b => b ? { ...b, published: prevPublished } : null)
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: prevPublished } : b))
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Toronto-flagged', value: 'toronto' },
    { label: 'Unpublished', value: 'unpublished' },
  ]

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded shadow-lg font-mono">
          {toast}
        </div>
      )}

      <div className="flex gap-4 h-[600px] border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        {/* Left: table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <input
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search bills…"
              className="flex-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900"
            />
            <div className="flex gap-1.5">
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={`px-2.5 py-1 text-xs rounded-full font-mono transition-colors ${
                    filter === f.value
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[80px_1fr_160px_40px_40px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <span>Bill</span>
            <span>Title</span>
            <span>Tags</span>
            <span className="text-center">
              <Building2 size={10} />
            </span>
            <span className="text-center">
              <Globe size={10} />
            </span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <p className="text-xs text-zinc-400 font-mono p-4">Loading…</p>
            )}
            {!loading && bills.length === 0 && (
              <p className="text-xs text-zinc-400 font-mono p-4">No bills found.</p>
            )}
            {!loading && bills.map(bill => (
              <button
                key={bill.id}
                onClick={() => handleRowClick(bill)}
                className={`w-full grid grid-cols-[80px_1fr_160px_40px_40px] px-3 py-2.5 text-left text-sm border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  selectedBill?.id === bill.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                }`}
              >
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {bill.bill_number}
                </span>
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate pr-2">
                  {bill.title}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {bill.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {bill.tags.length > 2 && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      +{bill.tags.length - 2}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <Building2
                    size={14}
                    className={bill.toronto_flagged ? 'text-orange-500' : 'text-zinc-300 dark:text-zinc-600'}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <Globe
                    size={14}
                    className={bill.published ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-mono text-zinc-500">
            <span>{total} bills</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Drawer */}
        {selectedBill && (
          <div className="w-72 border-l border-zinc-200 dark:border-zinc-700 flex flex-col">
            {/* Drawer header */}
            <div className="flex items-start justify-between p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="text-sm font-semibold font-mono text-blue-600 dark:text-blue-400">
                  {selectedBill.bill_number}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                  {selectedBill.title}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Meta */}
              <div className="flex gap-3 text-xs font-mono">
                <span className={`flex items-center gap-1 ${selectedBill.toronto_flagged ? 'text-orange-500' : 'text-zinc-400'}`}>
                  <Building2 size={11} />
                  {selectedBill.toronto_flagged ? 'Toronto-flagged' : 'Not flagged'}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock size={11} />
                  {formatDate(selectedBill.date_introduced)}
                </span>
              </div>

              {/* Tags */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedBill.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[11px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagAction(tag, 'remove')}
                        disabled={tagLoading}
                        className="hover:text-red-500 disabled:opacity-40"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {selectedBill.tags.length === 0 && (
                    <span className="text-xs text-zinc-400 font-mono italic">no tags</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.filter(t => !selectedBill.tags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagAction(tag, 'add')}
                      disabled={tagLoading}
                      className="text-[11px] font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <hr className="border-zinc-200 dark:border-zinc-700" />

              {/* Visibility */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Visibility</p>
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded p-3">
                  <div>
                    <p className={`text-sm font-mono flex items-center gap-1.5 ${selectedBill.published ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                      <Globe size={13} />
                      {selectedBill.published ? 'Published' : 'Unpublished'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedBill.published ? 'Visible on public feed' : 'Hidden from public feed'}
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={handlePublishToggle}
                    className={`relative w-10 h-5 rounded-full transition-colors ${selectedBill.published ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedBill.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/components/BillsPanel.tsx
git commit -m "feat: add BillsPanel admin component (table + drawer)"
```

---

### Task 11: Wire BillsPanel into admin page

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Update admin/page.tsx**

Replace the full file content with:

```ts
import { prisma } from '@/lib/db'
import ReportsPanel from './components/ReportsPanel'
import ScandalQueue from './components/ScandalQueue'
import NewsFeedOverride from './components/NewsFeedOverride'
import BillsPanel from './components/BillsPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [reports, pendingScandals, recentNews] = await Promise.all([
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
      select: { id: true, headline: true, url: true, source: true, published_at: true, hidden: true, is_scandal: true },
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
          Bills
        </h2>
        <BillsPanel />
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: wire BillsPanel into admin page, remove BillsOverride"
```

---

## Final Verification

- [ ] **Run full test suite one last time**

```bash
npm test
```

Expected: All tests pass with no failures.

- [ ] **Type-check the entire project**

```bash
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Manually verify in the browser**
  - Navigate to `/admin` — Bills section shows BillsPanel with table
  - Filter chips work (Published, Toronto-flagged, Unpublished, All)
  - Search filters bills by number or title
  - Clicking a row opens the drawer with bill details
  - Tags can be added (from predefined chips) and removed (X button)
  - Publish toggle works and persists on refresh
  - Navigate to `/` — homepage bills table shows published bills (not just toronto_flagged)
  - ResolveModal for a bill report no longer shows "Toronto flagged" toggle
