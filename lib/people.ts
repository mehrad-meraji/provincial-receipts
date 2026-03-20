import {prisma} from '@/lib/db'
import {Confidence} from '@prisma/client'
import {formatBudgetAmount} from '@/lib/format'

const PUBLIC_WHERE = {
  confidence: { in: [Confidence.high, Confidence.medium] as Confidence[] },
  published: true,
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

export type PersonCardData = {
  slug: string
  name: string
  photo_filename: string | null
  organization: string | null
  primary_connection_type: string | null
  total_cost_label: string | null
}

export type PersonWithConnections = {
  id: string
  slug: string
  name: string
  bio: string | null
  photo_filename: string | null
  organization: string | null
  organization_url: string | null
  confidence: Confidence
  published: boolean
  connections: {
    id: string
    connection_type: string
    description: string
    scandal: { title: string; slug: string; tldr: string; cost_to_ontario: bigint | null; cost_label: string | null }
  }[]
}

export type PersonWithDetails = PersonWithConnections & {
  sources: {
    id: string
    url: string
    title: string
    source_type: string
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function toPersonCardData(person: {
  slug: string
  name: string
  photo_filename: string | null
  organization: string | null
  connections: { connection_type: string; scandal?: { cost_to_ontario: bigint | null; cost_label: string | null } | null }[]
}): PersonCardData {
  const totalCents = person.connections.reduce<bigint>(
    (sum, c) => (c.scandal?.cost_to_ontario ? sum + c.scandal.cost_to_ontario : sum),
    0n
  )
  const isMinimum = person.connections.some(c => c.scandal?.cost_label?.startsWith('>'))
  const total_cost_label = totalCents > 0n
    ? `${isMinimum ? '>' : ''}${formatBudgetAmount(totalCents)}`
    : null

  return {
    slug: person.slug,
    name: person.name,
    photo_filename: person.photo_filename,
    organization: person.organization,
    primary_connection_type: person.connections[0]?.connection_type ?? null,
    total_cost_label,
  }
}

// ─── Public queries ───────────────────────────────────────────────────────────

/**
 * Returns all published high/medium people with their connections.
 * Optionally filtered by connection_type (exact match).
 */
export async function getPeople(filter?: { connection_type?: string }): Promise<PersonWithConnections[]> {
  return await prisma.person.findMany({
    where: {
      ...PUBLIC_WHERE,
      ...(filter?.connection_type
        ? {connections: {some: {connection_type: filter.connection_type}}}
        : {}),
    },
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photo_filename: true,
      organization: true,
      organization_url: true,
      confidence: true,
      published: true,
      connections: {
        orderBy: {createdAt: 'asc'},
        select: {
          id: true,
          connection_type: true,
          description: true,
          scandal: {select: {title: true, slug: true, tldr: true, cost_to_ontario: true, cost_label: true}},
        },
      },
    },
  })
}

/**
 * Returns a single published high/medium person by slug, with connections + sources.
 * Returns null if not found, confidence is low, or published is false.
 */
export async function getPersonBySlug(slug: string): Promise<PersonWithDetails | null> {
  const person = await prisma.person.findFirst({
    where: { slug, ...PUBLIC_WHERE },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      photo_filename: true,
      organization: true,
      organization_url: true,
      confidence: true,
      published: true,
      connections: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          connection_type: true,
          description: true,
          scandal: { select: { title: true, slug: true, tldr: true, cost_to_ontario: true, cost_label: true } },
        },
      },
      sources: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          url: true,
          title: true,
          source_type: true,
        },
      },
    },
  })
  return person ?? null
}

/**
 * Returns up to 20 published high/medium people for the homepage carousel.
 * Ordered by createdAt desc (most recently added first).
 */
export async function getPeopleForCarousel(): Promise<PersonCardData[]> {
  const people = await prisma.person.findMany({
    where: PUBLIC_WHERE,
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      slug: true,
      name: true,
      photo_filename: true,
      organization: true,
      connections: {
        orderBy: { createdAt: 'asc' },
        select: {
          connection_type: true,
          scandal: { select: { cost_to_ontario: true, cost_label: true } },
        },
      },
    },
  })
  return people.map(toPersonCardData)
}
