import { Confidence } from '@prisma/client'

export interface PersonSeedRecord {
  slug: string
  name: string
  bio?: string
  photo_filename?: string
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

export const PEOPLE_DATA: PersonSeedRecord[] = [
  // ─── Template — replace with real research data ───────────────────────────
  // {
  //   slug: 'jane-doe',
  //   name: 'Jane Doe',
  //   bio: 'Registered lobbyist for ExampleCorp...',
  //   photo_filename: 'jane-doe.jpg',   // Place file in public/people/ first
  //   organization: 'ExampleCorp',
  //   organization_url: 'https://example.com',
  //   confidence: Confidence.high,
  //   connections: [
  //     {
  //       scandal_slug: 'ontario-place',
  //       connection_type: 'Lobbyist',
  //       description: 'Lobbied Premier\'s Office re: Ontario Place, 2021',
  //     },
  //   ],
  //   sources: [
  //     {
  //       url: 'https://lobbyist.oico.on.ca/...',
  //       title: 'Ontario Lobbyist Registry — ExampleCorp, 2021',
  //       source_type: 'Registry',
  //     },
  //   ],
  // },
]
