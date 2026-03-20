/**
 * Update script: Add new sources to existing FOI Transparency Scandal
 * Adds recent news coverage from March 2026 to the existing scandal.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/update-foi-scandal-sources.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'foi-transparency-scandal'

  // Get the existing scandal
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length === 0) {
    console.log(`❌ Scandal not found: ${slug}`)
    return
  }

  const scandalId = existing[0].id
  console.log(`✅ Found existing scandal (id: ${scandalId})`)

  // New sources from March 2026 NewsAPI search
  const newSources = [
    {
      url: 'https://www.cp24.com/local/toronto/2026/03/13/ontario-moves-to-keep-documents-from-premier-and-cabinet-minister-offices-secret/',
      title: 'Premier and cabinet ministers will be exempt from FOI requests under new legislation — CP24 (March 13, 2026)',
    },
    {
      url: 'https://foiassist.ca/2026/03/16/ford-government-announces-surprise-changes-to-ontarios-foi-legislation/',
      title: 'Ford Government Announces Surprise Changes to Ontario\'s FOI Legislation — FOI Assist (March 16, 2026)',
    },
    {
      url: 'https://www.btpm.org/ontario-news/2026-03-19/ford-aims-to-change-ontario-freedom-of-information-laws-sparking-outcry',
      title: 'Ford aims to change Ontario Freedom of Information laws, sparking outcry — Buffalo Toronto Public Media (March 19, 2026)',
    },
    {
      url: 'https://thedeepdive.ca/ontario-foi-secrecy-push/',
      title: 'Ontario FOI law rewrite would shield Ford cabinet offices — The Deep Dive',
    },
  ]

  let addedCount = 0

  for (const src of newSources) {
    // Check if source already exists
    const exists = await sql`
      SELECT id FROM "ScandalSource"
      WHERE "scandalId" = ${scandalId} AND url = ${src.url}
      LIMIT 1
    `

    if (exists.length > 0) {
      console.log(`⏭️  Source already exists: ${src.title.substring(0, 60)}...`)
      continue
    }

    const srcId = cuid()
    const now = new Date().toISOString()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`✅ Added source: ${src.title.substring(0, 70)}...`)
    addedCount++
  }

  console.log(`\n🎉 Added ${addedCount} new sources to FOI scandal`)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
