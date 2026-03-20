/**
 * Fetch and save headshots for named individuals.
 *
 * Sources:
 *   - Ontario Legislative Assembly (OLA): official member profile photos, freely reusable
 *   - House of Commons (Parliament of Canada): official MP photos, Crown copyright, freely reusable
 *   - Official government/university profile photos
 *
 * Photos are saved to public/people/{slug}.{ext} and the
 * person's photo_filename field is updated in the database.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/fetch-people-photos.ts
 *
 * Safe to re-run: skips people who already have a photo_filename set.
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
import { prisma } from '../lib/db'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = join(process.cwd(), 'public', 'people')

// photo sources: person slug → source URL
// OLA photos: https://www.ola.org/sites/default/files/member/profile-photo/
// HoC photos:  https://www.ourcommons.ca/Content/Parliamentarians/Images/OfficialMPPhotos/...
const PHOTO_SOURCES: Record<string, string> = {
  // --- Ontario MPPs (current) — OLA official headshots ---
  'steve-clark':
    'https://www.ola.org/sites/default/files/member/profile-photo/steve_clark_0.jpg',
  'stephen-lecce':
    'https://www.ola.org/sites/default/files/member/profile-photo/Stephen_Lecce.jpg',
  'sylvia-jones':
    'https://www.ola.org/sites/default/files/member/profile-photo/Sylvia_Jones.jpeg',
  'goldie-ghamari':
    'https://www.ola.org/sites/default/files/member/profile-photo/Goldie_Ghamari.jpg',
  'kinga-surma':
    'https://www.ola.org/sites/default/files/member/profile-photo/kinga_surma.jpg',
  'merrilee-fullerton':
    'https://www.ola.org/sites/default/files/member/profile-photo/merrilee_fullerton.jpg',
  // David Piccini's official MPP website headshot
  'david-piccini':
    'https://davidpiccinimpp.ca/wp-content/uploads/sites/16/2021/12/david-piccini-mpp.jpg',

  // --- Former Ontario MPPs — OLA archive ---
  'stephen-crawford':
    'https://www.ola.org/sites/default/files/member/profile-photo/stephen_crawford.jpg',
  // Randy Hillier & Frank Klees left before OLA began archiving headshots online.
  // TODO: add manually — drop a photo in public/people/ and set photo_filename in admin.
  // 'randy-hillier': '...',
  // 'frank-klees': '...',

  // --- Former federal MPs — House of Commons official photos ---
  // Parliament Canada: /Content/Parliamentarians/Images/OfficialMPPhotos/{Parliament}/{LastName}_{FirstName}_{riding-code}.jpg
  // Peter Van Loan: 41st Parliament, York-Simcoe
  'peter-van-loan':
    'https://www.ourcommons.ca/Content/Parliamentarians/Images/OfficialMPPhotos/41/VanLoanPeter_CPC.jpg',

  // Ron Taverner — ontario.ca blocks hotlinking; add photo manually via admin.
  // TODO: download from a press release and drop in public/people/ron-taverner.jpg
  // 'ron-taverner': '...',
}

async function downloadPhoto(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) {
      console.warn(`    HTTP ${res.status} — ${url}`)
      return false
    }
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(destPath, buf)
    return true
  } catch (err: any) {
    console.warn(`    Fetch error — ${err.message}`)
    return false
  }
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  const slugs = Object.keys(PHOTO_SOURCES)
  console.log(`Fetching photos for ${slugs.length} people…\n`)

  for (const slug of slugs) {
    const sourceUrl = PHOTO_SOURCES[slug]

    // Look up the person
    const person = await prisma.person.findUnique({ where: { slug } })
    if (!person) {
      console.log(`  ⚠️  No person found for slug '${slug}' — skipping`)
      continue
    }

    // Skip if photo already set
    if (person.photo_filename) {
      console.log(`  ⏭  ${person.name} already has photo '${person.photo_filename}' — skipping`)
      continue
    }

    // Determine file extension from URL
    const urlPath = new URL(sourceUrl).pathname
    const ext = urlPath.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() ?? 'jpg'
    const filename = `${slug}.${ext}`
    const destPath = join(OUT_DIR, filename)

    process.stdout.write(`  ${person.name}… `)

    const ok = await downloadPhoto(sourceUrl, destPath)
    if (!ok) {
      console.log('FAILED')
      continue
    }

    // Update the database
    await prisma.person.update({
      where: { id: person.id },
      data: { photo_filename: filename },
    })

    console.log(`✓  saved as ${filename}`)
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
