# Admin: Add Arbitrary News Item — Design Spec

**Date:** 2026-03-15

## Problem

The news scraper misses articles. Admins need a way to manually inject a real article into the `NewsEvent` feed without touching the database directly.

## Scope

A minimal inline form inside the existing `NewsFeedOverride` admin component. No new pages, no modals.

## API Route

**`POST /api/admin/news-add`**

**Authentication:** In-route `const { userId } = await auth()` check; return `401` if null. Matches the pattern in `news-hide/route.ts` and other admin routes.

- **Input:** `{ headline: string, url: string, source: string, is_scandal: boolean }`
- **Validation:**
  - `headline`, `url`, `source` must be non-empty strings; return `400 { error }` if any are missing or empty.
  - `is_scandal` must be a boolean: `typeof body.is_scandal !== 'boolean'` → return `400 { error }`. The client always sends it explicitly (unchecked = `false`).
  - `url` must parse as a valid URL via `new URL(body.url)` in a try/catch; return `400 { error: 'Invalid URL' }` if it throws.
- **Duplicate URL:** Catch Prisma unique constraint error (code `P2002`) and return `409 { error: 'This URL already exists in the feed.' }`.
- **Writes to `NewsEvent`** with:
  - `headline`, `url`, `source`, `is_scandal` → from request body
  - `published_at` → `new Date()` (now)
  - `hidden` → `false`
  - `tags` → `[]` (explicit empty array in Prisma `data` object)
  - `scandal_review_status` → `'confirmed'` if `is_scandal`, else `null`
  - All other fields (`topic`, `sentiment`, `excerpt`, `billId`) → omitted (Prisma null defaults)
- **Response:** `200` via `NextResponse.json(created)` where `created` is the Prisma record. `NextResponse.json()` serializes `Date` to ISO string automatically, so `published_at` arrives at the client as a string — no manual `.toISOString()` needed.
- **Response shape** matches the `NewsItem` interface: `{ id, headline, url, source, published_at, hidden, is_scandal }`.

Manual items skip the scandal queue — `scandal_review_status: 'confirmed'` is stored but not sent to the client.

## UI — NewsFeedOverride

**New state:**
- `showForm: boolean` — controls form visibility (default `false`)
- `formLoading: boolean` — tracks form submission in-flight (default `false`); independent of the existing per-item `loading: string | null` state so item buttons are unaffected during form submission

**Toggle:** A "＋ Add article" button at the top of the component. Clicking it toggles `showForm`.

**Form fields (inline, compact), in this order:**
- URL (text input)
- Headline (text input)
- Source (text input)
- Scandal? (checkbox, default unchecked)
- Submit button (disabled while `formLoading`)

**On submit:**
1. Set `formLoading = true`
2. POST to `/api/admin/news-add` with `{ headline, url, source, is_scandal }`
3. On success: prepend returned item to `items` state; reset all form fields (text fields → `''`, checkbox → `false`); set `showForm = false`
4. On error: show inline error message from response (or generic fallback); form stays open
5. Always: set `formLoading = false`

## Data Flow

```
Admin fills form → POST /api/admin/news-add
  → auth() check
  → validate fields + URL format
  → prisma.newsEvent.create(...)
  → NextResponse.json(created)
Admin component prepends item to list → item immediately visible with hide/scandal toggles
```

## Out of Scope

- Auto-parsing metadata from URL
- Associating item to a `Bill`
- Any field beyond headline, url, source, is_scandal
