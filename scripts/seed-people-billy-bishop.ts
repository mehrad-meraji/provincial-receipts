/**
 * Seed script: People connected to the Billy Bishop Airport Seizure
 * - Creates Robert Deluce (new person)
 * - Adds a new scandal connection for Mark Lawson (existing person)
 * Uses Prisma Client to handle the Confidence enum correctly.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-people-billy-bishop.ts
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
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

const NEW_PEOPLE: PersonRecord[] = [
  {
    slug: 'robert-deluce',
    name: 'Robert Deluce',
    bio: 'Founder of Porter Airlines and current Executive Chairman. Deluce built Porter around Billy Bishop Airport and has pushed for jet service at the airport since at least 2013, when the proposal was defeated after the federal Trudeau government rejected it in 2015. Porter currently operates De Havilland Dash 8-400 turboprops from Billy Bishop; expanded to Pearson for jet service in 2022. Members of the Deluce family donated the maximum allowable amount to Rob Ford\'s mayoral campaigns.',
    organization: 'Porter Airlines',
    organization_url: 'https://www.flyporter.com',
    confidence: Confidence.medium,
    connections: [
      {
        scandal_slug: 'billy-bishop-airport-seizure',
        connection_type: 'Beneficiary',
        description: 'Porter Airlines is the primary airline beneficiary of the proposed Billy Bishop jet expansion. The airline has championed allowing jets at the airport since 2013. Ford\'s plan to extend runways and allow jets aligns directly with Porter\'s long-standing commercial interest in operating jets from Billy Bishop rather than from Pearson.',
      },
    ],
    sources: [
      {
        url: 'https://globalnews.ca/news/11709963/doug-ford-billy-bishop-expansion/',
        title: "Premier wants to see 'gold mine' airport expanded — Global News",
        source_type: 'News',
      },
    ],
  },
]

async function main() {
  console.log('Seeding Billy Bishop people…')

  // 1. Create new people
  for (const record of NEW_PEOPLE) {
    const existing = await prisma.person.findUnique({ where: { slug: record.slug } })
    if (existing) {
      console.log(`  ⚠️  Skipping ${record.name} (already exists)`)
    } else {
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
      console.log(`  ✓ Created ${person.name} (id: ${person.id})`)

      for (const conn of record.connections) {
        const scandal = await prisma.scandal.findUnique({ where: { slug: conn.scandal_slug } })
        if (!scandal) {
          console.warn(`    ⚠️  Scandal '${conn.scandal_slug}' not found — skipping connection`)
          continue
        }
        await prisma.personConnection.createMany({
          data: [{ personId: person.id, scandalId: scandal.id, connection_type: conn.connection_type, description: conn.description }],
          skipDuplicates: true,
        })
        console.log(`    ✓ Connected to ${conn.scandal_slug}`)
      }

      await prisma.personSource.createMany({
        data: record.sources.map(s => ({ personId: person.id, url: s.url, title: s.title, source_type: s.source_type })),
        skipDuplicates: true,
      })
      console.log(`    ✓ ${record.sources.length} source(s)`)
    }
  }

  // 2. Add Billy Bishop connection to Mark Lawson (existing person)
  const lawson = await prisma.person.findUnique({ where: { slug: 'mark-lawson' } })
  if (!lawson) {
    console.warn('  ⚠️  Mark Lawson not found in DB — run seed-people.ts first')
  } else {
    const billyBishop = await prisma.scandal.findUnique({ where: { slug: 'billy-bishop-airport-seizure' } })
    if (!billyBishop) {
      console.warn('  ⚠️  Billy Bishop scandal not found — run seed-billy-bishop-airport-seizure.ts first')
    } else {
      await prisma.personConnection.createMany({
        data: [{
          personId: lawson.id,
          scandalId: billyBishop.id,
          connection_type: 'Lobbyist',
          description: "After leaving Ford's office (where he served as Deputy Chief of Staff and Head of Policy 2019–2021), Lawson was retained by Nieuport Aviation Infrastructure Partners — the private consortium that owns the Billy Bishop passenger terminal — to lobby the provincial government on the airport's future expansion plans. Simultaneously, Lawson served as VP of Communications at Therme Group Canada, which holds the 95-year lease at the adjacent Ontario Place development. His dual lobbying role ties together Ford's two most controversial Toronto waterfront projects.",
        }],
        skipDuplicates: true,
      })
      console.log('  ✓ Added Billy Bishop connection to Mark Lawson')

      await prisma.personSource.createMany({
        data: [{
          personId: lawson.id,
          url: 'https://www.theglobeandmail.com/canada/article-ford-mulls-taking-over-torontos-stake-in-billy-bishop-airport-as-he/',
          title: "Ford mulls taking over Toronto's stake in Billy Bishop airport — The Globe and Mail",
          source_type: 'News',
        }],
        skipDuplicates: true,
      })
      console.log('  ✓ Added Nieuport source to Mark Lawson')
    }
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
