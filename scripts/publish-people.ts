/**
 * Publish all seeded people and enable the named_individuals feature flag.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/publish-people.ts
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
import { prisma } from '../lib/db'

async function main() {
  // 1. Publish all unpublished people (individual updates — no transactions)
  const unpublished = await prisma.person.findMany({
    where: { published: false },
    select: { id: true, name: true },
  })
  for (const person of unpublished) {
    await prisma.person.update({ where: { id: person.id }, data: { published: true } })
    console.log(`  ✓ Published ${person.name}`)
  }
  console.log(`✓ Published ${unpublished.length} people`)

  // 2. Enable named_individuals_enabled feature flag (find + create/update — no upsert)
  const existing = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  if (existing) {
    await prisma.siteConfig.update({
      where: { id: 'singleton' },
      data: { named_individuals_enabled: true },
    })
  } else {
    await prisma.siteConfig.create({
      data: { id: 'singleton', named_individuals_enabled: true },
    })
  }
  console.log('✓ Feature flag named_individuals_enabled = true')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
