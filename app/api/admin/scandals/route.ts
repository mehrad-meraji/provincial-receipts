import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 25

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const filter = searchParams.get('filter') ?? 'all'
  const q = searchParams.get('q') ?? ''

  const where: Prisma.ScandalWhereInput = {}

  if (filter === 'published') where.published = true
  else if (filter === 'draft') where.published = false
  // 'all' or unrecognised: no filter

  if (q.trim()) {
    where.title = { contains: q, mode: 'insensitive' }
  }

  const [scandals, total] = await Promise.all([
    prisma.scandal.findMany({
      where,
      orderBy: { date_reported: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        date_reported: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            legal_actions: true,
            sources: true,
            news_links: true,
            bills: true,
            mpps: true,
          },
        },
      },
    }),
    prisma.scandal.count({ where }),
  ])

  return NextResponse.json({
    scandals: scandals.map(s => ({
      ...s,
      date_reported: s.date_reported.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title,
    summary,
    date_reported,
    published,
    why_it_matters,
    rippling_effects,
    legal_actions = [],
    bill_ids = [],
    mpp_ids = [],
    news_links = [],
    sources = [],
  } = body as {
    title: string
    summary: string
    date_reported: string
    published: boolean
    why_it_matters: string
    rippling_effects: string
    legal_actions: { title: string; status: string; description: string }[]
    bill_ids: string[]
    mpp_ids: string[]
    news_links: {
      newsEventId?: string
      external_url?: string
      external_title?: string
      external_source?: string
      external_date?: string
    }[]
    sources: { url: string; title: string }[]
  }

  for (const link of news_links) {
    const hasNewsEvent = !!link.newsEventId
    const hasExternalUrl = !!link.external_url
    if (hasNewsEvent === hasExternalUrl) {
      return NextResponse.json(
        { error: 'Each news_link must have exactly one of newsEventId or external_url' },
        { status: 400 }
      )
    }
  }

  const slug = slugify(title)

  const scandal = await prisma.scandal.create({
    data: {
      title,
      slug,
      summary,
      date_reported: new Date(date_reported),
      published: published ?? false,
      why_it_matters,
      rippling_effects,
      legal_actions: {
        create: legal_actions.map(la => ({
          title: la.title,
          status: la.status,
          description: la.description,
        })),
      },
      sources: {
        create: sources.map(s => ({
          url: s.url,
          title: s.title,
        })),
      },
      news_links: {
        create: news_links.map(nl => ({
          newsEventId: nl.newsEventId ?? null,
          external_url: nl.external_url ?? null,
          external_title: nl.external_title ?? null,
          external_source: nl.external_source ?? null,
          external_date: nl.external_date ? new Date(nl.external_date) : null,
        })),
      },
      bills: {
        connect: bill_ids.map((id: string) => ({ id })),
      },
      mpps: {
        connect: mpp_ids.map((id: string) => ({ id })),
      },
    },
  })

  return NextResponse.json(scandal, { status: 201 })
}
