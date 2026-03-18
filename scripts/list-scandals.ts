import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const rows = await sql`SELECT id, title, slug, "createdAt" FROM "Scandal" ORDER BY "createdAt"`
  rows.forEach((s: any, i: number) => console.log(`  ${i + 1}. [${s.id}] ${s.title}\n     slug: ${s.slug}\n     created: ${s.createdAt}`))
  console.log(`\nTotal: ${rows.length} scandals`)
}

main().catch(console.error)
