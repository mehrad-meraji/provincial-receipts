# News Scandal Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-row "Scandal" / "Unscandal" toggle button to the NewsFeedOverride admin panel.

**Architecture:** Reuse the existing `POST /api/admin/scandal-review` endpoint. Add `is_scandal` to the Prisma select in `admin/page.tsx`, extend the `NewsItem` interface in `NewsFeedOverride`, and render a second button per row.

**Tech Stack:** Next.js 16, React 19, Prisma (PostgreSQL), Vitest, Tailwind CSS

---

## Chunk 1: Test + Data Layer

### Task 1: Add test coverage for the scandal-review route

The endpoint is being reused without modification. Write a test that locks in the expected behavior so regressions are caught.

**Files:**
- Create: `tests/lib/api/scandal-review.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    newsEvent: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/scandal-review/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  newsEvent: { update: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/scandal-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'n1', action: 'confirm' }))
  expect(res.status).toBe(401)
})

it('returns 400 for invalid action', async () => {
  const res = await POST(makeRequest({ id: 'n1', action: 'explode' }))
  expect(res.status).toBe(400)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ action: 'confirm' }))
  expect(res.status).toBe(400)
})

it('sets is_scandal=true and status=confirmed on confirm', async () => {
  mockPrisma.newsEvent.update.mockResolvedValueOnce({})
  const res = await POST(makeRequest({ id: 'n1', action: 'confirm' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.update).toHaveBeenCalledWith({
    where: { id: 'n1' },
    data: { is_scandal: true, scandal_review_status: 'confirmed' },
  })
})

it('sets is_scandal=false and status=rejected on reject', async () => {
  mockPrisma.newsEvent.update.mockResolvedValueOnce({})
  const res = await POST(makeRequest({ id: 'n1', action: 'reject' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.update).toHaveBeenCalledWith({
    where: { id: 'n1' },
    data: { is_scandal: false, scandal_review_status: 'rejected' },
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
pnpm test tests/lib/api/scandal-review.test.ts
```

Expected: all 5 tests PASS (the route already exists and is correct)

- [ ] **Step 3: Add `is_scandal: true` to the `recentNews` Prisma select in `app/admin/page.tsx`**

In `app/admin/page.tsx`, find the `recentNews` query (the second `prisma.newsEvent.findMany` call, around line 31). Change:

```ts
select: { id: true, headline: true, url: true, source: true, published_at: true, hidden: true },
```

to:

```ts
select: { id: true, headline: true, url: true, source: true, published_at: true, hidden: true, is_scandal: true },
```

- [ ] **Step 4: Commit**

```bash
git add tests/lib/api/scandal-review.test.ts app/admin/page.tsx
git commit -m "test: add scandal-review route tests; feat: include is_scandal in recentNews select"
```

---

## Chunk 2: Component

### Task 2: Update NewsFeedOverride to render the scandal toggle

**Files:**
- Modify: `app/admin/components/NewsFeedOverride.tsx`

- [ ] **Step 1: Add `is_scandal` to the `NewsItem` interface**

In `app/admin/components/NewsFeedOverride.tsx`, extend the `NewsItem` interface:

```ts
interface NewsItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  hidden: boolean
  is_scandal: boolean
}
```

- [ ] **Step 2: Add the `toggleScandal` function**

After the existing `toggleHidden` function, add:

```ts
async function toggleScandal(id: string, wasScandal: boolean) {
  setLoading(id)
  try {
    await fetch('/api/admin/scandal-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: wasScandal ? 'reject' : 'confirm' }),
    })
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_scandal: !wasScandal } : item))
  } finally {
    setLoading(null)
  }
}
```

- [ ] **Step 3: Add the scandal button to `renderItem`**

In the `renderItem` function, alongside the existing Hide/Unhide button, add a second button:

```tsx
<button
  onClick={() => toggleScandal(item.id, item.is_scandal)}
  disabled={loading === item.id}
  className={
    item.is_scandal
      ? 'px-3 py-1 text-xs shrink-0 bg-ontario-red text-white rounded hover:bg-red-700 disabled:opacity-50'
      : 'px-3 py-1 text-xs shrink-0 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50'
  }
>
  {item.is_scandal ? 'Unscandal' : 'Scandal'}
</button>
```

Place it before the Hide/Unhide button so it appears to the left of it.

- [ ] **Step 4: Run the full test suite to confirm nothing is broken**

```bash
pnpm test
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/admin/components/NewsFeedOverride.tsx
git commit -m "feat: add scandal toggle button to NewsFeedOverride admin panel"
```
