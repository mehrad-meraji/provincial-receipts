/**
 * Seed script: Legislature Avoidance — Timeline Events
 * Adds individual dated markers in the homepage timeline, each linking to
 * /scandals/legislature-avoidance, so the pattern appears at every key date.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-legislature-timeline-events.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

const SCANDAL_URL = '/scandals/legislature-avoidance'

const events = [
  {
    date: '2019-10-28',
    label: 'Legislature returns after 5-month recess — longest break in 25 years',
    icon: 'Megaphone',
    type: 'milestone',
  },
  {
    date: '2024-09-09',
    label: 'Ford cancels all September sittings — returns 6 weeks late',
    icon: 'Megaphone',
    type: 'milestone',
  },
  {
    date: '2024-11-04',
    label: 'Legislature sits just 28 days in fall 2024 session',
    icon: 'Megaphone',
    type: 'milestone',
  },
  {
    date: '2025-01-29',
    label: 'Snap election called 18 months early — dissolves legislature mid-investigation',
    icon: 'Vote',
    type: 'milestone',
  },
  {
    date: '2025-12-15',
    label: 'Legislature sat just 51 of 365 days in 2025 — Ford begins winter break',
    icon: 'Megaphone',
    type: 'milestone',
  },
]

async function main() {
  console.log('Seeding legislature avoidance timeline events...\n')

  for (const evt of events) {
    // Check for duplicate by date + label
    const existing = await sql`
      SELECT id FROM "TimelineEvent"
      WHERE date = ${evt.date}::date AND label = ${evt.label}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Already exists: "${evt.label.substring(0, 60)}..."`)
      continue
    }

    const id = cuid()
    const now = new Date().toISOString()

    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${evt.date}::date,
        ${evt.label},
        ${SCANDAL_URL},
        ${evt.icon},
        ${evt.type},
        ${true},
        ${now},
        ${now}
      )
    `
    console.log(`✅ ${evt.date} — ${evt.label.substring(0, 65)}...`)
  }

  console.log('\n🎉 Legislature avoidance timeline events seeded.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
