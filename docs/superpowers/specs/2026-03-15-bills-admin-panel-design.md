# Bills Admin Panel — Design Spec

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add a comprehensive bills admin panel that lets admins browse all bills, edit their tags, and control public visibility via a new `published` field. The existing `toronto_flagged` field remains as an AI-managed signal; `published` becomes the gate for the public feed.

---

## 1. Data Model

### New field on `Bill`

```prisma
published Boolean @default(false)
```

**Rules:**
- `published` is `false` by default for all new bills
- When the scraper inserts a new bill with `toronto_flagged = true`, it also sets `published = true` in the same write. When inserting with `toronto_flagged = false`, `published` is left at its default `false`.
- On subsequent scraper re-classification updates, `published` is **never touched** — only `toronto_flagged` is updated. This preserves any admin override.
- Admin can toggle `published` in either direction regardless of `toronto_flagged`
- `toronto_flagged` is AI-managed. The existing `POST /api/admin/bill-flag` route and the `toronto_flagged` checkbox in `ResolveModal` both currently allow admin modification of `toronto_flagged` — both are removed as part of this work (see Section 6).

**Migration and deployment order:**

The schema change and data backfill are in the same Prisma migration file as raw SQL, so they run atomically in a single transaction:

```sql
ALTER TABLE "Bill" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Bill" SET "published" = true WHERE "toronto_flagged" = true;
```

**Deploy the migration before deploying the updated app code.** The app code changes in Sections 4–5 assume `published` exists; running them before migration will cause runtime errors. Deploy the scraper update in the same release as the migration — if the scraper runs between migration and scraper code deploy, bills inserted in that window will have `toronto_flagged=true` but `published=false`. If this window cannot be avoided, run a post-deploy backfill: `UPDATE "Bill" SET published = true WHERE toronto_flagged = true AND published = false`.

---

## 2. Admin UI

### Component

Replace the existing `BillsOverride` component with a new `BillsPanel` component:
- **New file:** `app/admin/components/BillsPanel.tsx`
- **Delete:** `app/admin/components/BillsOverride.tsx`
- **Update:** `app/admin/page.tsx`:
  - Remove `BillsOverride` import and JSX usage
  - Add `BillsPanel` import and render it
  - Remove the `flaggedBills` Prisma query and its slot in the `Promise.all` array — `BillsPanel` fetches its own data client-side via `GET /api/admin/bills`

`BillsPanel` is a client component. It receives no props from `admin/page.tsx`.

### Layout: Table + Side Drawer

**Table columns:**
| Column | Content |
|--------|---------|
| Bill | Bill number (e.g. `B-42`) |
| Title | Bill title |
| Tags | Up to 2 tag pills. If more than 2 tags exist, show first 2 + a muted `+N` label (e.g. `+2`). No tooltip. |
| Toronto | `Building2` Lucide icon, orange if `toronto_flagged`, muted if not. Read-only. |
| Published | `Globe` Lucide icon, green if `published`, muted if not. Read-only indicator in table. |

**Toolbar:**
- Search input: server-side search by bill number or title (case-insensitive partial match), sent as `q` query param. Any change to the search input resets to page 1 and closes the drawer. An empty string `q=` is treated identically to omitting `q` (no filter applied).
- Filter chips with their API `filter` values and Prisma conditions:
  - "All" → `all` — no filter
  - "Published" → `published` — `WHERE published = true`
  - "Toronto-flagged" → `toronto` — `WHERE toronto_flagged = true`
  - "Unpublished" → `unpublished` — `WHERE published = false`
  - Changing the active chip resets to page 1 and closes the drawer.
  - When both `filter` and `q` are active, they are ANDed.
- Pagination: 25 bills per page, server-side. Rendered below the table. Changing page closes the drawer.

**Default sort:** `date_introduced DESC NULLS LAST`, with `id ASC` as tiebreaker for stable pagination.

**Side Drawer (opens on row click):**
- Header: bill number + title + close (`X`) button
- Meta row:
  - Toronto-flagged: `Building2` icon (orange if flagged, muted if not) — read-only
  - Date introduced: `Clock` icon + date formatted as `MMM D, YYYY`. If `date_introduced` is null, show `—`.
- **Tags section:**
  - Current tags shown as removable pills (tag text + `X` Lucide icon to remove). All current tags — including any legacy tags outside the predefined set — show a remove button. The remove action uses `action: 'remove'` which bypasses the tag enum check (see API section).
  - Available tags shown as addable chips (predefined set only: `housing`, `transit`, `ethics`, `environment`, `finance`, `other`). Only shows chips for predefined tags not already applied. Legacy tags that have been removed cannot be re-added; this is intentional — only predefined tags are addable.
- **Visibility section:**
  - Toggle switch with `Globe` icon
  - Label: "Published" (green) or "Unpublished" (muted)
  - Subtext: "Visible on public feed" / "Hidden from public feed"

**Interactions:**
- Tag add/remove: fires API immediately. While the request is in-flight, disable all tag interactions (add chips and remove buttons) to prevent concurrent mutations. On success: update local state with response. On failure: restore previous local state, show error toast "Failed to update tags". If the user clicks a different row or closes the drawer while a tag mutation is in-flight, close the drawer immediately; ignore the in-flight response when it resolves (do not update state, do not show toast).
- Publish toggle: optimistic UI update, fires API immediately. On success: update local state with the `published` value from the response. On failure: if the drawer is still open, revert the toggle to its pre-action state and show error toast "Failed to update visibility". If the drawer is already closed when the failure arrives, take no action.
- Drawer displays point-in-time data from when the row was clicked. No refresh occurs while the drawer is open.
- Drawer closes when: `X` button clicked, page changes, filter chip changes, or search input changes. Clicking another row while the drawer is open closes the current drawer and opens the clicked row's drawer.

---

## 3. API Routes

All error responses return `{ error: string }` where `error` is a human-readable message (not a machine code).

All routes use inline Clerk auth: `const { userId } = await auth(); if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` — following the existing project pattern.

### `POST /api/admin/bill-label`

**Auth:** Clerk `userId` required (inline check)
**Body:** `{ id: string, tag: string, action: 'add' | 'remove' }`
**Validation:**
- `id` must be a non-empty string
- `action` must be `'add'` or `'remove'`
- If `action` is `'add'`: `tag` must be one of `housing`, `transit`, `ethics`, `environment`, `finance`, `other` — validated server-side against this hardcoded list in the route file; returns 400 otherwise
- If `action` is `'remove'`: `tag` can be any non-empty string — server accepts any value to allow removal of legacy tags

**Behaviour:**
- `add`: appends tag to `Bill.tags` if not already present. If already present, no-op — returns 200 with current tags.
- `remove`: removes tag from `Bill.tags`. If not present, no-op — returns 200 with current tags.
- Returns `{ tags: string[] }`

**Errors:** 400 `{ error: string }` on validation failure, 401 on missing auth, 404 if bill not found

---

### `POST /api/admin/bill-publish`

**Auth:** Clerk `userId` required (inline check)
**Body:** `{ id: string, published: boolean }`
**Validation:**
- `id` must be a non-empty string
- `published` must be a boolean

**Behaviour:**
- Updates `Bill.published` to the provided value
- Returns `{ published: boolean }`

**Errors:** 400 `{ error: string }` on validation failure, 401 on missing auth, 404 if bill not found

---

### `GET /api/admin/bills`

**Auth:** Clerk `userId` required (inline check)

**Query params:**
| Param | Type | Default | Validation |
|-------|------|---------|------------|
| `page` | integer ≥ 1 | `1` | Non-integer or `page < 1` → treat as `1`. Page beyond last → return empty `bills: []` with correct `total`. |
| `filter` | `all` \| `published` \| `toronto` \| `unpublished` | `all` | Unrecognised value → treat as `all`. |
| `q` | string | — | Empty string treated as absent (no filter). |

**Sort:** `date_introduced DESC NULLS LAST`, `id ASC` tiebreaker.

**Filter + search:** ANDed when both present.

**Returns:**
```ts
{
  bills: {
    id: string
    bill_number: string
    title: string
    tags: string[]
    toronto_flagged: boolean
    published: boolean
    date_introduced: string | null  // ISO 8601
  }[]
  total: number
  page: number
  pageSize: number  // always 25
}
```

**Errors:** 401 `{ error: string }` on missing auth.

**Replaces:** `GET /api/admin/bills-search` — that route is deleted. `bills-search` was only called by `BillsOverride`, which is also deleted; no other callers exist.

---

## 4. Public Feed Changes

**`app/page.tsx`** has two `toronto_flagged: true` queries:

- `prisma.bill.count({ where: { toronto_flagged: true } })` — feeds the "Toronto Bills" KPI counter. **Leave on `toronto_flagged`** — the counter measures AI-flagged bills, not published bills.
- `prisma.bill.findMany({ where: { toronto_flagged: true } })` — feeds the homepage bills table. **Convert to `published: true`.**

**`app/api/bills/route.ts`** — two changes:
1. The `toronto_only` parameter sets `where.toronto_flagged = true`. Convert to `where.published = true`. The parameter name `toronto_only` is retained; its semantics shift to filter by published — intentional.
2. The `orderBy` array is `[{ toronto_flagged: 'desc' }, { impact_score: 'desc' }, { date_introduced: 'desc' }]`. Replace only the first element: `{ toronto_flagged: 'desc' }` → `{ published: 'desc' }`. The full result is `[{ published: 'desc' }, { impact_score: 'desc' }, { date_introduced: 'desc' }]`. The `impact_score` and `date_introduced` secondary sorts remain unchanged and provide meaningful ordering within the published=true group. For `toronto_only=true` callers all results are published so the primary sort is neutral; for unfiltered callers, published bills now surface first — intentional.

**`BillRow.tsx` / `ImpactScore`** — these components receive and display `toronto_flagged` for visual styling (red left border, flagged indicator). Leave these unchanged. The `toronto_flagged` field is still returned by all bill queries and is a valid read-only data point. A published bill without AI flagging will simply not show the toronto highlight — intentional.

**`app/api/admin/reports/[id]/resolve/route.ts`** — remove `toronto_flagged` from the bill update branch entirely:
- Remove the `toronto_flagged` destructure binding from the `body as { ... }` cast (both the variable name in the destructure and the `toronto_flagged?: boolean` property in the inline type)
- Remove the line `if (toronto_flagged !== undefined) data.toronto_flagged = toronto_flagged`
This closes the back-door write path to `toronto_flagged`.

**`app/api/admin/reports/[id]/target/route.ts`** — remove `toronto_flagged: true` from the bill `select` (line 29). Do not add `published` — `ResolveModal` is not responsible for publish toggling; that is handled exclusively by `BillsPanel` via `POST /api/admin/bill-publish`.

**`app/admin/components/ResolveModal.tsx`** — in addition to removing the checkbox UI and submit logic:
- Remove `toronto_flagged: boolean` from the `TargetBill` interface
- Remove any `useEffect` or field assignment that reads `data.toronto_flagged`
- Do not add `published` to `TargetBill` or to the resolve submit — ResolveModal does not own bill publish state.

**`app/page.tsx` line 37 `findMany`** — the query uses `include: { sponsor_mpp: ... }` with no explicit `select` on bill fields, so all bill fields including `toronto_flagged` are returned automatically. Only the `where` clause changes. `BillRow` will continue to receive `toronto_flagged` with no other changes needed.

**Known `toronto_flagged: true` Prisma `where` occurrences to convert to `published: true`** (exhaustive list based on codebase search — verify no others exist):
- `app/page.tsx` line 37 (findMany feeding homepage bills table) — convert
- `app/api/bills/route.ts` (toronto_only param) — convert

**Leave on `toronto_flagged`** (AI-signal semantics, do not convert):
- `app/page.tsx` line 32 (count for KPI strip)

---

## 5. Scraper Update

**File:** `lib/scraper/bills.ts`

The scraper uses a Prisma upsert with explicit fields (not a `billData` spread). Do not restructure the existing upsert. Instead, make one targeted addition: on the `create` block only, add a conditional `published` field after all existing fields:

```ts
// In the existing upsert's create block, add after all other fields:
...(scoreResult.toronto_flagged ? { published: true } : {}),
```

Do not add `published` to the `update` block — omitting it there preserves admin overrides.

---

## 6. Deletions

The following are removed entirely. `bill-flag` and `bills-search` were exclusively called by `BillsOverride` and have no other callers.

- **`app/admin/components/BillsOverride.tsx`** — replaced by `BillsPanel`
- **`app/api/admin/bills-search/route.ts`** — replaced by `GET /api/admin/bills`
- **`app/api/admin/bill-flag/route.ts`** — `toronto_flagged` is no longer admin-editable; only called by `BillsOverride`
- **`app/admin/components/ResolveModal.tsx`** — remove: `toronto_flagged` checkbox UI, its submit logic, `toronto_flagged: boolean` from the `TargetBill` interface, and any assignment reading `data.toronto_flagged`. All other `ResolveModal` functionality is retained. Note: `toronto_flagged` submitted via `POST /api/admin/reports/[id]/resolve`, not `bill-flag`.

---

## 7. Out of Scope

- Role-based access control
- Bulk publish/unpublish actions
- Custom free-form tags
- Audit log
