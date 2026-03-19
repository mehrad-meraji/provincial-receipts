# Named Individuals Feature — Design Spec
**Date:** 2026-03-18
**Status:** Approved

---

## Overview

Add a "named individuals" layer to the site: people (lobbyists, donors, directors, beneficiaries) connected to public payouts under the Ford administration. The feature consists of:

1. A horizontal carousel at the top of the landing page
2. A standalone gallery page at `/people`
3. Individual detail pages at `/people/[slug]`
4. Admin panel support (new panel inside the existing consolidated admin page)
5. API routes for admin CRUD
6. Seed scripts for the initial research dump

Source research follows the "Lobbyist & Donation Cross-Reference" methodology: Ontario Lobbyist Registry (highest confidence), Elections Ontario donations, Ontario Business Registry, news reports, court filings, and FOI request documents.

---

## Data Model

### Prisma Enum: `Confidence`
```prisma
enum Confidence {
  high
  medium
  low
}
```
Using a Prisma enum prevents invalid values at the DB layer. The three values are load-bearing (they gate public visibility).

### `Person`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `slug` | String (unique) | Used in URLs (`/people/[slug]`) |
| `name` | String | Actual full name |
| `bio` | String | Short biography paragraph |
| `photo_url` | String? | Public domain / official photo URL |
| `organization` | String? | Company or org affiliation |
| `organization_url` | String? | Link to org website or registry entry |
| `confidence` | Confidence | `high` \| `medium` \| `low` (enum) |
| `published` | Boolean | Admin-controlled publish gate (default: false) |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

### `PersonConnection` (Person ↔ Scandal junction)
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `personId` | String | FK → Person (cascade delete) |
| `scandalId` | String | FK → Scandal (restrict delete) |
| `connection_type` | String | `"Lobbyist"` \| `"Donor"` \| `"Director"` \| `"Beneficiary"` |
| `description` | String | One-sentence explanation of the specific link |
| `createdAt` | DateTime | Auto |

**Constraint:** `@@unique([personId, scandalId, connection_type])` — prevents duplicate junction rows from seed scripts or admin.
**Cascade:** `onDelete: Cascade` on the Person relation; `onDelete: Restrict` on Scandal (a scandal cannot be deleted while people are connected to it).

### `PersonSource`
| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | PK |
| `personId` | String | FK → Person (cascade delete) |
| `url` | String | Source URL |
| `title` | String | Display title for the source |
| `source_type` | String | `"Registry"` \| `"News"` \| `"Corporate"` \| `"Court"` \| `"FOI"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Cascade:** `onDelete: Cascade` on the Person relation.

---

## Confidence Levels & Public Visibility

| Level | Meaning | Public Display |
|---|---|---|
| **high** | Listed in government registry (Lobbyist Registry, Elections Ontario) | Name shown |
| **medium** | Named in credible news report, court filing, or FOI document | Name shown |
| **low** | Inferred via corporate registry (director of company that received payout) | Name hidden — record retained internally |

**Enforcement rule:** All public-facing queries are routed through `lib/people.ts` which always appends `confidence: { in: ['high', 'medium'] }, published: true`. This filter is never applied inline in page components — one place to audit, no accidental leaks. A request for a low-confidence or unpublished person's slug returns `null` from the helper, which triggers a `notFound()` 404.

---

## `lib/people.ts` — Public Query Interface

This module is the single source of truth for all public-facing person queries.

```ts
// Returns all published high/medium people, with their connections pre-joined
// Takes optional connection_type filter for the gallery filter bar
getPeople(filter?: { connection_type?: string }): Promise<PersonWithConnections[]>

// Returns a single published high/medium person by slug, with connections + sources
// Returns null if not found, low confidence, or unpublished
getPersonBySlug(slug: string): Promise<PersonWithDetails | null>

// Returns up to 20 published high/medium people for the carousel, ordered by createdAt desc
getPeopleForCarousel(): Promise<PersonCardData[]>
```

`PersonWithConnections` includes: all Person fields + `connections[]` (with scandal title, slug, tldr) + primary `connection_type` badge.
`PersonWithDetails` includes: all Person fields + `connections[]` (full scandal join) + `sources[]`.
`PersonCardData` is a slim projection: `slug`, `name`, `photo_url`, `organization`, `confidence`, primary `connection_type`.

---

## Pages & Components

### Carousel — `app/components/people/PeopleCarousel.tsx`
- Placed on `app/page.tsx` between `<Masthead>` and the scandal timeline, with a section heading "Connected Individuals" styled to match the existing "Documented Scandals" heading
- Fetches via `getPeopleForCarousel()` (max 20, `createdAt desc`)
- Horizontal CSS scroll-snap strip (no carousel library)
- Slow auto-scroll via CSS animation (`animation: scroll linear infinite`), pauses on `hover` via `animation-play-state: paused`
- Card contents: photo or redacted placeholder block, name, organization, one connection badge
- **Redacted placeholder:** black rectangle with `[REDACTED]` text + person's initials, matching the site's monochrome aesthetic
- Connection badge colors: `Lobbyist` → red, `Donor` → amber, `Director` → blue, `Beneficiary` → purple
- Cards link to `/people/[slug]`
- If no people are published yet, carousel is hidden (no empty state shown on homepage)

### `app/components/people/PersonCard.tsx`
Shared card component used in both carousel and gallery. Props: `PersonCardData`. Renders photo/redacted block, name, organization, connection badge. Wrapped in `<Link href={/people/${slug}}>`.

### `app/components/people/PersonBadge.tsx`
Small colored pill for connection type. Props: `connection_type: string`. Returns appropriate color class.

### Gallery — `app/people/page.tsx`
- `export const dynamic = 'force-dynamic'`
- Reads optional `?type=` query param (e.g. `?type=Lobbyist`) server-side, passes to `getPeople({ connection_type })`
- Filter bar: All / Lobbyist / Donor / Director / Beneficiary — rendered as `<Link>` components updating the URL query param (server-side re-render, no client state)
- Full-width grid of `<PersonCard>` components
- `generateMetadata` returns title "People Connected to Ford Government Payouts"

### Detail Page — `app/people/[slug]/page.tsx`
- Calls `getPersonBySlug(slug)`. If `null`, calls `notFound()`
- This covers: person not found, confidence is `low`, or `published = false`
- Hero section: large photo or full redacted block, name, organization with external link, bio
- Connection badges strip (one per unique `connection_type` across all connections)
- "Connected Scandals" section: list of scandal cards (title, tldr, link to `/scandals/[slug]`)
- "Sources" section: sourced links grouped by `source_type`, with type label shown
- `generateMetadata` returns title "[Name] — Ford Government Connections"

---

## Admin Panel

The existing admin is a single consolidated page at `app/admin/page.tsx` with panels per entity. A new `PeoplePanel` component is added to this page.

### `app/components/admin/PeoplePanel.tsx`
- Table listing all people including `low` confidence (admin sees everything)
- Columns: name, organization, confidence badge, published toggle, edit button
- "Add Person" button opens inline create form
- Edit opens inline edit form

### Admin Form — create/edit
Fields: name, slug (auto-generated from name, editable), bio, photo_url, organization, organization_url, confidence selector, published toggle.

**Connecting to scandals:**
- Search box (calls `GET /api/admin/scandals?q=` — existing endpoint) returns matching scandals
- User selects a scandal, then sets `connection_type` (dropdown: Lobbyist / Donor / Director / Beneficiary) and `description` (text input)
- Adds a `PersonConnection` row inline; existing connections listed below with delete buttons

**Adding sources:**
- URL input + title input + `source_type` dropdown (Registry / News / Corporate / Court / FOI)
- Adds a `PersonSource` row inline; existing sources listed with delete buttons

### API Routes

**`app/api/admin/people/route.ts`** — `GET` (list all, admin-only) and `POST` (create person)

**`app/api/admin/people/[id]/route.ts`** — `GET` (single), `PATCH` (update), `DELETE` (delete person + cascade)

**`app/api/admin/people/[id]/connections/route.ts`** — `POST` (add connection), `DELETE` (remove connection by id)

**`app/api/admin/people/[id]/sources/route.ts`** — `POST` (add source), `DELETE` (remove source by id)

All admin routes protected by Clerk `auth()` check, same pattern as existing admin routes.

---

## Photo Treatment — Newsprint / Dossier Filter

All person photos receive a permanent newsprint comic filter — no hover lift, always on. The effect is applied via a shared CSS class and pseudo-element, defined once in `app/globals.css` and reused everywhere a photo appears.

### CSS Implementation

**`.person-photo-wrapper`** — applied to the `<div>` wrapping every `<img>`:
```css
.person-photo-wrapper {
  position: relative;
  overflow: hidden;
}

.person-photo-wrapper img {
  filter: grayscale(100%) contrast(150%) brightness(0.9);
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.person-photo-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  opacity: 0.4;
  pointer-events: none;
}
```

### Scope
- **`PersonCard.tsx`** — carousel cards + gallery cards (thumbnail size)
- **`/people/[slug]` detail page hero** — full-size photo
- **Redacted placeholder block** — no filter applied (already styled as a solid black rectangle; the filter would be invisible)

### Where it lives
Single definition in `app/globals.css`. No component-specific CSS, no duplication. Any future use of person photos automatically gets the treatment by applying the wrapper class.

### Dark mode note
`mix-blend-mode: multiply` is invisible on dark backgrounds. In a `@media (prefers-color-scheme: dark)` block, the `::after` blend mode should switch to `overlay`, which works correctly on both light and dark canvases. Implementer must test both modes.

---

## Navigation

Add "People" tab to `app/components/layout/TabNav.tsx` alongside Bills, MPPs, Budget.

---

## Seed Scripts

Each person gets their own `scripts/seed-person-[name].ts` following the existing scandal seed pattern:
- Uses `neon()` HTTP driver directly (no WebSocket issues)
- Slug-based duplicate check before insert
- Inserts `Person` → `PersonConnection`(s) → `PersonSource`(s) in sequence
- Confidence assigned at seed time based on source:
  - Registry file → `high`
  - News article / FOI / court filing → `medium`
  - Corporate registry inference → `low`
- Uses `@@unique` constraint with upsert-safe insert (skip on conflict for connections)

### Research Source Priority
1. **Ontario Lobbyist Registry** — filter by Premier's Office / Finance Ministry, 2018–present. Pull `Lobbyist Name` + `Client Company`.
2. **Elections Ontario** — search donations from executives of companies that received payouts. Pull `Donor Name`, job title, company.
3. **Ontario Business Registry** — directors of companies tied to government decisions. Yields `low` confidence until cross-referenced with another source.
4. **News / Investigative Reporting** — named individuals in credible reporting on specific decisions.
5. **FOI Request Documents** — government-issued records; treated as `medium` or `high` depending on directness.
6. **Court Filings** — named parties in litigation related to decisions.

---

## Security & Defensibility

- Low confidence and unpublished records are never returned by `lib/people.ts` — the filter is enforced at query time, not UI layer
- The `getPersonBySlug` helper returns `null` for low/unpublished — triggers 404, no data exposed
- When displaying a person, always show the source type alongside the claim (e.g. "Source: Ontario Lobbyist Registry, 2021")
- Shell company normalization: if a person's company is a holding entity, note both in the `description` field of `PersonConnection`: "Beneficiary: Therme Inc. | Parent: Therme Canada (Holding)"
- No speculation — only connection types with a direct source are shown publicly

---

## File Structure

```
app/
  people/
    page.tsx                        # Gallery page (server, force-dynamic)
    [slug]/
      page.tsx                      # Detail page (server, notFound on null)
  components/
    people/
      PeopleCarousel.tsx            # Landing page carousel
      PersonCard.tsx                # Shared card (carousel + gallery)
      PersonBadge.tsx               # Connection type badge
  admin/
    components/
      PeoplePanel.tsx               # Admin panel component (follows existing admin/components/ convention)
  admin/
    page.tsx                        # MODIFIED: add PeoplePanel
  api/
    admin/
      people/
        route.ts                    # GET list, POST create
        [id]/
          route.ts                  # GET, PATCH, DELETE
          connections/
            route.ts                # POST add, DELETE remove
          sources/
            route.ts                # POST add, DELETE remove

lib/
  people.ts                         # Public-safe query helpers

prisma/
  schema.prisma                     # ADD: Person, PersonConnection, PersonSource, Confidence enum

scripts/
  seed-person-[name].ts             # One per individual (initial research dump)
```
