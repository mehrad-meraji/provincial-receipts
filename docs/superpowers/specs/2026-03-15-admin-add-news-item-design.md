# Admin: Add Arbitrary News Item — Design Spec

**Date:** 2026-03-15

## Problem

The news scraper misses articles. Admins need a way to manually inject a real article into the `NewsEvent` feed without touching the database directly.

## Scope

A minimal inline form inside the existing `NewsFeedOverride` admin component. No new pages, no modals.

## API Route

**`POST /api/admin/news-add`**

- **Input:** `{ headline: string, url: string, source: string, is_scandal: boolean }`
- **Validation:** All four fields required; returns 400 with `{ error }` if any are missing.
- **Writes to `NewsEvent`** with:
  - `published_at` → `new Date()` (now)
  - `hidden` → `false`
  - `scandal_review_status` → `'confirmed'` if `is_scandal`, else `null`
  - All other fields (`topic`, `sentiment`, `tags`, `excerpt`, `billId`) → default/null
- **Response:** `200` with the created `NewsEvent` record (same shape as items in `NewsFeedOverride`).

Manual items skip the scandal queue — `scandal_review_status: 'confirmed'` means they are treated as already reviewed.

## UI — NewsFeedOverride

- **Toggle:** A "＋ Add article" button at the top of the component. Clicking it expands/collapses the form.
- **Form fields (inline, compact):**
  - URL (text input)
  - Headline (text input)
  - Source (text input)
  - Scandal? (checkbox)
  - Submit button
- **On submit:**
  1. POST to `/api/admin/news-add`
  2. Prepend returned item to `items` state
  3. Collapse and reset the form
  4. Show inline error message if request fails
- **Loading state:** Submit button disabled while in-flight.

## Data Flow

```
Admin fills form → POST /api/admin/news-add
  → prisma.newsEvent.create(...)
  → returns NewsItem
Admin component prepends item to list → item immediately visible with hide/scandal toggles
```

## Out of Scope

- Auto-parsing metadata from URL
- Associating item to a `Bill`
- Any field beyond headline, url, source, is_scandal
