import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const slug = 'highway-413-bradford-bypass'
  const r = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug}`
  if (r.length) {
    const id = r[0].id as string
    await sql`DELETE FROM "ScandalSource" WHERE "scandalId" = ${id}`
    await sql`DELETE FROM "LegalAction" WHERE "scandalId" = ${id}`
    await sql`DELETE FROM "Scandal" WHERE id = ${id}`
    console.log('Cleaned up partial insert:', id)
  } else {
    console.log('Nothing to clean')
  }
}

main().catch(console.error)
