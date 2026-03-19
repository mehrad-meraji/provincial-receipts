import { prisma } from '@/lib/db'
import { Confidence } from '@prisma/client'

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
    scandal: { title: string; slug: string; tldr: string }
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

function toCardData(person: {
  slug: string
  name: string
  photo_filename: string | null
  organization: string | null
  connections: { connection_type: string }[]
}): PersonCardData {
  return {
    slug: person.slug,
    name: person.name,
    photo_filename: person.photo_filename,
    organization: person.organization,
    primary_connection_type: person.connections[0]?.connection_type ?? null,
  }
}

// ─── Public queries ───────────────────────────────────────────────────────────

/**
 * Returns all published high/medium people with their connections.
 * Optionally filtered by connection_type (exact match).
 */
export async function getPeople(filter?: { connection_type?: string }): Promise<PersonWithConnections[]> {
  const people = await prisma.person.findMany({
    where: {
      ...PUBLIC_WHERE,
      ...(filter?.connection_type
        ? { connections: { some: { connection_type: filter.connection_type } } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
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
          scandal: { select: { title: true, slug: true, tldr: true } },
        },
      },
    },
  })
  return people
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
          scandal: { select: { title: true, slug: true, tldr: true } },
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
        take: 1,
        select: { connection_type: true },
      },
    },
  })
  return people.map(toCardData)
}
