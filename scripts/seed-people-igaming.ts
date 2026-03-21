/**
 * Seed script: People connected to Ford's iGaming expansion
 * Uses Prisma Client to handle the Confidence enum correctly.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-people-igaming.ts
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
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
    slug: 'chris-froggatt',
    name: 'Chris Froggatt',
    bio: 'Vice-chair of Doug Ford\'s 2018 election campaign and a key member of his post-election transition team. Shortly after the Tories took power, Froggatt set up Loyalist Public Affairs and registered Stars Group Inc. (operator of PokerStars) as a lobbying client — while the Ford government was designing the iGaming Ontario regulatory framework.',
    organization: 'Loyalist Public Affairs',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'igaming-expansion-gambling-addiction',
        connection_type: 'Beneficiary',
        description: 'Ford\'s campaign vice-chair and transition team chief set up Loyalist Public Affairs within months of the Tories taking office and registered Stars Group (PokerStars) as a client. Stars Group had simultaneously dropped its Liberal-tied lobbyist and switched to the PC-connected firm, as reported by the Globe and Mail.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/politics/article-internet-gambling-interests-bet-on-lobbyists-with-pc-ties-for-a-quick/',
        title: 'Internet-gambling interests bet on lobbyists with PC ties for a quick win in Ontario — The Globe and Mail',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'kory-teneycke',
    name: 'Kory Teneycke',
    bio: 'Doug Ford\'s 2018 election campaign manager. After the Tories won, Teneycke set up Rubicon Strategy, a government relations firm whose associates registered to lobby for online gambling companies before the iGaming Ontario market launched.',
    organization: 'Rubicon Strategy',
    confidence: Confidence.medium,
    connections: [
      {
        scandal_slug: 'igaming-expansion-gambling-addiction',
        connection_type: 'Beneficiary',
        description: 'Ford\'s campaign manager set up Rubicon Strategy after the election. His associate Patrick Harris — the 4th Vice-President of the PC Party — registered through Rubicon to lobby for the Canadian Online Gaming Alliance, which represented offshore gambling operators Bet365, GVS, and Microgaming, according to Globe and Mail reporting.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/politics/article-internet-gambling-interests-bet-on-lobbyists-with-pc-ties-for-a-quick/',
        title: 'Internet-gambling interests bet on lobbyists with PC ties for a quick win in Ontario — The Globe and Mail',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'patrick-harris',
    name: 'Patrick Harris',
    bio: '4th Vice-President of the Ontario PC Party and associate at Rubicon Strategy. Registered as a lobbyist for the Canadian Online Gaming Alliance (COGA), a lobbying umbrella created to represent three offshore online gambling companies — Bet365, GVS, and Microgaming Systems — while simultaneously holding a senior party role.',
    organization: 'Rubicon Strategy',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'igaming-expansion-gambling-addiction',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for the Canadian Online Gaming Alliance (representing Bet365, GVS, and Microgaming — offshore operators from Gibraltar and the Isle of Man) while serving as 4th Vice-President of the PC Party. His lobbying registration initially did not disclose the names of the three gambling companies COGA represented, according to the Globe and Mail.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/politics/article-internet-gambling-interests-bet-on-lobbyists-with-pc-ties-for-a-quick/',
        title: 'Internet-gambling interests bet on lobbyists with PC ties for a quick win in Ontario — The Globe and Mail',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'troy-ross',
    name: 'Troy Ross',
    bio: 'Ontario lobbyist who created the Canadian Online Gaming Alliance (COGA) to represent offshore gambling companies Bet365, GVS, and Microgaming Systems. Documented by the Globe and Mail pushing gambling industry executives to attend a $500 PC fundraiser at which then-Treasury Board President Peter Bethlenfalvy was planned as keynote speaker, explicitly framing Bethlenfalvy as "an important voice about the future of gambling in Ontario."',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'igaming-expansion-gambling-addiction',
        connection_type: 'Lobbyist',
        description: 'Created the Canadian Online Gaming Alliance to lobby the Ford government on behalf of offshore gambling operators. Pushed industry contacts to attend a fundraiser with Treasury Board President Bethlenfalvy, telling them he would be "an important voice about the future of gambling in Ontario." Bethlenfalvy declined to attend after the Globe and Mail began inquiring.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/politics/article-gambling-lobbyist-pushed-for-attendance-at-fundraising-event-where/',
        title: 'Gambling lobbyist pushed for attendance at fundraising event where Ontario Treasury President was expected — The Globe and Mail',
        source_type: 'News',
      },
    ],
  },
]

async function main() {
  console.log(`Seeding ${PEOPLE.length} people connected to Ford's iGaming expansion…`)

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
            console.warn(`    ⚠️  Scandal '${conn.scandal_slug}' not found — skipping connection`)
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
      for (const conn of valid) {
        try {
          await prisma.personConnection.create({ data: conn })
        } catch (e: any) {
          if (e.code !== 'P2002') throw e
        }
      }
      if (valid.length > 0) console.log(`    ✓ ${valid.length} connection(s)`)
    }

    if (record.sources.length > 0) {
      for (const s of record.sources) {
        try {
          await prisma.personSource.create({
            data: { personId: person.id, url: s.url, title: s.title, source_type: s.source_type },
          })
        } catch (e: any) {
          if (e.code !== 'P2002') throw e
        }
      }
      console.log(`    ✓ ${record.sources.length} source(s)`)
    }
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
