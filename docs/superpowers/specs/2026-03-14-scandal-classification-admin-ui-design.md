# Scandal Classification Hardening & Admin Review UI — Design Spec

**Date:** 2026-03-14
**Status:** Approved

---

## Overview

Three related features to reduce false positives and add human oversight:

1. **Scandal classification hardening** — tighter AI prompt + keyword gate to reduce false positives; borderline articles queued for human review instead of auto-flagging
2. **Admin UI** — Clerk-authenticated `/admin` page with three panels: scandal queue, news feed override, toronto bills override
3. **Clerk authentication** — protects all `/admin/*` and `/api/admin/*` routes

---

## Schema Changes

### `NewsEvent` — three new fields

These fields must be added to the `NewsEvent` model in `prisma/schema.prisma` as part of implementation (before the migration runs):

```prisma
excerpt               String?
hidden                Boolean  @default(false)
scandal_review_status String?  // 'pending' | 'confirmed' | 'rejected'
```

- `excerpt` — first 500 chars of `contentSnippet`/`content` from RSS, stored at scrape time for display in the admin scandal queue
- `hidden` — admin-set override to remove an article from the public feed
- `scandal_review_status` — tracks human review state for borderline scandal flags
  - `null` — not under review (auto-classified cleanly)
  - `'pending'` — AI said scandal but keyword gate failed; awaiting human decision
  - `'confirmed'` — human confirmed as scandal (`is_scandal` set to `true`)
  - `'rejected'` — human rejected (`is_scandal` remains `false`)

### `Bill` — no schema changes

Bills use manual admin overrides to `toronto_flagged` directly. No review status field needed.

---

## Scandal Classification Hardening

**File:** `lib/ai/classify.ts`

### Types

`ArticleClassification` gains one field:

```ts
export interface ArticleClassification {
  topic: 'housing' | 'transit' | 'ethics' | 'environment' | 'finance' | 'other'
  sentiment: 'scandal' | 'critical' | 'neutral' | 'positive'
  is_scandal: boolean
  tags: string[]
  scandal_review_status: 'pending' | null  // classifier output only
}
```

The DB field allows a wider set (`'pending' | 'confirmed' | 'rejected'`). Export a separate type for use in API routes:

```ts
export type ScandalReviewStatus = 'pending' | 'confirmed' | 'rejected'
```

### `DEFAULTS` constant — updated

```ts
const DEFAULTS: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
  scandal_review_status: null,
}
```

### `parseClassification()` — updated

Must include `scandal_review_status: null` in its return (the keyword gate runs in `classifyArticle`, not here):

```ts
return {
  topic: parsed.topic ?? DEFAULTS.topic,
  sentiment: parsed.sentiment ?? DEFAULTS.sentiment,
  is_scandal: parsed.is_scandal ?? DEFAULTS.is_scandal,
  tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  scandal_review_status: null,
}
```

### 1. Tighter prompt

Add explicit criteria to `PROMPT_TEMPLATE`:

> "Mark `is_scandal: true` only for credible evidence of misconduct, corruption, ethical breach, or abuse of power. Routine policy criticism, controversy, or opposition complaints are NOT scandals."

### 2. Keyword gate

After AI classification, apply a post-processing gate in `classifyArticle()`. New exported constant:

```ts
export const SCANDAL_KEYWORDS = [
  'corruption', 'misconduct', 'fraud', 'bribery', 'breach', 'unethical',
  'cover-up', 'coverup', 'scandal', 'probe', 'investigation', 'fired',
  'resigned', 'conflict of interest', 'kickback', 'inappropriate',
  'improper', 'illegal', 'lawsuit', 'charged', 'convicted',
]
```

Logic after calling `parseClassification()`:

```ts
const keywordMatch = SCANDAL_KEYWORDS.some(kw =>
  `${headline} ${excerpt}`.toLowerCase().includes(kw)
)

if (result.is_scandal && !keywordMatch) {
  return { ...result, is_scandal: false, scandal_review_status: 'pending' }
}
return { ...result, scandal_review_status: null }
```

### Both `{ ...DEFAULTS }` return sites must be updated

`classifyArticle()` has two places that return `{ ...DEFAULTS }`:
1. The `catch` branch of `parseClassification()` (line 43 of current file)
2. The `catch` branch of `classifyArticle()` itself (line 76) — this path bypasses `parseClassification()` entirely

Both are covered by updating `DEFAULTS` to include `scandal_review_status: null` as specified above. The implementer must verify both sites return the full updated type — not just the `parseClassification` catch.

### `news.ts` — updated `create` data block

The manual default initialiser (lines 114–119) must include the new field:

```ts
let classification: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
  scandal_review_status: null,
}
```

The `prisma.newsEvent.create` data block gains three fields:

```ts
excerpt: excerpt,  // already computed as rawExcerpt.slice(0, 500)
hidden: false,
scandal_review_status: classification.scandal_review_status,
```

---

## Admin UI

**Package:** `@clerk/nextjs` v5+ — new dependency

**New env vars** (added to `.env.example`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Middleware

New `middleware.ts` at project root (Next.js App Router convention). Targets `@clerk/nextjs` v5 — `auth` is the resolved auth object, not a callable function:

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

Unauthenticated requests to `/admin/*` redirect to Clerk's hosted sign-in. Unauthenticated requests to `/api/admin/*` return 401.

### Page structure

**`app/admin/page.tsx`** — server component, fetches all panel data in parallel, renders three panels.

```
/admin
├── Panel 1: Scandal Queue
├── Panel 2: News Feed Override
└── Panel 3: Toronto Bills Override
```

### Panel 1 — Scandal Queue

Fetches: `NewsEvent` where `scandal_review_status: 'pending'`, ordered by `published_at desc`.

Each item displays: headline (linked to article URL), source, published date, excerpt (from the stored `excerpt` field, no truncation needed — already capped at 500 chars at scrape time).

Actions per item:
- **Confirm** → `POST /api/admin/scandal-review` `{ id, action: 'confirm' }` → sets `is_scandal: true`, `scandal_review_status: 'confirmed'`
- **Reject** → `POST /api/admin/scandal-review` `{ id, action: 'reject' }` → sets `scandal_review_status: 'rejected'`

### Panel 2 — News Feed Override

Fetches: all `NewsEvent` ordered by `published_at desc`, take 50. Split into two sub-sections:

**Visible articles** (`hidden: false`): headline, source, date. **Hide** button per item.
**Hidden articles** (`hidden: true`): collapsed section. **Unhide** button per item.

Action: `POST /api/admin/news-hide` `{ id, hidden: boolean }`

### Panel 3 — Toronto Bills Override

Two sub-sections:

**Currently flagged** (`toronto_flagged: true`): bill number, title, sponsor, status. **Remove** button per item.

**Search unflagged**: text input triggers a GET to `/api/admin/bills-search?q=...` (not a Server Action — GET route for consistency with other admin routes and to ensure Clerk session auth is enforced uniformly). Results show bill number, title, sponsor. **Add** button per item.

Actions: `POST /api/admin/bill-flag` `{ id, action: 'add' | 'remove' }`

---

## API Routes

All routes validate Clerk session server-side via `auth()` from `@clerk/nextjs/server`. Return 401 if unauthenticated.

| Route | Method | Body / Query | Effect |
|---|---|---|---|
| `/api/admin/scandal-review` | POST | `{ id, action: 'confirm' \| 'reject' }` | Updates `NewsEvent.is_scandal` and `scandal_review_status` |
| `/api/admin/news-hide` | POST | `{ id, hidden: boolean }` | Updates `NewsEvent.hidden` |
| `/api/admin/bill-flag` | POST | `{ id, action: 'add' \| 'remove' }` | Updates `Bill.toronto_flagged` |
| `/api/admin/bills-search` | GET | `?q=string` | Returns `Bill[]` where `toronto_flagged: false` and title/sponsor contains `q` |

---

## Homepage Query Changes

`app/page.tsx` news query gains `hidden: false` filter:

```ts
prisma.newsEvent.findMany({
  where: { hidden: false },
  orderBy: { published_at: 'desc' },
  take: 20,
})
```

Scandal count KPI already filters `is_scandal: true` — no change needed there.

---

## Files Changed

| Action | File |
|---|---|
| New | `middleware.ts` |
| New | `app/admin/page.tsx` |
| New | `app/admin/components/ScandalQueue.tsx` |
| New | `app/admin/components/NewsFeedOverride.tsx` |
| New | `app/admin/components/BillsOverride.tsx` |
| New | `app/api/admin/scandal-review/route.ts` |
| New | `app/api/admin/news-hide/route.ts` |
| New | `app/api/admin/bill-flag/route.ts` |
| New | `app/api/admin/bills-search/route.ts` |
| Modified | `lib/ai/classify.ts` (tighter prompt, keyword gate, updated `ArticleClassification` type, updated `DEFAULTS` and `parseClassification`) |
| Modified | `lib/scraper/news.ts` (write `excerpt`, `hidden`, `scandal_review_status` to DB; update manual default initialiser) |
| Modified | `app/page.tsx` (add `hidden: false` filter to news query) |
| Modified | `prisma/schema.prisma` |
| Modified | `.env.example` |
| Modified | `package.json` (add `@clerk/nextjs`) |

---

## Deployment Notes

1. Install Clerk: `npm install @clerk/nextjs`
2. Create a Clerk application at clerk.com, add reviewers as users
3. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Vercel env vars
4. Run migration locally: `npx prisma migrate dev --name add_news_admin_fields`
5. **Apply migration to production BEFORE deploying app code**: `npx prisma migrate deploy`
   - This is critical: `app/page.tsx` queries `hidden: false` which requires the column to exist. If the Vercel deploy races ahead of the migration, the homepage will fail with a Prisma unknown field error. Confirm the migration is applied in Neon before triggering a Vercel deploy.
6. Deploy app code to Vercel
7. Existing articles keep `hidden: false` (default), `excerpt: null`, and `scandal_review_status: null` (no data backfill needed)

---

## Out of Scope

- Admin dashboard analytics or stats
- Bulk approve/reject actions
- Audit log of admin actions
- Email notifications for new pending items
- Admin ability to edit article content or bill data
