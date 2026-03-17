# Scandals Section — Design Spec

## Context

The site documents Doug Ford's Ontario government corruption. Currently, scandal detection exists only as a boolean flag on `NewsEvent` records with an admin review queue. There is no dedicated section for editorially curated, in-depth scandal documentation. This feature adds a first-class Scandals section with a public listing page, detail pages, and an admin panel for creating/editing scandals.

## Data Model

### New `Scandal` model

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| title | String | Scandal name |
| slug | String (unique) | URL slug, derived from title |
| summary | String | Short description for listing cards |
| why_it_matters | String (text) | WYSIWYG HTML content |
| rippling_effects | String (text) | WYSIWYG HTML content |
| date_reported | DateTime | When the scandal first surfaced |
| published | Boolean | Default false. Only published scandals appear on public pages |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### New `LegalAction` model

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| scandal_id | String | FK → Scandal |
| title | String | e.g. "RCMP Investigation" |
| status | String | One of: pending, active, dismissed, settled, convicted |
| description | String (text) | Free-text description |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### New `ScandalSource` model

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| scandal_id | String | FK → Scandal |
| url | String | Source URL |
| title | String | Auto-fetched page title, editable |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### New `ScandalNewsLink` model

For linking both existing `NewsEvent` records and external URLs:

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| scandal_id | String | FK → Scandal |
| news_event_id | String? | FK → NewsEvent (nullable) |
| external_url | String? | For news not in the DB |
| external_title | String? | Title for external links |
| external_source | String? | Publication name for external links |
| external_date | DateTime? | Published date for external links |
| createdAt | DateTime | Auto |

Constraint: exactly one of `news_event_id` or `external_url` must be set. Enforced at the API validation layer (reject requests where both or neither are provided).

### Many-to-many relations (implicit Prisma join tables)

- `Scandal.bills` ↔ `Bill.scandals` — Prisma implicit many-to-many
- `Scandal.mpps` ↔ `MPP.scandals` — Prisma implicit many-to-many

These add `scandals` relation fields to the existing `Bill` and `MPP` models.

### Cascade deletes

All child records (`LegalAction`, `ScandalSource`, `ScandalNewsLink`) use `onDelete: Cascade` — deleting a scandal removes all its children. Many-to-many join entries are automatically cleaned up by Prisma.

## Public Pages

### `/scandals` — Listing Page

- **Layout**: Vertical timeline, chronologically ordered (newest first). Only shows `published: true` scandals.
- **Pagination**: Show all scandals (no pagination initially — unlikely to exceed dozens). Add pagination later if needed.
- **Empty state**: "No documented scandals yet." in mono text, centered.
- **Breadcrumb**: Dashboard → Scandals
- **Section header**: `SectionDivider` with label "Documented Scandals"
- **Each timeline entry**:
  - White dot on a thin vertical zinc line
  - Date label (mono, uppercase, small)
  - Card with: serif title, summary text, metadata badges (mono, zinc background) showing counts: legal actions, bills, news stories, MPPs
  - Entire card is a link to `/scandals/[slug]`

### `/scandals/[slug]` — Detail Page

- **Layout**: Single column, max-w-4xl (matches bill detail page)
- **Breadcrumb**: Dashboard → Scandals → [Title]
- **Header**: Serif title + mono date, thick bottom border (only horizontal rule on page)
- **Sections** (each with mono uppercase label, no divider lines — spacing only):
  1. **Why It Matters** — rendered WYSIWYG HTML
  2. **Legal Actions** — list of bordered cards, each with title, status badge, description
  3. **Rippling Effects & Future Consequences** — rendered WYSIWYG HTML
  4. **Linked Bills** — list of bordered rows linking to `/bills/[id]`, showing bill number + title
  5. **Involved MPPs** — list of bordered rows linking to `/mpps/[id]`, showing name + party + riding
  6. **News Coverage** — list of bordered rows; internal NewsEvents link to source URL, external links open in new tab. Shows title + source + date
  7. **Sources** — list of mono-styled underlined links with ↗ indicator

## Note on existing ScandalQueue

The existing `ScandalQueue` admin component handles confirming/rejecting AI-flagged `is_scandal` on `NewsEvent` records. This is a separate workflow from the new Scandals section. Confirmed scandal news events become linkable when creating a new Scandal via the "Link existing" news search. No automatic Scandal creation from the queue — scandals are always manually authored.

## Admin Panel

### New `ScandalsPanel` component (added to `/admin` page)

- **Scandal list**: Table or list showing all scandals (both published and draft), ordered by `date_reported` desc
- **Published toggle**: Publish/unpublish scandals (same pattern as BillsPanel)
- **Create button**: Opens a form/drawer for new scandal entry
- **Edit**: Click a scandal to open edit form/drawer

### Scandal Form (create/edit)

Fields:
- **Title** — text input
- **Summary** — textarea (plain text, for listing cards)
- **Published** — checkbox toggle (default off, scandals start as drafts)
- **Date Reported** — date picker
- **Why It Matters** — WYSIWYG editor (TipTap recommended — lightweight, React-native, stores HTML)
- **Rippling Effects** — WYSIWYG editor (same)
- **Legal Actions** — repeatable sub-form: title (text), status (dropdown), description (textarea). Add/remove entries.
- **Linked Bills** — search/select from existing Bills (autocomplete by bill number or title)
- **Involved MPPs** — search/select from existing MPPs (autocomplete by name)
- **News Coverage** — two modes:
  - "Link existing": search/select from NewsEvent records
  - "Add external": URL + title + source name + date
- **Sources** — repeatable: URL input. On blur/add, auto-fetch page title (editable). Add/remove entries.

### API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/scandals` | List all scandals (paginated) |
| POST | `/api/admin/scandals` | Create scandal with all nested data |
| PUT | `/api/admin/scandals/[id]` | Update scandal and nested data |
| DELETE | `/api/admin/scandals/[id]` | Hard delete scandal + all children (cascade) |
| GET | `/api/admin/scandals/[id]` | Get single scandal with all relations |
| POST | `/api/admin/scandals/fetch-title` | Fetch page title from URL (for sources) |

All admin routes require Clerk authentication (same pattern as existing admin routes).

## WYSIWYG Editor

**Recommendation: TipTap**
- React-native, headless (style with Tailwind)
- Stores output as HTML string
- Extensions for: bold, italic, links, lists, headings
- Lightweight — no heavy dependencies
- Render output on public pages with `dangerouslySetInnerHTML` inside a prose-styled container
- Sanitize on save using `sanitize-html` — allow: p, strong, em, a (with href), ul, ol, li, h2, h3, br. Strip everything else.

## Cross-linking

Once scandals exist, add to existing pages:
- **Bill detail page** (`/bills/[id]`): New "Related Scandals" section if the bill is linked to any scandals
- **MPP detail page** (`/mpps/[id]`): New "Related Scandals" section if the MPP is linked to any scandals

## Design Tokens (matching existing site)

- Section labels: `font-mono text-xs uppercase tracking-widest text-zinc-500`
- Titles: `font-serif font-bold text-zinc-950 dark:text-white`
- Card borders: `border border-zinc-200 dark:border-zinc-800`
- Badges: `font-mono text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500`
- Body text: `text-sm text-zinc-600 dark:text-zinc-400`
- Links: underline on hover, arrow indicator for navigation

## SEO / Metadata

Both public pages export `generateMetadata`:
- `/scandals`: title "Documented Scandals", description summarizing the section purpose
- `/scandals/[slug]`: title is the scandal title, description is the summary

## Data Fetching

Public pages (`/scandals`, `/scandals/[slug]`) are server components that query Prisma directly — no public API routes needed. Only admin routes exist as API endpoints.

## Verification

1. Create a scandal via admin panel with all fields populated
2. Verify it appears on `/scandals` timeline with correct metadata counts
3. Click through to detail page, verify all sections render
4. Verify bill and MPP links navigate correctly
5. Verify cross-links appear on bill and MPP detail pages
6. Test WYSIWYG editor saves and renders HTML correctly
7. Test source URL title auto-fetch
8. Test creating/editing/deleting scandals
9. Run `pnpm build` to verify no type errors
