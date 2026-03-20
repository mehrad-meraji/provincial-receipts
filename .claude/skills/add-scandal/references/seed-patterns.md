# Seed Script Code Patterns

## Scandal Seed Script Template

File: `scripts/seed-{scandal-slug}.ts`

```typescript
/**
 * Seed script: {Scandal Title}
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-{scandal-slug}.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = '{scandal-slug}'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `1-2 sentence summary. No HTML.`

  const summary = `Longer narrative paragraph. No HTML.`

  const why_it_matters = `<p>First paragraph with <a href="https://verified-url">linked sources</a> and <strong>bold names</strong>.</p>

<p>Second paragraph continuing the explanation.</p>

<p>Third paragraph with more context and <a href="https://another-verified-url">additional sourcing</a>.</p>`

  const rippling_effects = `<p>First paragraph about consequences, with <a href="https://verified-url">sourced claims</a>.</p>

<p>Second paragraph about ongoing impacts.</p>

<p>Third paragraph about what this means going forward.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      '{Scandal Title}',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '{YYYY-MM-DD}',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'Name of legal action',
      status: 'active',  // pending | active | dismissed | settled | convicted
      url: 'https://verified-source-url',
      description: `<p>Description of the legal action with <a href="https://source">sourced details</a>.</p>`,
    },
  ]

  for (const la of legalActions) {
    const id = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, NOW(), NOW())
    `
  }
  console.log(`✅ ${legalActions.length} legal actions inserted`)

  // Sources
  const sources = [
    { url: 'https://verified-url-1', title: 'Article Title — Publication Name' },
    { url: 'https://verified-url-2', title: 'Article Title — Publication Name' },
  ]

  for (const s of sources) {
    const id = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)

  // Timeline events (optional — include if there are key dated milestones)
  const timelineEvents = [
    {
      date: 'YYYY-MM-DD',
      icon: 'AlertTriangle',  // Newspaper | AlertTriangle | Flag | Gavel | Lock | Syringe | Vote | Megaphone | FileText | Globe
      label: 'Short headline describing the event',
    },
  ]

  for (const evt of timelineEvents) {
    const id = cuid()
    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (${id}, ${evt.date}, ${evt.label}, ${'/scandals/' + slug}, ${evt.icon}, 'milestone', false, NOW(), NOW())
    `
  }
  console.log(`✅ ${timelineEvents.length} timeline events inserted`)

  console.log(`\n🎉 Scandal seeded at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
```

## People Seed Script Template

For people connected to scandals, use Prisma Client (not raw SQL) because of the Confidence enum.

File: `scripts/seed-people-{context}.ts`

```typescript
/**
 * Seed script: People connected to {context}
 * Uses Prisma Client to handle the Confidence enum correctly.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-people-{context}.ts
 */

import { prisma } from '../lib/db'
import { Confidence } from '@prisma/client'

interface PersonRecord {
  slug: string
  name: string
  bio?: string
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

const PEOPLE: PersonRecord[] = [
  {
    slug: 'person-name',
    name: 'Full Name',
    bio: 'Brief factual biography. Sourced claims only.',
    organization: 'Organization Name',
    organization_url: 'https://org-website.com',
    confidence: Confidence.high,  // high = multiple independent sources, medium = single credible source, low = circumstantial
    connections: [
      {
        scandal_slug: 'the-scandal-slug',
        connection_type: 'Lobbyist',
        description: 'How this person is connected to the scandal. Be specific and factual.',
      },
    ],
    sources: [
      {
        url: 'https://verified-source-url',
        title: 'Article Title — Publication',
        source_type: 'News',
      },
    ],
  },
]

async function main() {
  console.log(`Seeding ${PEOPLE.length} people…`)

  for (const record of PEOPLE) {
    const existing = await prisma.person.findUnique({ where: { slug: record.slug } })
    if (existing) {
      console.log(`  ⚠️  Skipping ${record.name} (already exists)`)
      continue
    }

    const person = await prisma.person.create({
      data: {
        slug: record.slug,
        name: record.name,
        bio: record.bio ?? null,
        organization: record.organization ?? null,
        organization_url: record.organization_url ?? null,
        confidence: record.confidence,
        published: false,
      },
    })
    console.log(`  ✓ Created ${person.name}`)

    if (record.connections.length > 0) {
      const connectionData = await Promise.all(
        record.connections.map(async conn => {
          const scandal = await prisma.scandal.findUnique({ where: { slug: conn.scandal_slug } })
          if (!scandal) {
            console.warn(`    ⚠️  Scandal '${conn.scandal_slug}' not found — skipping`)
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
      const valid = connectionData.filter((c): c is NonNullable<typeof c> => c !== null)
      if (valid.length > 0) {
        await prisma.personConnection.createMany({ data: valid, skipDuplicates: true })
        console.log(`    ✓ ${valid.length} connection(s)`)
      }
    }

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

## Timeline-Only Seed Script Template

For adding timeline events without a full scandal:

```typescript
/**
 * Seed script: Timeline events for {context}
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-timeline-{context}.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

const events = [
  {
    date: 'YYYY-MM-DD',
    icon: 'Flag',
    label: 'Short headline',
    url: '/scandals/linked-scandal-slug',  // or null for standalone events
    type: 'milestone',  // news | context | milestone
  },
]

async function main() {
  for (const evt of events) {
    // Skip duplicates by label + date
    const existing = await sql`
      SELECT id FROM "TimelineEvent"
      WHERE label = ${evt.label} AND date = ${evt.date}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Skipping: ${evt.label}`)
      continue
    }

    const id = cuid()
    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (${id}, ${evt.date}, ${evt.label}, ${evt.url}, ${evt.icon}, ${evt.type}, false, NOW(), NOW())
    `
    console.log(`✅ ${evt.label}`)
  }
  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
```

## Field Reference Quick-Look

### Scandal fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | Display title |
| slug | string | yes | URL-safe, unique |
| tldr | string | yes | 1-2 sentences, no HTML |
| summary | string | yes | Paragraph, no HTML |
| why_it_matters | string | yes | HTML with `<p>`, `<strong>`, `<a>`, `<em>` |
| rippling_effects | string | yes | HTML, same format |
| date_reported | date | yes | YYYY-MM-DD |
| published | boolean | yes | Default false |

### LegalAction statuses
`pending` | `active` | `dismissed` | `settled` | `convicted`

### Person connection types
`Lobbyist` | `Donor` | `Director` | `Beneficiary`

### Person confidence levels
`high` (multiple independent sources) | `medium` (single credible source) | `low` (circumstantial)

### Person source types
`Registry` | `News` | `Corporate` | `Court` | `FOI`

### Timeline event icons (Lucide names)
`Newspaper` (News) | `AlertTriangle` (Alert) | `Flag` (Milestone) | `Gavel` (Legal) | `Lock` (Lockdown) | `Syringe` (Health) | `Vote` (Election) | `Megaphone` (Protest) | `FileText` (Document) | `Globe` (World)

### Timeline event types
`news` | `context` | `milestone`
