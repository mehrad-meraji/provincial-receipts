import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const r = await sql`
    UPDATE "Scandal"
    SET date_reported = '2025-12-15', "updatedAt" = NOW()
    WHERE slug = 'legislature-avoidance'
    RETURNING id, title, date_reported
  `
  if (r.length) console.log(`✅ Updated: ${r[0].title} → ${r[0].date_reported}`)
  else console.log('⚠️  Not found')
}
main().catch(console.error)
