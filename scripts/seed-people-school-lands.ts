/**
 * Seed script: People connected to The School Lands Sell-Off
 * Uses Prisma Client to handle the Confidence enum correctly.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-people-school-lands.ts
 */

import { prisma } from '../lib/db'
import { Confidence } from '@prisma/client'

interface PersonRecord {
  slug: string
  name: string
  bio?: string
  organization?: string
  organization_url?: string
  confidence: Confidence
  connections: {
    scandal_slug: string
    connection_type: 'Lobbyist' | 'Donor' | 'Director' | 'Beneficiary'
    description: string
  }[]
  sources: {
    url: string
    title: string
    source_type: 'Registry' | 'News' | 'Corporate' | 'Court' | 'FOI'
  }[]
}

const PEOPLE: PersonRecord[] = [
  {
    slug: 'rohit-gupta',
    name: 'Rohit Gupta',
    bio: 'Managing partner of Harrington Place Advisors, an M&A advisory firm that, by its own description, specializes in "bridging public and private sector priorities" and "identifying high value opportunities for public sector assets." Appointed by the Ford government as provincial supervisor of the Toronto District School Board in June 2025, earning $350,000 annually. Previously served as an economic advisor to Prime Minister Stephen Harper and as an advisor to Metrolinx. Has no known background in public education.',
    organization: 'Harrington Place Advisors',
    confidence: Confidence.medium,
    connections: [
      {
        scandal_slug: 'the-school-lands-sell-off',
        connection_type: 'Director',
        description: 'Appointed by the Ford government as provincial supervisor of the TDSB in June 2025, giving him sole decision-making authority over the board — including control of the Toronto Lands Corporation, which manages $20 billion in public school land. With no education background, Gupta is working with the Ministry on undisclosed changes to how the TLC operates, while public transparency at the agency has been curtailed.',
      },
    ],
    sources: [
      {
        url: 'https://thelocal.to/school-board-takeover-questions-and-answers/',
        title: 'Takeover of GTA School Boards — Your Questions Answered — The Local',
        source_type: 'News',
      },
      {
        url: 'https://educationactiontoronto.com/articles/fords-school-board-takeover-a-real-estate-heist-disguised-as-education-reform/',
        title: "Ford's School Board Takeover: A Real Estate Heist Disguised as Education Reform? — Education Action Toronto",
        source_type: 'News',
      },
      {
        url: 'https://thelocal.to/tdsb-takeover-property/',
        title: "What Happens to TDSB's $20 Billion Worth of Land Under Provincial Supervision? — The Local",
        source_type: 'News',
      },
    ],
  },
  {
    slug: 'rick-byers',
    name: 'Rick Byers',
    bio: 'Former Progressive Conservative MPP for Bruce–Grey–Owen Sound (June 2022–February 2025). After leaving the legislature, appointed by the Ford government as provincial supervisor of the Dufferin-Peel Catholic District School Board in June 2025. Financial executive by background.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-school-lands-sell-off',
        connection_type: 'Director',
        description: 'Appointed as provincial supervisor of the Dufferin-Peel Catholic District School Board in June 2025 — less than six months after leaving the PC caucus. As supervisor, Byers holds all powers previously held by elected trustees, including decisions about school land and property.',
      },
    ],
    sources: [
      {
        url: 'https://thelocal.to/school-board-takeover-questions-and-answers/',
        title: 'Takeover of GTA School Boards — Your Questions Answered — The Local',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-government-supervisors-4-school-boards-1.7572705',
        title: 'Ontario Takes Control of 4 More School Boards, Including TDSB — CBC News',
        source_type: 'News',
      },
    ],
  },
  {
    slug: 'paul-calandra',
    name: 'Paul Calandra',
    bio: 'Ontario Minister of Education under Doug Ford. Ordered the placement of six school boards under provincial supervision in 2025, citing financial mismanagement. Issued the June 2025 regulation giving the province direct authority to direct school board property sales. Previously served as Municipal Affairs and Housing Minister.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-school-lands-sell-off',
        connection_type: 'Director',
        description: 'As Minister of Education, Calandra ordered the provincial takeover of six school boards in 2025 and approved the June 2025 regulation allowing the province to directly control school board property sales. He appointed real estate and finance insiders — rather than educators — as supervisors, and has put all boards "on notice" regardless of their financial standing.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-government-supervisors-4-school-boards-1.7572705',
        title: 'Ontario Takes Control of 4 More School Boards, Including TDSB — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://thelocal.to/tdsb-takeover-property/',
        title: "What Happens to TDSB's $20 Billion Worth of Land Under Provincial Supervision? — The Local",
        source_type: 'News',
      },
    ],
  },
]

async function main() {
  console.log(`Seeding ${PEOPLE.length} people…`)

  for (const record of PEOPLE) {
    const existing = await prisma.person.findUnique({ where: { slug: record.slug } })
    if (existing) {
      console.log(`  ⚠️  Skipping ${record.name} (already exists)`)
      continue
    }

    const person = await prisma.person.create({
      data: {
        slug: record.slug,
        name: record.name,
        bio: record.bio ?? null,
        organization: record.organization ?? null,
        organization_url: record.organization_url ?? null,
        confidence: record.confidence,
        published: false,
      },
    })
    console.log(`  ✓ Created ${person.name}`)

    if (record.connections.length > 0) {
      const connectionData = await Promise.all(
        record.connections.map(async conn => {
          const scandal = await prisma.scandal.findUnique({ where: { slug: conn.scandal_slug } })
          if (!scandal) {
            console.warn(`    ⚠️  Scandal '${conn.scandal_slug}' not found — skipping`)
            return null
          }
          return {
            personId: person.id,
            scandalId: scandal.id,
            connection_type: conn.connection_type,
            description: conn.description,
          }
        })
      )
      const valid = connectionData.filter((c): c is NonNullable<typeof c> => c !== null)
      if (valid.length > 0) {
        await prisma.personConnection.createMany({ data: valid, skipDuplicates: true })
        console.log(`    ✓ ${valid.length} connection(s)`)
      }
    }

    if (record.sources.length > 0) {
      await prisma.personSource.createMany({
        data: record.sources.map(s => ({
          personId: person.id,
          url: s.url,
          title: s.title,
          source_type: s.source_type,
        })),
        skipDuplicates: true,
      })
      console.log(`    ✓ ${record.sources.length} source(s)`)
    }
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
