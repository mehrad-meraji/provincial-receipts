/**
 * Updates photo_filename for people who now have images in /public/people/
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/update-photo-filenames.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// slug → filename (only new photos added in this batch)
const PHOTOS: Record<string, string> = {
  // Greenbelt / Ontario Place / MZO
  'leslie-noble':          'leslie-noble.jpg',
  'john-perenack':         'john-perenack.jpg',
  'ryan-amato':            'ryan-amato.jpg',
  'silvio-de-gasperis':    'silvio-de-gasperis.jpg',
  'shakir-rehmatullah':    'shakir-rehmatullah.jpg',
  'frank-klees':           'frank-klees.jpg',
  'carmine-nigro':         'carmine-nigro.jpg',
  'mario-cortellucci':     'mario-cortellucci.jpg',
  'nico-fidani-diker':     'nico-fidani-diker.jpg',
  'mark-lawson':           'mark-lawson.jpg',     // skip if file missing
  // OPP / Taverner
  'ron-taverner':          'ron-taverner.jpg',
  'brad-blair':            'brad-blair.jpg',
  // Far right / PC connections
  'randy-hillier':         'randy-hillier.jpg',
  // Other officials
  'amin-massoudi':         'amin-massoudi.jpg',
  'amir-remtulla':         'amir-remtulla.jpg',  // skip if file missing
  // LTC / shelters / OSAP
  'ryan-bell-southbridge': 'ryan-bell-southbridge.jpg',
  'lois-cormack':          'lois-cormack.jpg',   // skip if file missing
  'robert-hache':          'robert-hache.jpg',
  // Beer store / other
  'timothy-barnhardt':     'timothy-barnhardt.jpg',
  'bob-gale':              'bob-gale.jpg',
  // iGaming (only works after seed-people-igaming.ts has run)
  'chris-froggatt':        'chris-froggatt.jpg',
  'kory-teneycke':         'kory-teneycke.jpg',
  'patrick-harris':        'patrick-harris.jpg',
  'troy-ross':             'troy-ross.jpg',
}

import { existsSync } from 'fs'
import { join } from 'path'

const PUBLIC_DIR = join(process.cwd(), 'public', 'people')

async function main() {
  let updated = 0
  let skipped = 0
  let missing = 0

  for (const [slug, filename] of Object.entries(PHOTOS)) {
    const filePath = join(PUBLIC_DIR, filename)
    if (!existsSync(filePath)) {
      console.log(`  ⚠️  File not found, skipping: ${filename}`)
      missing++
      continue
    }

    const result = await sql`
      UPDATE "Person"
      SET photo_filename = ${filename}, "updatedAt" = NOW()
      WHERE slug = ${slug} AND (photo_filename IS NULL OR photo_filename = '')
      RETURNING slug
    `

    if (result.length > 0) {
      console.log(`  ✓ ${slug} → ${filename}`)
      updated++
    } else {
      // Either slug doesn't exist yet or already has a photo
      const exists = await sql`SELECT slug, photo_filename FROM "Person" WHERE slug = ${slug} LIMIT 1`
      if (exists.length === 0) {
        console.log(`  ⏭  ${slug} not in DB yet (run seed first)`)
      } else {
        console.log(`  ✓ ${slug} already has photo: ${exists[0].photo_filename}`)
      }
      skipped++
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped/already set: ${skipped}, files missing: ${missing}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
