# Named Individuals Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a named individuals layer — lobbyists, donors, directors, and beneficiaries connected to Ford government payouts — with a homepage carousel, gallery page, detail pages, admin CRUD, and seed infrastructure.

**Architecture:** Three new Prisma models (`Person`, `PersonConnection`, `PersonSource`) with a `Confidence` enum gate public visibility. A `lib/people.ts` helper enforces the confidence filter for all public queries. Admin routes query Prisma directly and see all records. The homepage gets a new `PeopleCarousel` section; `/people` and `/people/[slug]` are new server-rendered pages. The entire feature is gated behind a `named_individuals_enabled` flag stored in a `SiteConfig` singleton row, toggled from the admin panel.

**Tech Stack:** Next.js 15 App Router, Prisma 7 + Neon PostgreSQL, Tailwind CSS v4, Clerk auth, `next/image` for photos

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `SiteConfig` model, `Confidence` enum, `Person`, `PersonConnection`, `PersonSource` models |
| Create | `lib/feature-flags.ts` | Read `SiteConfig` singleton, return typed feature flag map |
| Create | `app/api/admin/site-config/route.ts` | Admin GET + PATCH for `SiteConfig` singleton |
| Create | `lib/people.ts` | Public-safe query helpers (confidence + published filter baked in) |
| Modify | `app/globals.css` | Add `.person-photo-wrapper` newsprint filter styles |
| Create | `app/components/people/PersonBadge.tsx` | Coloured connection-type pill |
| Create | `app/components/people/PersonCard.tsx` | Shared card used in carousel + gallery |
| Create | `app/components/people/PeopleCarousel.tsx` | Auto-scrolling horizontal strip for homepage |
| Create | `app/people/page.tsx` | Gallery page with filter bar |
| Create | `app/people/[slug]/page.tsx` | Detail page with bio, connections, sources |
| Modify | `app/components/layout/TabNav.tsx` | Accept `showPeople` prop; conditionally render "People" tab |
| Modify | `app/components/layout/Masthead.tsx` | Make async; fetch feature flags; pass `showPeople` to `TabNav` |
| Modify | `app/page.tsx` | Check feature flag; conditionally fetch + render `<PeopleCarousel>` |
| Create | `app/api/admin/site-config/route.ts` | Admin GET + PATCH for feature flags |
| Create | `app/admin/components/FeatureFlagsPanel.tsx` | Self-fetching toggle UI for feature flags |
| Modify | `app/admin/page.tsx` | Add `<FeatureFlagsPanel />` section (before `<PeoplePanel />`) |
| Create | `app/api/admin/people/route.ts` | Admin GET list + POST create |
| Create | `app/api/admin/people/[id]/route.ts` | Admin GET single + PATCH update + DELETE |
| Create | `app/api/admin/people/[id]/connections/route.ts` | Admin POST add connection |
| Create | `app/api/admin/people/[id]/connections/[connectionId]/route.ts` | Admin DELETE connection |
| Create | `app/api/admin/people/[id]/sources/route.ts` | Admin POST add source |
| Create | `app/api/admin/people/[id]/sources/[sourceId]/route.ts` | Admin DELETE source |
| Create | `app/admin/components/PeoplePanel.tsx` | Self-fetching admin panel (ScandalsPanel pattern) |
| Create | `app/admin/components/PersonForm.tsx` | Create/edit form modal |
| Modify | `app/admin/page.tsx` | Import + render `<PeoplePanel />` |
| Create | `scripts/people-data.ts` | Typed seed data array |
| Create | `scripts/seed-people.ts` | Prisma-Client importer |

---

## Chunk 1: Schema + Public Helpers

### Task 1: Add Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the `Confidence` enum and three new models to `prisma/schema.prisma`**

Add after the final model (after `TimelineEvent`):

```prisma
// Feature flags — singleton row (id always "singleton")
model SiteConfig {
  id                        String  @id @default("singleton")
  named_individuals_enabled Boolean @default(false)
}

enum Confidence {
  high
  medium
  low
}

model Person {
  id               String             @id @default(cuid())
  slug             String             @unique
  name             String
  bio              String?
  photo_filename   String?
  organization     String?
  organization_url String?
  confidence       Confidence
  published        Boolean            @default(false)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  connections      PersonConnection[]
  sources          PersonSource[]
}

model PersonConnection {
  id              String   @id @default(cuid())
  person          Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  personId        String
  scandal         Scandal  @relation(fields: [scandalId], references: [id], onDelete: Restrict)
  scandalId       String
  connection_type String
  description     String
  createdAt       DateTime @default(now())

  @@unique([personId, scandalId, connection_type])
  @@index([personId])
  @@index([scandalId])
}

model PersonSource {
  id          String   @id @default(cuid())
  person      Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  personId    String
  url         String
  title       String
  source_type String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([personId, url])
  @@index([personId])
}
```

Also add `connections PersonConnection[]` to the existing `Scandal` model (after the `mpps` line):

```prisma
  people          PersonConnection[]
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-named-individuals
```

Expected: Migration created and applied successfully. Prisma Client regenerated.

- [ ] **Step 3: Verify TypeScript picks up new types**

```bash
npx tsc --noEmit
```

Expected: No errors. If `@prisma/client` types are stale, run `npx prisma generate` first.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add SiteConfig, Person, PersonConnection, PersonSource schema + Confidence enum"
```

---

### Task 1b: Feature flag infrastructure

**Files:**
- Create: `lib/feature-flags.ts`
- Create: `app/api/admin/site-config/route.ts`

> **Prerequisite:** Task 1 must be complete and `npx prisma migrate dev` must have run so that `@prisma/client` exports the `SiteConfig` type.

- [ ] **Step 1: Create `lib/feature-flags.ts`**

```typescript
import { prisma } from '@/lib/db'

export type FeatureFlags = {
  named_individuals_enabled: boolean
}

/**
 * Reads feature flags from the SiteConfig singleton.
 * Returns all flags defaulting to false if no row exists yet.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  return {
    named_individuals_enabled: config?.named_individuals_enabled ?? false,
  }
}
```

- [ ] **Step 2: Create `app/api/admin/site-config/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const DEFAULT_CONFIG = { id: 'singleton', named_individuals_enabled: false }

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json(config ?? DEFAULT_CONFIG)
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { named_individuals_enabled?: boolean }

  const config = await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      named_individuals_enabled: body.named_individuals_enabled ?? false,
    },
    update: {
      ...(body.named_individuals_enabled !== undefined && {
        named_individuals_enabled: body.named_individuals_enabled,
      }),
    },
  })

  return NextResponse.json(config)
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/feature-flags.ts app/api/admin/site-config/
git commit -m "feat: add feature flag infrastructure (SiteConfig + API route)"
```

---

### Task 2: Create `lib/people.ts`

**Files:**
- Create: `lib/people.ts`

> **Prerequisite:** Task 1 must be complete and `npx prisma migrate dev` must have run so that `@prisma/client` exports the `Confidence` enum. If types are stale, run `npx prisma generate` before this task.

- [ ] **Step 1: Create the file**

```typescript
import { prisma } from '@/lib/db'
import { Confidence } from '@prisma/client'

const PUBLIC_WHERE = {
  confidence: { in: [Confidence.high, Confidence.medium] },
  published: true,
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

export type PersonCardData = {
  slug: string
  name: string
  photo_filename: string | null
  organization: string | null
  primary_connection_type: string | null
}

export type PersonWithConnections = {
  id: string
  slug: string
  name: string
  bio: string | null
  photo_filename: string | null
  organization: string | null
  organization_url: string | null
  confidence: Confidence
  published: boolean
  connections: {
    id: string
    connection_type: string
    description: string
    scandal: { title: string; slug: string; tldr: string }
  }[]
}

export type PersonWithDetails = PersonWithConnections & {
  sources: {
    id: string
    url: string
    title: string
    source_type: string
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toCardData(person: {
  slug: string
  name: string
  photo_filename: string | null
  organization: string | null
  connections: { connection_type: string }[]
}): PersonCardData {
  return {
    slug: person.slug,
    name: person.name,
    photo_filename: person.photo_filename,
    organization: person.organization,
    primary_connection_type: person.connections[0]?.connection_type ?? null,
  }
}

// ─── Public queries ───────────────────────────────────────────────────────────

/**
 * Returns all published high/medium people with their connections.
 * Optionally filtered by connection_type (exact match).
 */
export async function getPeople(filter?: { connection_type?: string }): Promise<PersonWithConnections[]> {
  const people = await prisma.person.findMany({
    where: {
      ...PUBLIC_WHERE,
      ...(filter?.connection_type
        ? { connections: { some: { connection_type: filter.connection_type } } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photo_filename: true,
      organization: true,
      organization_url: true,
      confidence: true,
      published: true,
      connections: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          connection_type: true,
          description: true,
          scandal: { select: { title: true, slug: true, tldr: true } },
        },
      },
    },
  })
  return people
}

/**
 * Returns a single published high/medium person by slug, with connections + sources.
 * Returns null if not found, confidence is low, or published is false.
 */
export async function getPersonBySlug(slug: string): Promise<PersonWithDetails | null> {
  const person = await prisma.person.findFirst({
    where: { slug, ...PUBLIC_WHERE },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photo_filename: true,
      organization: true,
      organization_url: true,
      confidence: true,
      published: true,
      connections: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          connection_type: true,
          description: true,
          scandal: { select: { title: true, slug: true, tldr: true } },
        },
      },
      sources: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          url: true,
          title: true,
          source_type: true,
        },
      },
    },
  })
  return person ?? null
}

/**
 * Returns up to 20 published high/medium people for the homepage carousel.
 * Ordered by createdAt desc (most recently added first).
 */
export async function getPeopleForCarousel(): Promise<PersonCardData[]> {
  const people = await prisma.person.findMany({
    where: PUBLIC_WHERE,
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      slug: true,
      name: true,
      photo_filename: true,
      organization: true,
      connections: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { connection_type: true },
      },
    },
  })
  return people.map(toCardData)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/people.ts
git commit -m "feat: add lib/people.ts public query helpers"
```

---

## Chunk 2: CSS Filter + Shared Components

### Task 3: Add newsprint filter to `globals.css`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the `.person-photo-wrapper` styles to `app/globals.css`**

Add inside the `@layer base { ... }` block, after the `.prose` rules:

```css
  /* Person photo — newsprint / dossier filter */
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

  /* Grain overlay — 800x800 viewBox + background-size: cover prevents tiling on large hero images */
  .person-photo-wrapper::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
    background-size: cover;
    mix-blend-mode: multiply;
    opacity: 0.4;
    pointer-events: none;
  }

  @media (prefers-color-scheme: dark) {
    .person-photo-wrapper::after {
      mix-blend-mode: overlay;
    }
  }
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

Expected: No errors (CSS changes don't affect TS).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add newsprint CSS filter for person photos"
```

---

### Task 4: Create `PersonBadge`

**Files:**
- Create: `app/components/people/PersonBadge.tsx`

- [ ] **Step 1: Create the file**

```typescript
const BADGE_STYLES: Record<string, string> = {
  Lobbyist:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Donor:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Director:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Beneficiary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const FALLBACK = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

interface PersonBadgeProps {
  connection_type: string
  className?: string
}

export default function PersonBadge({ connection_type, className = '' }: PersonBadgeProps) {
  const style = BADGE_STYLES[connection_type] ?? FALLBACK
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${style} ${className}`}>
      {connection_type}
    </span>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/people/PersonBadge.tsx
git commit -m "feat: add PersonBadge component"
```

---

### Task 5: Create `PersonCard`

**Files:**
- Create: `app/components/people/PersonCard.tsx`

- [ ] **Step 1: Create the file**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import PersonBadge from './PersonBadge'
import type { PersonCardData } from '@/lib/people'

interface PersonCardProps {
  person: PersonCardData
  /** Card width in px — used for <Image> sizing. Defaults to 160. */
  width?: number
  /** Card height in px — used for <Image> sizing. Defaults to 200. */
  height?: number
}

export default function PersonCard({ person, width = 160, height = 200 }: PersonCardProps) {
  const { slug, name, photo_filename, organization, primary_connection_type } = person

  return (
    <Link
      href={`/people/${slug}`}
      className="block flex-none border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      style={{ width }}
    >
      {/* Photo or redacted placeholder */}
      <div className="person-photo-wrapper bg-zinc-950" style={{ height }}>
        {photo_filename ? (
          <Image
            src={`/people/${photo_filename}`}
            alt={name}
            width={width}
            height={height}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">[REDACTED]</span>
            <span className="font-mono text-xl font-bold text-zinc-600">
              {name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="font-mono text-xs font-bold text-zinc-950 dark:text-white leading-tight line-clamp-2">{name}</p>
        {organization && (
          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{organization}</p>
        )}
        {primary_connection_type && (
          <div className="pt-1">
            <PersonBadge connection_type={primary_connection_type} />
          </div>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/people/PersonCard.tsx
git commit -m "feat: add PersonCard component"
```

---

### Task 6: Create `PeopleCarousel`

**Files:**
- Create: `app/components/people/PeopleCarousel.tsx`

- [ ] **Step 1: Create the file**

```typescript
import PersonCard from './PersonCard'
import type { PersonCardData } from '@/lib/people'

interface PeopleCarouselProps {
  people: PersonCardData[]
}

export default function PeopleCarousel({ people }: PeopleCarouselProps) {
  if (people.length === 0) return null

  // Duplicate cards to create a seamless infinite scroll loop
  const doubled = [...people, ...people]

  return (
    <section>
      <h2 className="mb-6 text-md uppercase font-bold dark:text-zinc-400 text-zinc-600">
        Connected Individuals
      </h2>
      <div className="relative overflow-hidden">
        <div className="flex gap-4 carousel-track">
          {doubled.map((person, i) => (
            <PersonCard
              key={`${person.slug}-${i}`}
              person={person}
              width={160}
              height={200}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add the carousel animation to `app/globals.css`**

Add inside the `@layer base { ... }` block, after the `.person-photo-wrapper` rules:

```css
  /* Carousel keyframes — defined at top level (Lightning CSS / Tailwind v4 does not support
     @keyframes nested inside @media). The animation is only applied inside the
     prefers-reduced-motion media query below, so it never runs for users who opt out. */
  @keyframes carousel-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* Only animate for users who have not opted out of motion */
  @media (prefers-reduced-motion: no-preference) {
    .carousel-track {
      animation: carousel-scroll 40s linear infinite;
    }

    .carousel-track:hover {
      animation-play-state: paused;
    }
  }
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/people/PeopleCarousel.tsx app/globals.css
git commit -m "feat: add PeopleCarousel component with infinite scroll animation"
```

---

## Chunk 3: Public Pages + Navigation

### Task 7: Create gallery page

**Files:**
- Create: `app/people/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPeople } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
import PersonCard from '@/app/components/people/PersonCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'People Connected to Ford Government Payouts',
}

const CONNECTION_TYPES = ['Lobbyist', 'Donor', 'Director', 'Beneficiary'] as const

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function PeoplePage({ searchParams }: Props) {
  const flags = await getFeatureFlags()
  if (!flags.named_individuals_enabled) notFound()

  const { type } = await searchParams
  const people = await getPeople(type ? { connection_type: type } : undefined)

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-mono text-sm uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-2">
          Connected Individuals
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
          Lobbyists, donors, directors, and beneficiaries connected to Ford government decisions.
        </p>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/people"
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              !type
                ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
            }`}
          >
            All
          </Link>
          {CONNECTION_TYPES.map(ct => (
            <Link
              key={ct}
              href={`/people?type=${ct}`}
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                type === ct
                  ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {ct}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {people.length === 0 ? (
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            {type ? `No ${type}s found.` : 'No individuals published yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {people.map(person => (
              <PersonCard key={person.slug} person={person} width={160} height={200} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/people/page.tsx
git commit -m "feat: add /people gallery page"
```

---

### Task 8: Create detail page

**Files:**
- Create: `app/people/[slug]/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPersonBySlug } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
import PersonBadge from '@/app/components/people/PersonBadge'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, flags] = await Promise.all([params, getFeatureFlags()])
  if (!flags.named_individuals_enabled) return { title: 'Not Found' }
  const person = await getPersonBySlug(slug)
  if (!person) return { title: 'Not Found' }
  return { title: `${person.name} — Ford Government Connections` }
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  Registry:  'Government Registry',
  News:      'News Report',
  Corporate: 'Corporate Filing',
  Court:     'Court Filing',
  FOI:       'FOI Document',
}

export default async function PersonPage({ params }: Props) {
  const [{ slug }, flags] = await Promise.all([params, getFeatureFlags()])
  if (!flags.named_individuals_enabled) notFound()
  const person = await getPersonBySlug(slug)
  if (!person) notFound()

  const uniqueConnectionTypes = [...new Set(person.connections.map(c => c.connection_type))]

  // Group sources by type
  const sourcesByType = person.sources.reduce<Record<string, typeof person.sources>>((acc, s) => {
    const key = s.source_type
    acc[key] = acc[key] ?? []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link href="/people" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors mb-8 inline-block">
          ← All Individuals
        </Link>

        {/* Hero */}
        <div className="flex gap-8 mb-10">
          {/* Photo */}
          <div className="flex-none person-photo-wrapper bg-zinc-950" style={{ width: 200, height: 240 }}>
            {person.photo_filename ? (
              <Image
                src={`/people/${person.photo_filename}`}
                alt={person.name}
                width={200}
                height={240}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">[REDACTED]</span>
                <span className="font-mono text-3xl font-bold text-zinc-600">
                  {person.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white mb-1">{person.name}</h1>
            {person.organization && (
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                {person.organization_url ? (
                  <a href={person.organization_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {person.organization}
                  </a>
                ) : person.organization}
              </p>
            )}
            {/* Connection type badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {uniqueConnectionTypes.map(ct => (
                <PersonBadge key={ct} connection_type={ct} />
              ))}
            </div>
            {person.bio && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{person.bio}</p>
            )}
          </div>
        </div>

        {/* Connected Scandals */}
        {person.connections.length > 0 && (
          <section className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Connected Scandals
            </h2>
            <div className="space-y-4">
              {person.connections.map(conn => (
                <div key={conn.id} className="border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <PersonBadge connection_type={conn.connection_type} />
                  </div>
                  <Link
                    href={`/scandals/${conn.scandal.slug}`}
                    className="font-serif text-base font-bold text-zinc-950 dark:text-white hover:underline block mb-1"
                  >
                    {conn.scandal.title}
                  </Link>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">{conn.scandal.tldr}</p>
                  <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500">{conn.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {person.sources.length > 0 && (
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Sources
            </h2>
            <div className="space-y-6">
              {Object.entries(sourcesByType).map(([type, sources]) => (
                <div key={type}>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-2">
                    {SOURCE_TYPE_LABELS[type] ?? type}
                  </h3>
                  <ul className="space-y-1">
                    {sources.map(s => (
                      <li key={s.id}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/people/[slug]/page.tsx
git commit -m "feat: add /people/[slug] detail page"
```

---

### Task 9: Add People tab + integrate carousel into homepage

**Files:**
- Modify: `app/components/layout/TabNav.tsx`
- Modify: `app/components/layout/Masthead.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `app/components/layout/TabNav.tsx` to accept a `showPeople` prop**

Replace the entire file contents:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BASE_TABS = [
  { label: 'Home',   href: '/' },
  { label: 'Bills',  href: '/bills' },
  { label: 'MPPs',   href: '/mpps' },
  { label: 'Budget', href: '/budget' },
] as const

const PEOPLE_TAB = { label: 'People', href: '/people' } as const

interface TabNavProps {
  showPeople?: boolean
}

export default function TabNav({ showPeople = false }: TabNavProps) {
  const pathname = usePathname()

  const tabs = showPeople
    ? [BASE_TABS[0], PEOPLE_TAB, ...BASE_TABS.slice(1)]
    : [...BASE_TABS]

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Site navigation" className="mt-3 flex justify-center gap-6 text-xs font-mono uppercase tracking-widest">
      {tabs.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={
            isActive(href)
              ? 'text-zinc-950 dark:text-white border-b border-zinc-950 dark:border-white pb-0.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors'
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Update `app/components/layout/Masthead.tsx` to fetch flags and pass `showPeople` to `TabNav`**

Replace the entire file contents:

```typescript
import TabNav from './TabNav'
import { getFeatureFlags } from '@/lib/feature-flags'

export default async function Masthead() {
  const flags = await getFeatureFlags()

  return (
    <header className="w-full border-b-4 border-zinc-950 dark:border-white py-6 px-4 text-center">
      {/* ASCII art - pre block with exact characters */}
      <pre
        className="text-[0.45rem] sm:text-[0.55rem] md:text-[0.65rem] leading-none select-none font-mono inline-block text-left"
        aria-hidden="true"
      >
        <span className="flex gap-4">
         {/* "FUCK" in Ontario red */}
          <span style={{ color: '#c8102e' }} className="block">
{`  █████▒█    ██  ▄████▄   ██ ▄█▀
▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒
▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░
░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄
░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄
 ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒
 ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░
 ░ ░    ░░░ ░ ░ ░        ░ ░░ ░
          ░     ░ ░      ░  ░
              ░`}
          </span>
          {/* "DOUG" in dark charcoal */}
          <span className="text-[#1a1a1a] dark:text-white block">
{`▓█████▄  ▒█████   █    ██    ▄████
▒██▀ ██▌▒██▒  ██▒ ██  ▓██▒  ██▒ ▀█▒
░██   █▌▒██░  ██▒▓██  ▒██░ ▒██░▄▄▄░
░▓█▄   ▌▒██   ██░▓▓█  ░██░ ░▓█  ██▓
░▒████▓ ░ ████▓▒░▒▒█████▓  ░▒▓███▀▒
 ▒▒▓  ▒ ░ ▒░▒░▒░ ░▒▓▒ ▒ ▒   ░▒   ▒
 ░ ▒  ▒   ░ ▒ ▒░ ░░▒░ ░ ░    ░   ░
 ░ ░  ░ ░ ░ ░ ▒   ░░░ ░ ░  ░ ░   ░
░        ░ ░     ░          ░   ░
`}
          </span>
        </span>

        {/* "FORD" in Ontario red */}
        <span style={{ color: '#c8102e' }} className="block mt-1">
{`  █████▒▒█████   ██▀███  ▓█████▄
▓██   ▒▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌
▒████ ░▒██░  ██▒▓██ ░▄█ ▒░██   █▌
░▓█▒  ░▒██   ██░▒██▀▀█▄  ░▓█▄   ▌
░▒█░    ░ ████▓▒░░██▓ ▒██▒░▒████▓
 ▒ ░    ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒
 ░        ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒
 ░ ░    ░ ░ ░ ▒    ░░   ░  ░ ░  ░
            ░ ░     ░        ░
                           ░`}
        </span>
      </pre>
      {/* Subtitle */}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
        Ontario&apos;s Premier Accountability Dashboard · Queen&apos;s Park Watch
      </p>
      <TabNav showPeople={flags.named_individuals_enabled} />
    </header>
  )
}
```

- [ ] **Step 3: Import `getPeopleForCarousel`, `PeopleCarousel`, and `getFeatureFlags` in `app/page.tsx`**

Add to the existing imports at the top:

```typescript
import PeopleCarousel from './components/people/PeopleCarousel'
import { getPeopleForCarousel } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
```

- [ ] **Step 4: Add feature flag fetch and conditional carousel query in `app/page.tsx`**

Replace the existing `Promise.all` call:

```typescript
const [
  recentScandals,
  dbTimelineEvents,
  flags,
] = await Promise.all([
  prisma.scandal.findMany({
    where: { published: true },
    orderBy: { date_reported: 'desc' },
    include: {
      _count: { select: { legal_actions: true, news_links: true, bills: true, mpps: true } },
    },
  }),
  (prisma.timelineEvent as typeof prisma.timelineEvent | undefined)
    ?.findMany({ where: { published: true }, orderBy: { date: 'desc' } })
    .catch(() => []) ?? Promise.resolve([]),
  getFeatureFlags(),
])

const carouselPeople = flags.named_individuals_enabled
  ? await getPeopleForCarousel()
  : []
```

- [ ] **Step 5: Render `<PeopleCarousel>` conditionally between `<Masthead>` and the timeline section in `app/page.tsx`**

Find this exact block:

```tsx
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
```

Replace it with:

```tsx
      <Masthead />

      {carouselPeople.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <PeopleCarousel people={carouselPeople} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Run a dev server smoke test**

```bash
npm run dev
```

Open http://localhost:3000. Verify:
- "People" tab does NOT appear in the nav (flag is off by default)
- The carousel section is hidden
- Open http://localhost:3000/people — returns 404 (flag is off)
- Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add app/components/layout/TabNav.tsx app/components/layout/Masthead.tsx app/page.tsx
git commit -m "feat: gate People tab and carousel behind named_individuals_enabled flag"
```

---

## Chunk 4: Admin API + Panel

### Task 10: Create admin API routes

**Files:**
- Create: `app/api/admin/people/route.ts`
- Create: `app/api/admin/people/[id]/route.ts`
- Create: `app/api/admin/people/[id]/connections/route.ts`
- Create: `app/api/admin/people/[id]/connections/[connectionId]/route.ts`
- Create: `app/api/admin/people/[id]/sources/route.ts`
- Create: `app/api/admin/people/[id]/sources/[sourceId]/route.ts`

- [ ] **Step 1: Create `app/api/admin/people/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Confidence } from '@prisma/client'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const people = await prisma.person.findMany({
    where: q.trim() ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { connections: true, sources: true } },
    },
  })

  return NextResponse.json(people)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    name: string
    slug?: string
    bio?: string
    photo_filename?: string
    organization?: string
    organization_url?: string
    confidence: string
    published?: boolean
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const validConfidence = Object.values(Confidence)
  if (!validConfidence.includes(body.confidence as Confidence)) {
    return NextResponse.json({ error: `confidence must be one of: ${validConfidence.join(', ')}` }, { status: 400 })
  }

  const slug = body.slug?.trim() || slugify(body.name.trim())

  const person = await prisma.person.create({
    data: {
      name: body.name.trim(),
      slug,
      bio: body.bio?.trim() || null,
      photo_filename: body.photo_filename?.trim() || null,
      organization: body.organization?.trim() || null,
      organization_url: body.organization_url?.trim() || null,
      confidence: body.confidence as Confidence,
      published: body.published ?? false,
    },
  })

  return NextResponse.json(person, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/admin/people/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Confidence } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      connections: {
        orderBy: { createdAt: 'asc' },
        include: { scandal: { select: { id: true, title: true, slug: true } } },
      },
      sources: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(person)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as Partial<{
    name: string
    slug: string
    bio: string | null
    photo_filename: string | null
    organization: string | null
    organization_url: string | null
    confidence: string
    published: boolean
  }>

  if (body.confidence) {
    const valid = Object.values(Confidence)
    if (!valid.includes(body.confidence as Confidence)) {
      return NextResponse.json({ error: 'Invalid confidence value' }, { status: 400 })
    }
  }

  const person = await prisma.person.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.slug !== undefined && { slug: body.slug.trim() }),
      ...(body.bio !== undefined && { bio: body.bio?.trim() || null }),
      ...(body.photo_filename !== undefined && { photo_filename: body.photo_filename?.trim() || null }),
      ...(body.organization !== undefined && { organization: body.organization?.trim() || null }),
      ...(body.organization_url !== undefined && { organization_url: body.organization_url?.trim() || null }),
      ...(body.confidence !== undefined && { confidence: body.confidence as Confidence }),
      ...(body.published !== undefined && { published: body.published }),
    },
  })

  return NextResponse.json(person)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.person.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/admin/people/[id]/connections/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: personId } = await params
  const body = await req.json() as {
    scandalId: string
    connection_type: string
    description: string
  }

  if (!body.scandalId || !body.connection_type || !body.description?.trim()) {
    return NextResponse.json({ error: 'scandalId, connection_type, and description are required' }, { status: 400 })
  }

  const connection = await prisma.personConnection.create({
    data: {
      personId,
      scandalId: body.scandalId,
      connection_type: body.connection_type,
      description: body.description.trim(),
    },
    include: { scandal: { select: { id: true, title: true, slug: true } } },
  })

  return NextResponse.json(connection, { status: 201 })
}
```

- [ ] **Step 4: Create `app/api/admin/people/[id]/connections/[connectionId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string; connectionId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId } = await params
  await prisma.personConnection.delete({ where: { id: connectionId } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Create `app/api/admin/people/[id]/sources/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: personId } = await params
  const body = await req.json() as {
    url: string
    title: string
    source_type: string
  }

  if (!body.url?.trim() || !body.title?.trim() || !body.source_type) {
    return NextResponse.json({ error: 'url, title, and source_type are required' }, { status: 400 })
  }

  const source = await prisma.personSource.create({
    data: {
      personId,
      url: body.url.trim(),
      title: body.title.trim(),
      source_type: body.source_type,
    },
  })

  return NextResponse.json(source, { status: 201 })
}
```

- [ ] **Step 6: Create `app/api/admin/people/[id]/sources/[sourceId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string; sourceId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sourceId } = await params
  await prisma.personSource.delete({ where: { id: sourceId } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/people/
git commit -m "feat: add admin API routes for people CRUD"
```

---

### Task 11: Create `PersonForm`

**Files:**
- Create: `app/admin/components/PersonForm.tsx`

- [ ] **Step 1: Create the file**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

const CONNECTION_TYPES = ['Lobbyist', 'Donor', 'Director', 'Beneficiary'] as const
const SOURCE_TYPES = ['Registry', 'News', 'Corporate', 'Court', 'FOI'] as const
const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const

interface PersonDetail {
  id: string
  name: string
  slug: string
  bio: string | null
  photo_filename: string | null
  organization: string | null
  organization_url: string | null
  confidence: string
  published: boolean
  connections: {
    id: string
    connection_type: string
    description: string
    scandal: { id: string; title: string; slug: string }
  }[]
  sources: {
    id: string
    url: string
    title: string
    source_type: string
  }[]
}

interface ScandalResult {
  id: string
  title: string
  slug: string
}

interface PersonFormProps {
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function PersonForm({ editingId, onClose, onSaved }: PersonFormProps) {
  const isEdit = !!editingId

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [photoFilename, setPhotoFilename] = useState('')
  const [organization, setOrganization] = useState('')
  const [organizationUrl, setOrganizationUrl] = useState('')
  const [confidence, setConfidence] = useState<string>('medium')
  const [published, setPublished] = useState(false)

  const [connections, setConnections] = useState<PersonDetail['connections']>([])
  const [sources, setSources] = useState<PersonDetail['sources']>([])

  // New connection form
  const [scandalSearch, setScandalSearch] = useState('')
  const [scandalResults, setScandalResults] = useState<ScandalResult[]>([])
  const [selectedScandal, setSelectedScandal] = useState<ScandalResult | null>(null)
  const [newConnType, setNewConnType] = useState<string>(CONNECTION_TYPES[0])
  const [newConnDesc, setNewConnDesc] = useState('')

  // New source form
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [newSourceType, setNewSourceType] = useState<string>(SOURCE_TYPES[0])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  function slugify(n: string) {
    return n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  useEffect(() => {
    if (!isEdit) setSlug(slugify(name))
  }, [name, isEdit])

  // Load existing person for edit
  useEffect(() => {
    if (!editingId) return
    fetch(`/api/admin/people/${editingId}`)
      .then(r => r.json())
      .then((p: PersonDetail) => {
        setName(p.name)
        setSlug(p.slug)
        setBio(p.bio ?? '')
        setPhotoFilename(p.photo_filename ?? '')
        setOrganization(p.organization ?? '')
        setOrganizationUrl(p.organization_url ?? '')
        setConfidence(p.confidence)
        setPublished(p.published)
        setConnections(p.connections)
        setSources(p.sources)
      })
  }, [editingId])

  // Scandal search
  useEffect(() => {
    if (!scandalSearch.trim()) { setScandalResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/scandals?q=${encodeURIComponent(scandalSearch)}&page=1`)
      const data = await res.json()
      setScandalResults((data.scandals ?? []).slice(0, 6))
    }, 300)
    return () => clearTimeout(t)
  }, [scandalSearch])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const url = isEdit ? `/api/admin/people/${editingId}` : '/api/admin/people'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          bio: bio.trim() || null,
          photo_filename: photoFilename.trim() || null,
          organization: organization.trim() || null,
          organization_url: organizationUrl.trim() || null,
          confidence,
          published,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Save failed')
        return
      }
      onSaved()
    } catch (e) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await fetch(`/api/admin/people/${editingId}`, { method: 'DELETE' })
    onSaved()
  }

  async function handleAddConnection() {
    if (!selectedScandal || !editingId) return
    const res = await fetch(`/api/admin/people/${editingId}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scandalId: selectedScandal.id, connection_type: newConnType, description: newConnDesc }),
    })
    if (res.ok) {
      const conn = await res.json()
      setConnections(prev => [...prev, conn])
      setSelectedScandal(null)
      setScandalSearch('')
      setNewConnDesc('')
    }
  }

  async function handleDeleteConnection(connId: string, personId: string) {
    await fetch(`/api/admin/people/${personId}/connections/${connId}`, { method: 'DELETE' })
    setConnections(prev => prev.filter(c => c.id !== connId))
  }

  async function handleAddSource() {
    if (!editingId) return
    const res = await fetch(`/api/admin/people/${editingId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newSourceUrl, title: newSourceTitle, source_type: newSourceType }),
    })
    if (res.ok) {
      const src = await res.json()
      setSources(prev => [...prev, src])
      setNewSourceUrl('')
      setNewSourceTitle('')
    }
  }

  async function handleDeleteSource(srcId: string, personId: string) {
    await fetch(`/api/admin/people/${personId}/sources/${srcId}`, { method: 'DELETE' })
    setSources(prev => prev.filter(s => s.id !== srcId))
  }

  const inputClass = 'w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-950 dark:text-white placeholder-zinc-400'
  const labelClass = 'block text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-mono text-sm uppercase tracking-widest font-bold">
            {isEdit ? 'Edit Person' : 'Add Person'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input className={inputClass} value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Organization</label>
              <input className={inputClass} value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company or org" />
            </div>
            <div>
              <label className={labelClass}>Organization URL</label>
              <input className={inputClass} value={organizationUrl} onChange={e => setOrganizationUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Photo filename</label>
            <input className={inputClass} value={photoFilename} onChange={e => setPhotoFilename(e.target.value)} placeholder="john-doe.jpg (place in public/people/)" />
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Short biography..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Confidence</label>
              <select className={inputClass} value={confidence} onChange={e => setConfidence(e.target.value)}>
                {CONFIDENCE_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Published</span>
              </label>
            </div>
          </div>

          {/* Connections — only available in edit mode */}
          {isEdit && (
            <div>
              <label className={labelClass}>Connected Scandals</label>
              {connections.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {connections.map(c => (
                    <li key={c.id} className="flex items-start gap-2 text-xs border border-zinc-100 dark:border-zinc-800 p-2">
                      <span className="flex-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold">[{c.connection_type}]</span> {c.scandal.title} — {c.description}
                      </span>
                      <button onClick={() => handleDeleteConnection(c.id, editingId!)} className="text-zinc-400 hover:text-red-500 flex-none mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Add connection */}
              <div className="border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <input
                  className={inputClass}
                  value={scandalSearch}
                  onChange={e => { setScandalSearch(e.target.value); setSelectedScandal(null) }}
                  placeholder="Search scandals..."
                />
                {scandalResults.length > 0 && !selectedScandal && (
                  <ul className="border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {scandalResults.map(s => (
                      <li key={s.id}>
                        <button
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-mono"
                          onClick={() => { setSelectedScandal(s); setScandalSearch(s.title); setScandalResults([]) }}
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedScandal && (
                  <div className="space-y-2">
                    <select className={inputClass} value={newConnType} onChange={e => setNewConnType(e.target.value)}>
                      {CONNECTION_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                    <input className={inputClass} value={newConnDesc} onChange={e => setNewConnDesc(e.target.value)} placeholder="One-sentence description of the connection..." />
                    <button
                      onClick={handleAddConnection}
                      disabled={!newConnDesc.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
                    >
                      <Plus size={12} /> Add Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sources — only available in edit mode */}
          {isEdit && (
            <div>
              <label className={labelClass}>Sources</label>
              {sources.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {sources.map(s => (
                    <li key={s.id} className="flex items-start gap-2 text-xs border border-zinc-100 dark:border-zinc-800 p-2">
                      <span className="flex-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold">[{s.source_type}]</span> {s.title}
                      </span>
                      <button onClick={() => handleDeleteSource(s.id, editingId!)} className="text-zinc-400 hover:text-red-500 flex-none mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <input className={inputClass} value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="https://..." />
                <input className={inputClass} value={newSourceTitle} onChange={e => setNewSourceTitle(e.target.value)} placeholder="Source title / description" />
                <select className={inputClass} value={newSourceType} onChange={e => setNewSourceType(e.target.value)}>
                  {SOURCE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <button
                  onClick={handleAddSource}
                  disabled={!newSourceUrl.trim() || !newSourceTitle.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
                >
                  <Plus size={12} /> Add Source
                </button>
              </div>
            </div>
          )}

          {!isEdit && (
            <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              Connections and sources can be added after saving.
            </p>
          )}

          {error && (
            <p className="font-mono text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !slug.trim()}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Person'}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className="ml-auto text-xs font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/components/PersonForm.tsx
git commit -m "feat: add PersonForm admin modal"
```

---

### Task 11b: Create `FeatureFlagsPanel`

**Files:**
- Create: `app/admin/components/FeatureFlagsPanel.tsx`

> **Prerequisite:** Task 1b must be complete (`lib/feature-flags.ts` + `/api/admin/site-config` route exist).

- [ ] **Step 1: Create `app/admin/components/FeatureFlagsPanel.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'

interface SiteConfig {
  id: string
  named_individuals_enabled: boolean
}

export default function FeatureFlagsPanel() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(setConfig)
  }, [])

  async function toggle(flag: keyof Omit<SiteConfig, 'id'>) {
    if (!config) return
    const next = !config[flag]
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flag]: next }),
      })
      if (res.ok) setConfig(await res.json())
    } finally {
      setSaving(false)
    }
  }

  if (!config) {
    return <p className="font-mono text-xs text-zinc-400">Loading…</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-mono text-xs font-bold text-zinc-950 dark:text-white">Named Individuals</p>
          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Show carousel, /people gallery, and /people/[slug] detail pages
          </p>
        </div>
        <button
          onClick={() => toggle('named_individuals_enabled')}
          disabled={saving}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            config.named_individuals_enabled
              ? 'bg-zinc-950 dark:bg-white'
              : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          aria-checked={config.named_individuals_enabled}
          role="switch"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
              config.named_individuals_enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/components/FeatureFlagsPanel.tsx
git commit -m "feat: add FeatureFlagsPanel admin component"
```

---

### Task 12: Create `PeoplePanel` and wire into admin page

**Files:**
- Create: `app/admin/components/PeoplePanel.tsx`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Create `app/admin/components/PeoplePanel.tsx`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import PersonForm from './PersonForm'

interface PersonRow {
  id: string
  name: string
  organization: string | null
  confidence: string
  published: boolean
  _count: { connections: number; sources: number }
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

export default function PeoplePanel() {
  const [people, setPeople] = useState<PersonRow[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchPeople = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/people')
      if (!res.ok) return
      setPeople(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPeople() }, [fetchPeople])

  function handleAdd() { setEditingId(null); setFormOpen(true) }
  function handleEdit(id: string) { setEditingId(id); setFormOpen(true) }
  function handleClose() { setFormOpen(false); setEditingId(null) }
  function handleSaved() { setFormOpen(false); setEditingId(null); fetchPeople() }

  async function handleTogglePublished(id: string, current: boolean) {
    await fetch(`/api/admin/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    })
    fetchPeople()
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm uppercase tracking-widest font-bold text-zinc-950 dark:text-white">
          People ({people.length})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-widest bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
        >
          <Plus size={12} /> Add Person
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : people.length === 0 ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">No people yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Organization</th>
                <th className="pb-2 pr-4">Confidence</th>
                <th className="pb-2 pr-4">Links</th>
                <th className="pb-2 pr-4">Published</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {people.map(p => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                  <td className="py-2 pr-4 text-zinc-950 dark:text-white font-semibold">{p.name}</td>
                  <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{p.organization ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 uppercase text-[10px] tracking-widest ${CONFIDENCE_STYLES[p.confidence] ?? ''}`}>
                      {p.confidence}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                    {p._count.connections}c / {p._count.sources}s
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => handleTogglePublished(p.id, p.published)}
                      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 ${
                        p.published
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {p.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleEdit(p.id)}
                      className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white text-[10px] font-mono uppercase tracking-widest"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <PersonForm editingId={editingId} onClose={handleClose} onSaved={handleSaved} />
      )}
    </section>
  )
}
```

- [ ] **Step 2: Add `FeatureFlagsPanel` and `PeoplePanel` to `app/admin/page.tsx`**

Add imports at the top of the imports section:
```typescript
import FeatureFlagsPanel from './components/FeatureFlagsPanel'
import PeoplePanel from './components/PeoplePanel'
```

Find this exact closing block at the end of the JSX in `app/admin/page.tsx`:

```tsx
      </section>

    </main>
```

Replace with:

```tsx
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Feature Flags
        </h2>
        <FeatureFlagsPanel />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          People
        </h2>
        <PeoplePanel />
      </section>

    </main>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Full build check**

```bash
npm run build
```

Expected: Build succeeds with no errors. Note: some `Dynamic server usage` warnings are expected for `force-dynamic` pages.

- [ ] **Step 5: Admin smoke test**

```bash
npm run dev
```

Navigate to `/admin` (requires Clerk login). Verify:
- "Feature Flags" section appears with a "Named Individuals" toggle (initially off)
- "People (0)" section appears
- "Add Person" button opens the PersonForm modal
- Creating a person with confidence `medium` + published `true` saves successfully
- The new person appears in the table
- Edit button opens the form pre-filled
- Connections and sources can be added via the edit form
- Stop dev server.

- [ ] **Step 6: Verify feature flag toggle gates the public feature**

Start dev server (`npm run dev`). Navigate to `/admin`:
- Confirm "Named Individuals" toggle is OFF
- Check http://localhost:3000 — carousel is hidden; "People" tab not in nav
- Check http://localhost:3000/people — returns 404

Toggle "Named Individuals" ON in the admin panel.

- Check http://localhost:3000 — "People" tab appears in nav; carousel shows the person if at least one published high/medium person exists
- Check http://localhost:3000/people — gallery page renders

Toggle OFF again. Verify carousel and tab are hidden once more. Stop dev server.

- [ ] **Step 7: Verify public carousel and gallery show the new person (flag ON)**

Toggle flag ON. Navigate to:
- `/` — carousel section "Connected Individuals" should now appear with 1 card
- `/people` — the person appears in the grid
- `/people/[slug]` — detail page renders correctly with bio, connections, sources

Check dark mode (toggle OS dark mode) and verify:
- Grain overlay uses `overlay` blend mode (not invisible)

- [ ] **Step 7: Commit**

```bash
git add app/admin/components/PeoplePanel.tsx app/admin/components/FeatureFlagsPanel.tsx app/admin/page.tsx
git commit -m "feat: add FeatureFlagsPanel and PeoplePanel to admin"
```

---

## Chunk 5: Seed Infrastructure

### Task 13: Create seed data file and importer

**Files:**
- Create: `scripts/people-data.ts`
- Create: `scripts/seed-people.ts`

- [ ] **Step 1: Create `scripts/people-data.ts`**

This file holds the structured seed data. Start with one placeholder person as a template — replace with real research data before running the seed.

```typescript
import { Confidence } from '@prisma/client'

export interface PersonSeedRecord {
  slug: string
  name: string
  bio?: string
  photo_filename?: string
  organization?: string
  organization_url?: string
  confidence: Confidence
  connections: {
    scandal_slug: string
    connection_type: 'Lobbyist' | 'Donor' | 'Director' | 'Beneficiary'
    description: string
  }[]
  sources: {
    url: string
    title: string
    source_type: 'Registry' | 'News' | 'Corporate' | 'Court' | 'FOI'
  }[]
}

export const PEOPLE_DATA: PersonSeedRecord[] = [
  // ─── Template — replace with real research data ───────────────────────────
  // {
  //   slug: 'jane-doe',
  //   name: 'Jane Doe',
  //   bio: 'Registered lobbyist for ExampleCorp...',
  //   photo_filename: 'jane-doe.jpg',   // Place file in public/people/ first
  //   organization: 'ExampleCorp',
  //   organization_url: 'https://example.com',
  //   confidence: Confidence.high,
  //   connections: [
  //     {
  //       scandal_slug: 'ontario-place',
  //       connection_type: 'Lobbyist',
  //       description: 'Lobbied Premier\'s Office re: Ontario Place, 2021',
  //     },
  //   ],
  //   sources: [
  //     {
  //       url: 'https://lobbyist.oico.on.ca/...',
  //       title: 'Ontario Lobbyist Registry — ExampleCorp, 2021',
  //       source_type: 'Registry',
  //     },
  //   ],
  // },
]
```

- [ ] **Step 2: Create `scripts/seed-people.ts`**

```typescript
/**
 * Seed script: Named Individuals
 * Uses Prisma Client (not raw neon() SQL) to handle the Confidence enum correctly.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-people.ts
 *
 * Idempotent: skips existing slugs, uses createMany with skipDuplicates for connections/sources.
 */

import { prisma } from '../lib/db'
import { PEOPLE_DATA } from './people-data'

async function main() {
  console.log(`Seeding ${PEOPLE_DATA.length} people…`)

  for (const record of PEOPLE_DATA) {
    // 1. Skip if person already exists
    const existing = await prisma.person.findUnique({ where: { slug: record.slug } })
    if (existing) {
      console.log(`  ⚠️  Skipping ${record.name} (slug '${record.slug}' already exists)`)
      continue
    }

    // 2. Create person
    const person = await prisma.person.create({
      data: {
        slug: record.slug,
        name: record.name,
        bio: record.bio ?? null,
        photo_filename: record.photo_filename ?? null,
        organization: record.organization ?? null,
        organization_url: record.organization_url ?? null,
        confidence: record.confidence,
        published: false,  // Always seed as draft — publish via admin after review
      },
    })
    console.log(`  ✓ Created ${person.name} (id: ${person.id})`)

    // 3. Resolve scandal IDs and create connections
    if (record.connections.length > 0) {
      const connectionData = await Promise.all(
        record.connections.map(async conn => {
          const scandal = await prisma.scandal.findUnique({ where: { slug: conn.scandal_slug } })
          if (!scandal) {
            console.warn(`    ⚠️  Scandal '${conn.scandal_slug}' not found — skipping connection`)
            return null
          }
          return {
            personId: person.id,
            scandalId: scandal.id,
            connection_type: conn.connection_type,
            description: conn.description,
          }
        })
      )
      const validConnections = connectionData.filter((c): c is NonNullable<typeof c> => c !== null)
      if (validConnections.length > 0) {
        await prisma.personConnection.createMany({ data: validConnections, skipDuplicates: true })
        console.log(`    ✓ ${validConnections.length} connection(s)`)
      }
    }

    // 4. Create sources
    if (record.sources.length > 0) {
      await prisma.personSource.createMany({
        data: record.sources.map(s => ({
          personId: person.id,
          url: s.url,
          title: s.title,
          source_type: s.source_type,
        })),
        skipDuplicates: true,
      })
      console.log(`    ✓ ${record.sources.length} source(s)`)
    }
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run a dry-run with empty data**

With the data file currently having only commented-out entries, running the seed should succeed immediately with "Seeding 0 people… Done."

```bash
DATABASE_URL="$(grep DATABASE_URL .env.local | cut -d= -f2-)" npx tsx scripts/seed-people.ts
```

Expected output:
```
Seeding 0 people…
Done.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/people-data.ts scripts/seed-people.ts
git commit -m "feat: add people seed data file and importer"
```

---

### Task 14: Final build verification

- [ ] **Step 1: Full production build**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. `force-dynamic` warnings are expected and acceptable.

- [ ] **Step 2: Acceptance criteria checklist**

Manually verify the following in dev mode (`npm run dev`):

**Dark mode (toggle OS dark mode):**
- [ ] Person photo grain overlay renders visibly (not invisible) in dark mode
- [ ] Carousel cards, gallery cards, and detail hero all show the grain effect

**Reduced motion:**
- [ ] Set OS "Reduce Motion" to ON — carousel should be static (no auto-scroll)
- [ ] Set OS "Reduce Motion" to OFF — carousel auto-scrolls and pauses on hover

**Gallery:**
- [ ] Filter bar links update the URL correctly and filter results
- [ ] Empty state message shows when filter returns no results

**Detail page:**
- [ ] Low-confidence or unpublished slugs return 404
- [ ] Sources grouped by type with correct labels

**Feature flag:**
- [ ] With flag OFF: `/people` returns 404, `/people/[slug]` returns 404, carousel hidden, "People" tab absent from nav
- [ ] With flag ON: all public routes accessible, "People" tab visible in nav, carousel renders (if published people exist)
- [ ] Toggling flag in admin panel takes effect on next page load (no server restart required)

**Admin:**
- [ ] Low confidence people appear in admin table (do NOT appear on public pages)
- [ ] Published toggle works via row button
- [ ] Connections and sources can be added and deleted in the edit form

- [ ] **Step 3: Final commit**

```bash
git add app/ lib/ prisma/ scripts/people-data.ts scripts/seed-people.ts public/people/
git commit -m "feat: named individuals feature complete"
```

Note: do NOT use `git add -A` — unrelated untracked seed scripts exist in `scripts/` and must not be bundled into this commit.
