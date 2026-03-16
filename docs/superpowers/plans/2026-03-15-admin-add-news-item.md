# Admin: Add News Item — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline form to the admin News Feed Override panel that lets an admin manually inject a real news article (headline, URL, source, is_scandal) into the `NewsEvent` feed.

**Architecture:** A new `POST /api/admin/news-add` route creates the `NewsEvent` record and returns the item in the `NewsItem` shape. `NewsFeedOverride` gains a collapsible form at the top; on success the new item is prepended to the live list with no page reload needed.

**Tech Stack:** Next.js 15 App Router, Prisma, Clerk (`@clerk/nextjs/server`), Vitest, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-15-admin-add-news-item-design.md`

---

## Chunk 1: API Route

### Task 1: API route — failing tests

**Files:**
- Create: `tests/lib/api/news-add.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    newsEvent: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/news-add/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  newsEvent: { create: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/news-add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(401)
})

it('returns 400 when headline is missing', async () => {
  const res = await POST(makeRequest({ url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when url is missing', async () => {
  const res = await POST(makeRequest({ headline: 'h', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when source is missing', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when is_scandal is not a boolean', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: 'yes' }))
  expect(res.status).toBe(400)
})

it('returns 400 when url is not a valid URL', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'not-a-url', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 409 on duplicate URL', async () => {
  const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' })
  mockPrisma.newsEvent.create.mockRejectedValueOnce(err)
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(409)
})

it('creates record with correct fields for non-scandal', async () => {
  const now = new Date()
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: false,
  })
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      headline: 'h',
      url: 'https://example.com',
      source: 's',
      is_scandal: false,
      hidden: false,
      tags: [],
      scandal_review_status: null,
    }),
  })
})

it('sets scandal_review_status=confirmed for scandal items', async () => {
  const now = new Date()
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n2', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: true,
  })
  await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: true }))
  expect(mockPrisma.newsEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      is_scandal: true,
      scandal_review_status: 'confirmed',
    }),
  })
})

it('returns the created item in NewsItem shape', async () => {
  const now = new Date('2026-03-15T12:00:00.000Z')
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: false,
  })
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  const body = await res.json()
  expect(body).toMatchObject({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    hidden: false, is_scandal: false,
  })
  expect(typeof body.published_at).toBe('string')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test tests/lib/api/news-add.test.ts
```

Expected: all tests FAIL with "Cannot find module '@/app/api/admin/news-add/route'"

---

### Task 2: API route — implementation

**Files:**
- Create: `app/api/admin/news-add/route.ts`

- [ ] **Step 3: Implement the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { headline, url, source, is_scandal } = body as {
    headline?: string
    url?: string
    source?: string
    is_scandal?: unknown
  }

  if (!headline || !url || !source) {
    return NextResponse.json({ error: 'headline, url, and source are required' }, { status: 400 })
  }

  if (typeof is_scandal !== 'boolean') {
    return NextResponse.json({ error: 'is_scandal must be a boolean' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const created = await prisma.newsEvent.create({
      data: {
        headline,
        url,
        source,
        is_scandal,
        published_at: new Date(),
        hidden: false,
        tags: [],
        scandal_review_status: is_scandal ? 'confirmed' : null,
      },
      select: {
        id: true,
        headline: true,
        url: true,
        source: true,
        published_at: true,
        hidden: true,
        is_scandal: true,
      },
    })
    return NextResponse.json(created)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'This URL already exists in the feed.' }, { status: 409 })
    }
    throw err
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test tests/lib/api/news-add.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/news-add/route.ts tests/lib/api/news-add.test.ts
git commit -m "feat: add POST /api/admin/news-add route"
```

---

## Chunk 2: UI

### Task 3: NewsFeedOverride — add inline form

**Files:**
- Modify: `app/admin/components/NewsFeedOverride.tsx`

- [ ] **Step 6: Add form state and submit handler**

At the top of the component, after the existing `useState` declarations, add:

```ts
const [showForm, setShowForm] = useState(false)
const [formLoading, setFormLoading] = useState(false)
const [formError, setFormError] = useState<string | null>(null)
const [formUrl, setFormUrl] = useState('')
const [formHeadline, setFormHeadline] = useState('')
const [formSource, setFormSource] = useState('')
const [formIsScandal, setFormIsScandal] = useState(false)
```

Add the submit handler after `toggleScandal`:

```ts
async function submitNewItem(e: React.FormEvent) {
  e.preventDefault()
  setFormLoading(true)
  setFormError(null)
  try {
    const res = await fetch('/api/admin/news-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: formHeadline, url: formUrl, source: formSource, is_scandal: formIsScandal }),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormError(data.error ?? 'Something went wrong')
      return
    }
    setItems(prev => [data, ...prev])
    setFormUrl('')
    setFormHeadline('')
    setFormSource('')
    setFormIsScandal(false)
    setShowForm(false)
  } finally {
    setFormLoading(false)
  }
}
```

- [ ] **Step 7: Add toggle button and form to JSX**

Replace the opening `<div className="space-y-4">` block with:

```tsx
return (
  <div className="space-y-4">
    <div className="flex justify-end">
      <button
        onClick={() => { setShowForm(v => !v); setFormError(null) }}
        className="text-xs font-mono text-zinc-400 hover:text-zinc-600"
      >
        {showForm ? '✕ Cancel' : '＋ Add article'}
      </button>
    </div>

    {showForm && (
      <form onSubmit={submitNewItem} className="space-y-2 border border-zinc-200 dark:border-zinc-700 rounded p-3">
        <input
          type="url"
          placeholder="URL"
          value={formUrl}
          onChange={e => setFormUrl(e.target.value)}
          required
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
        />
        <input
          type="text"
          placeholder="Headline"
          value={formHeadline}
          onChange={e => setFormHeadline(e.target.value)}
          required
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
        />
        <input
          type="text"
          placeholder="Source"
          value={formSource}
          onChange={e => setFormSource(e.target.value)}
          required
          className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formIsScandal}
            onChange={e => setFormIsScandal(e.target.checked)}
          />
          Scandal?
        </label>
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <button
          type="submit"
          disabled={formLoading}
          className="px-3 py-1 text-xs bg-zinc-800 text-white rounded hover:bg-zinc-700 disabled:opacity-50"
        >
          {formLoading ? 'Adding…' : 'Add'}
        </button>
      </form>
    )}

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
```

- [ ] **Step 8: Run the full test suite to confirm nothing is broken**

```bash
pnpm test
```

Expected: all existing tests still PASS (UI change has no unit tests — verified by type-check below)

- [ ] **Step 9: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add app/admin/components/NewsFeedOverride.tsx
git commit -m "feat: add inline add-article form to NewsFeedOverride admin panel"
```
