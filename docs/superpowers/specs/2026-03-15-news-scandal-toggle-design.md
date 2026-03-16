# News Scandal Toggle in Admin NewsFeedOverride

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add a per-row "Scandal" toggle button to the `NewsFeedOverride` section of the admin dashboard, allowing admins to manually mark or unmark any news item as a scandal.

## Background

The existing scandal workflow is AI-driven: the classifier sets `scandal_review_status: 'pending'`, and admins confirm or reject items in the `ScandalQueue`. This feature adds a complementary manual override path directly in the `NewsFeedOverride` panel, so admins can act on any of the 50 most recent news items without waiting for AI classification.

## Approach

Reuse the existing `POST /api/admin/scandal-review` endpoint, which accepts `{ id, action: 'confirm' | 'reject' }` and sets both `is_scandal` and `scandal_review_status` on the `NewsEvent` record.

## Changes

### `app/admin/page.tsx`

Add `is_scandal` to the `recentNews` Prisma select:

```ts
select: { id, headline, url, source, published_at, hidden, is_scandal }
```

### `app/admin/components/NewsFeedOverride.tsx`

1. Add `is_scandal: boolean` to the `NewsItem` interface.
2. Add a `toggleScandal(id, is_scandal)` async function that calls `POST /api/admin/scandal-review` with `action: 'confirm'` (mark) or `action: 'reject'` (unmark), then updates local state optimistically.
3. Render a second button per row alongside the Hide/Unhide button:
   - When `is_scandal: true` — label "Unscandal", style `bg-ontario-red text-white hover:bg-red-700 disabled:opacity-50`
   - When `is_scandal: false` — label "Scandal", style `bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50`
4. Both buttons are disabled while `loading === item.id` (existing pattern).

## Data Flow

```
Admin clicks "Scandal" (wasScandal=false)
  → toggleScandal(id, wasScandal=false)
  → POST /api/admin/scandal-review { id, action: 'confirm' }
  → DB: is_scandal=true, scandal_review_status='confirmed'
  → local state: item.is_scandal = true
  → button switches to "Unscandal" (red)

Admin clicks "Unscandal" (wasScandal=true)
  → toggleScandal(id, wasScandal=true)
  → POST /api/admin/scandal-review { id, action: 'reject' }
  → DB: is_scandal=false, scandal_review_status='rejected'
  → local state: item.is_scandal = false
  → button switches to "Scandal" (neutral)
```

## Known Limitations / Accepted Trade-offs

**Authorization:** The existing `/api/admin/scandal-review` route only checks `userId` (Clerk), not an admin role. This is a pre-existing gap across all admin routes and is out of scope for this feature.

**Error handling:** `toggleScandal` follows the same pattern as `toggleHidden` — no optimistic rollback on failure. If the request fails, the button state may be momentarily out of sync until the next full page load. Accepted as-is, consistent with the rest of the admin UI.

**`scandal_review_status` side effect:** Calling `action: 'reject'` to unmark a manually-set scandal will write `scandal_review_status: 'rejected'` even on items the AI never classified. This is intentional — it makes the item queryable and doesn't block the AI queue (the queue filters for `'pending'`, not `null`). AI can still re-classify these items in the future if it encounters them.

**Hidden + scandal items:** An item can be both hidden and marked as a scandal. This is a valid admin state (e.g., hide from the public feed but track internally). The `ScandalQueue` does not filter by `hidden`, so a hidden scandal will appear there. No special UX is added for this case.

## No-ops / Out of Scope

- No schema changes required — `is_scandal` and `scandal_review_status` already exist.
- No new API routes.
- No changes to `ScandalQueue` or its workflow.
- No frontend display changes outside the admin dashboard.
