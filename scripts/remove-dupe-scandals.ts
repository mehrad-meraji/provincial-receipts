import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Remove older duplicates — keeping the fresher, more complete versions seeded today
const toRemove = [
  'cqaayrj3s8mmv7pr9h', // "MZO (Minister's Zoning Orders) Scandal" — old version, slug: mzo-ministers-zoning-orders
  'cq6p6hp57mmmv80b0e', // "Bill 124 / Bill 28 — Wage Suppression" — old version, slug: bill-124-28-wage-suppression
]

async function main() {
  for (const id of toRemove) {
    await sql`DELETE FROM "ScandalSource" WHERE "scandalId" = ${id}`
    await sql`DELETE FROM "LegalAction" WHERE "scandalId" = ${id}`
    const r = await sql`DELETE FROM "Scandal" WHERE id = ${id} RETURNING title`
    if (r.length) {
      console.log(`🗑️  Removed: ${r[0].title} (${id})`)
    } else {
      console.log(`⚠️  Not found: ${id}`)
    }
  }
  console.log('\nDone.')
}

main().catch(console.error)
