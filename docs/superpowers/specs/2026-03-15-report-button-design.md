# Report Button & Admin Reports Panel — Design Spec

**Date:** 2026-03-15
**Feature:** Visitor report button on news items and bill pages, with an admin review panel to action reports.

---

## Overview

Visitors can flag errors on any news item or bill detail page by clicking a "report" button. Reports are anonymous, protected by Cloudflare Turnstile and per-IP rate limiting, and land in a new "Reports" panel on the admin page. Admins can dismiss reports (no action needed) or resolve them (fix the underlying item inline).

---

## 1. Data Model

One new Prisma model. No foreign key relation to `NewsEvent` or `Bill` — `targetId` is a soft reference so reports survive if the item is later hidden or deleted.

```prisma
model Report {
  id          String   @id @default(cuid())
  type        String   // 'news' | 'bill'
  targetId    String   // NewsEvent.id or Bill.id
  targetTitle String   // snapshot of headline or bill number + title for display
  categories  String[] // one or more of: 'wrong-information' | 'broken-link' | 'misclassified' | 'outdated' | 'spam-irrelevant' | 'other'
  comment     String?  // optional free-text from visitor
  status      String   @default("pending") // 'pending' | 'resolved' | 'dismissed'
  ip          String?  // stored server-side only, never returned to client
  createdAt   DateTime @default(now())
}
```

---

## 2. Report Categories

Visitors choose one or more from:

| Slug | Label |
|---|---|
| `wrong-information` | Wrong information |
| `broken-link` | Broken link |
| `misclassified` | Misclassified |
| `outdated` | Outdated |
| `spam-irrelevant` | Spam / irrelevant |
| `other` | Other (requires comment) |

---

## 3. Rate Limiting & Spam Protection

Two layers:

**Layer 1 — Cloudflare Turnstile (primary)**
Invisible CAPTCHA widget embedded in the report modal. The widget generates a one-time token the client sends with the report payload. The server verifies the token by calling `https://challenges.cloudflare.com/turnstile/v0/siteverify` with the `secret` key and the submitted token. Parse the JSON response body: if `response.success !== true`, return `403`. Failed verification returns `403` before any DB access.

**Layer 2 — Per-IP rate limit (fallback)**
Before inserting, count `Report` rows with the same `ip` created in the last hour. If count ≥ 5, return `429 Too Many Requests`. The IP is extracted from the `x-forwarded-for` header (Vercel sets this).

### Cloudflare Turnstile Setup

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add site**
2. Name: `fuckdougford`, Widget type: **Invisible**, add your domain (e.g. `fuckdougford.ca`)
3. Copy the two keys:
   - **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public, goes in browser)
   - **Secret Key** → `TURNSTILE_SECRET_KEY` (private, server-side only)
4. Add both to Vercel environment variables
5. Add to `.env.example`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY="your_site_key_here"
   TURNSTILE_SECRET_KEY="your_secret_key_here"
   ```

Install the Turnstile React package before implementing:
```
pnpm add @marsidev/react-turnstile
```

---

## 4. API Routes

All routes live under `app/api/`.

### `POST /api/report` — Public

No authentication. Protected by Turnstile + per-IP rate limit.

**Request body:**
```ts
{
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
  categories: string[]   // min 1 item
  comment?: string
  turnstileToken: string // from widget
}
```

**Logic:**
1. **Validate input** — return `400` if: `type` is not `'news'` or `'bill'`; `targetId` or `targetTitle` are empty strings; `categories` is empty or not an array; `turnstileToken` is absent; `categories` includes `'other'` but `comment` is absent or blank
2. **Verify Turnstile** — POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `{ secret: TURNSTILE_SECRET_KEY, response: turnstileToken }`. Parse JSON body; if `data.success !== true`, return `403`
3. **Extract IP** — from `x-forwarded-for` header (first value)
4. **Rate limit** — count `Report` rows with the same `ip` in the last hour; if ≥ 5 return `429`
5. **Insert** — create `Report` record with `status: 'pending'`
6. Return `{ ok: true }`

---

### `GET /api/admin/reports` — Clerk protected

Returns pending reports ordered by `createdAt desc`, capped at `take: 200`. Never returns `ip`.

```ts
// Response: ReportItem[]
{
  id: string
  type: string
  targetId: string
  targetTitle: string
  categories: string[]
  comment: string | null
  status: string
  createdAt: string // ISO string
}[]
```

The `ReportItem` type (used by all admin components) is defined as this shape — `ip` is never selected or returned.

---

### `POST /api/admin/reports/[id]/dismiss` — Clerk protected

Sets `status: 'dismissed'` on the report. No changes to the underlying item.

```ts
// Response
{ ok: true }
```

---

### `POST /api/admin/reports/[id]/resolve` — Clerk protected

Applies fix fields to the underlying item then sets `status: 'resolved'`. Uses `POST` (consistent with all other admin mutation routes).

**Request body (news):**
```ts
{
  url?: string
  topic?: string
  is_scandal?: boolean
  hidden?: boolean
}
```

**Request body (bill):**
```ts
{
  url?: string
  status?: string
  toronto_flagged?: boolean
}
```

Only provided fields are updated. Uses `prisma.newsEvent.update` or `prisma.bill.update` based on report `type`.

**Error handling:**
- If the target item no longer exists (Prisma `P2025`), still set `report.status = 'resolved'` and return `{ ok: true, warning: 'target item no longer exists' }`. The report is cleared from the queue; admin is notified via the response.
- If a news `url` update hits a unique constraint violation (`P2002`), return `409` with `{ error: 'That URL is already used by another news item' }`. The report status is NOT updated.

---

### `POST /api/admin/reports/bulk` — Clerk protected

```ts
// Request
{ ids: string[], action: 'dismiss' | 'resolve' }
```

Bulk-updates `status` on all specified report IDs. For bulk resolve, only the status changes — no item edits (to fix specific items, use the single resolve modal). Returns `{ ok: true, count: number }`.

**UI note:** The bulk action button for resolve should be labelled **"mark resolved"** (not "resolve") to clearly distinguish it from the per-item resolve that opens the fix modal.

---

### `GET /api/admin/reports/[id]/target` — Clerk protected

Fetches current editable field values for the target item so `ResolveModal` can pre-fill its form. Called client-side when the resolve modal opens.

**Response (news):**
```ts
{ url: string, topic: string | null, is_scandal: boolean, hidden: boolean }
```

**Response (bill):**
```ts
{ url: string, status: string, toronto_flagged: boolean }
```

Determines type by looking up the `Report` by `id`. If report or target not found, returns `404`.

---

## 5. Components

### Public

**`app/components/shared/ReportButton.tsx`** — Client component
Props: `type: 'news' | 'bill'`, `targetId: string`, `targetTitle: string`
Renders the flag icon + "report" button (monospace font, Lucide `Flag` icon). Owns `isOpen` state to show/hide `ReportModal`.

**`app/components/shared/ReportModal.tsx`** — Client component
Props: `type`, `targetId`, `targetTitle`, `onClose: () => void`
Contains:
- Category checkbox list (multi-select, min 1 required to submit)
- Optional comment textarea
- Invisible `<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onSuccess={setToken} />` widget from `@marsidev/react-turnstile`
- Cancel + Submit buttons (submit disabled until: at least 1 category selected, Turnstile token is ready, and — if `'other'` is selected — comment is non-empty)
- On submit: POST to `/api/report`, show brief "Thanks for your report" confirmation message, then close

---

### Admin

**`app/admin/components/ReportsPanel.tsx`** — Client component
Props: `initialReports: ReportItem[]`

`ReportItem` type:
```ts
interface ReportItem {
  id: string
  type: string
  targetId: string
  targetTitle: string
  categories: string[]
  comment: string | null
  status: string
  createdAt: string // ISO string
}
```

Contains:
- Bulk actions bar: select-all checkbox, "dismiss selected" and **"mark resolved"** buttons (disabled when nothing selected)
- List of report cards, each showing:
  - Checkbox for bulk selection
  - Type badge (`news` / `bill`), timestamp
  - Item title
  - Category tags
  - Optional comment (italic)
  - Footer: "dismiss" button, "resolve" button (opens `ResolveModal`)
- Optimistic UI: card fades out on action without waiting for server

**`app/admin/components/ResolveModal.tsx`** — Client component
Props: `report: ReportItem`, `onClose: () => void`, `onResolved: (id: string) => void`

On mount: fetches `GET /api/admin/reports/[report.id]/target` to get current field values for pre-filling the form. Shows a loading state while fetching.

Renders fix fields based on `report.type`:

**News fields:**
- Source URL (text input, pre-filled from target fetch)
- Topic (select: housing / transit / ethics / environment / finance / other, pre-filled)
- Scandal flag (on/off toggle buttons, pre-filled)
- Hidden from feed (yes/no toggle buttons, pre-filled)

**Bill fields:**
- Source URL (text input, pre-filled)
- Status (select: standard bill statuses, pre-filled)
- Toronto flagged (yes/no toggle buttons, pre-filled)

Footer: "cancel" + "save & resolve". On save: POST to `/api/admin/reports/[id]/resolve`, call `onResolved(report.id)` to remove from list. On `409` (URL conflict), show inline error without closing the modal.

---

## 6. Integration Points

### `app/components/news/NewsItem.tsx`
- Add `'use client'` directive at the top of the file (required because `ReportButton` is a Client Component with state)
- Add `id` to `NewsItemProps` interface (confirm it is already present; if not, add it)
- Render `<ReportButton type="news" targetId={item.id} targetTitle={item.headline} />` inline right of the headline row

### `app/bills/[id]/page.tsx`
- Render `<ReportButton type="bill" targetId={bill.id} targetTitle={`${bill.bill_number}: ${bill.title}`} />` inline right of the bill title header, alongside the existing "full text" external link button
- `app/bills/[id]/page.tsx` is already `'use client'` compatible as a Server Component that renders Client Components

### `app/admin/page.tsx`
- Add `prisma.report.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, type: true, targetId: true, targetTitle: true, categories: true, comment: true, status: true, createdAt: true } })` to the existing `Promise.all`
- Serialize `createdAt` before passing to client: `.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))`
- Render `<ReportsPanel initialReports={reports} />` as the **first** section (above scandal queue), wrapped in a `<section>` with an `<h2>Reports ({reports.length})</h2>` heading to match the existing section convention

### `prisma/schema.prisma`
- Add `Report` model

### `.env.example`
- Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`

---

## 7. Deployment

1. Run `pnpm prisma db push` against production Neon DB
2. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to Vercel env vars
3. Deploy to Vercel
4. Verify Turnstile widget appears and token is generated in the report modal
5. Submit a test report and confirm it appears in the admin panel

---

## 8. Out of Scope

- Email notifications to admins when reports arrive
- Public visibility of report counts or statuses
- Editing news headlines (only classification fields and URL are editable via resolve)
- Pagination on the admin reports list (add when volume demands it)
