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

### `NewsEvent` — two new fields

```prisma
hidden                Boolean  @default(false)
scandal_review_status String?  // 'pending' | 'confirmed' | 'rejected'
```

- `hidden` — admin-set override to remove an article from the public feed
- `scandal_review_status` — tracks human review state for borderline scandal flags
  - `null` — not under review (auto-classified, keyword gate passed or failed cleanly)
  - `'pending'` — AI said scandal but keyword gate failed; awaiting human decision
  - `'confirmed'` — human confirmed as scandal (`is_scandal` set to `true`)
  - `'rejected'` — human rejected (`is_scandal` remains `false`)

### `Bill` — no schema changes

Bills use manual admin overrides to `toronto_flagged` directly. No review status field needed.

---

## Scandal Classification Hardening

**File:** `lib/ai/classify.ts`

### 1. Tighter prompt

Add explicit criteria to `PROMPT_TEMPLATE`:

> "Mark `is_scandal: true` only for credible evidence of misconduct, corruption, ethical breach, or abuse of power. Routine policy criticism, controversy, or opposition complaints are NOT scandals."

### 2. Keyword gate

After AI classification, apply a post-processing gate in `classifyArticle()`. A new exported constant:

```ts
export const SCANDAL_KEYWORDS = [
  'corruption', 'misconduct', 'fraud', 'bribery', 'breach', 'unethical',
  'cover-up', 'coverup', 'scandal', 'probe', 'investigation', 'fired',
  'resigned', 'conflict of interest', 'kickback', 'inappropriate',
  'improper', 'illegal', 'lawsuit', 'charged', 'convicted',
]
```

Logic after AI response:

```ts
const keywordMatch = SCANDAL_KEYWORDS.some(kw =>
  `${headline} ${excerpt}`.toLowerCase().includes(kw)
)

if (aiResult.is_scandal && !keywordMatch) {
  // Borderline: AI flagged but no keyword evidence — queue for review
  return {
    ...aiResult,
    is_scandal: false,
    scandal_review_status: 'pending',
  }
}
// Keyword gate passed (or AI didn't flag scandal) — no review needed
return { ...aiResult, scandal_review_status: null }
```

`ArticleClassification` gains `scandal_review_status: 'pending' | null`.

The `NewsEvent` upsert in `news.ts` writes `scandal_review_status` from the classification result.

---

## Admin UI

**Package:** `@clerk/nextjs` — new dependency

**New env vars** (added to `.env.example`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Middleware

New `middleware.ts` at project root:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isAdminRoute(req)) auth().protect()
})
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

Each item displays: headline (linked), source, published date, excerpt (truncated to 200 chars).

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

**Search unflagged**: text input, searches `Bill` where `toronto_flagged: false` by title or sponsor (`contains`, case-insensitive). Results show bill number, title, sponsor. **Add** button per item.

Search is a server action or GET to `/api/admin/bills-search?q=...`.

Actions: `POST /api/admin/bill-flag` `{ id, action: 'add' | 'remove' }`

---

## API Routes

All routes validate Clerk session server-side via `auth()` from `@clerk/nextjs/server`. Return 401 if unauthenticated.

| Route | Method | Body | Effect |
|---|---|---|---|
| `/api/admin/scandal-review` | POST | `{ id, action: 'confirm' \| 'reject' }` | Updates `NewsEvent.is_scandal` and `scandal_review_status` |
| `/api/admin/news-hide` | POST | `{ id, hidden: boolean }` | Updates `NewsEvent.hidden` |
| `/api/admin/bill-flag` | POST | `{ id, action: 'add' \| 'remove' }` | Updates `Bill.toronto_flagged` |
| `/api/admin/bills-search` | GET | `?q=string` | Returns matching unflagged bills |

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
| Modified | `lib/ai/classify.ts` (tighter prompt, keyword gate, updated `ArticleClassification` type) |
| Modified | `lib/scraper/news.ts` (write `scandal_review_status` to DB) |
| Modified | `app/page.tsx` (add `hidden: false` filter to news query) |
| Modified | `prisma/schema.prisma` |
| Modified | `.env.example` |
| Modified | `package.json` (add `@clerk/nextjs`) |

---

## Deployment Notes

1. Install Clerk: `npm install @clerk/nextjs`
2. Create a Clerk application at clerk.com, add reviewers to the org/application
3. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Vercel env vars
4. Run migration locally: `npx prisma migrate dev --name add_news_admin_fields`
5. Apply to production: `npx prisma migrate deploy`
6. Deploy — existing articles keep `hidden: false` and `scandal_review_status: null` (no data backfill needed)

---

## Out of Scope

- Admin dashboard analytics or stats
- Bulk approve/reject actions
- Audit log of admin actions
- Email notifications for new pending items
- Admin ability to edit article content or bill data
