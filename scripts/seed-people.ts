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
