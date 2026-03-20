/**
 * Repairs connections and sources for the 3 people seeded in the first
 * partial run (before the WebSocket fix), which left their PersonConnection
 * rows with null scandalId values.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/repair-early-seed.ts
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
import { prisma } from '../lib/db'
import { PEOPLE_DATA } from './people-data'

const REPAIR_SLUGS = ['leslie-noble', 'john-perenack', 'amir-remtulla']

async function main() {
  for (const slug of REPAIR_SLUGS) {
    const record = PEOPLE_DATA.find(p => p.slug === slug)
    if (!record) { console.warn(`No data for ${slug}`); continue }

    const person = await prisma.person.findUnique({ where: { slug } })
    if (!person) { console.warn(`Person ${slug} not found`); continue }

    console.log(`\nRepairing ${person.name}…`)

    // 1. Wipe existing connections and sources
    await prisma.personConnection.deleteMany({ where: { personId: person.id } })
    await prisma.personSource.deleteMany({ where: { personId: person.id } })
    console.log(`  ✓ Cleared existing connections and sources`)

    // 2. Re-seed connections
    let connCount = 0
    for (const conn of record.connections) {
      const scandal = await prisma.scandal.findUnique({ where: { slug: conn.scandal_slug } })
      if (!scandal) { console.warn(`  ⚠️  Scandal '${conn.scandal_slug}' not found`); continue }
      await prisma.personConnection.create({
        data: {
          personId: person.id,
          scandalId: scandal.id,
          connection_type: conn.connection_type,
          description: conn.description,
        },
      })
      connCount++
    }
    console.log(`  ✓ ${connCount} connection(s)`)

    // 3. Re-seed sources
    for (const s of record.sources) {
      await prisma.personSource.create({
        data: { personId: person.id, url: s.url, title: s.title, source_type: s.source_type },
      })
    }
    console.log(`  ✓ ${record.sources.length} source(s)`)
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
