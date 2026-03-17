import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const scandal = await prisma.scandal.findUnique({
    where: { id },
    include: {
      legal_actions: true,
      sources: true,
      news_links: {
        include: { news_event: true },
      },
      bills: {
        select: { id: true, bill_number: true, title: true },
      },
      mpps: {
        select: { id: true, name: true, party: true, riding: true },
      },
    },
  })

  if (!scandal) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(scandal)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const {
    title,
    tldr = '',
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
    tldr: string
    summary: string
    date_reported: string
    published: boolean
    why_it_matters: string
    rippling_effects: string
    legal_actions: { title: string; status: string; description: string; url?: string }[]
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

  const scandal = await prisma.$transaction(async tx => {
    // Delete and recreate children
    await tx.legalAction.deleteMany({ where: { scandalId: id } })
    await tx.scandalSource.deleteMany({ where: { scandalId: id } })
    await tx.scandalNewsLink.deleteMany({ where: { scandalId: id } })

    return tx.scandal.update({
      where: { id },
      data: {
        title,
        tldr,
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
            url: la.url || null,
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
          set: bill_ids.map((bid: string) => ({ id: bid })),
        },
        mpps: {
          set: mpp_ids.map((mid: string) => ({ id: mid })),
        },
      },
    })
  })

  return NextResponse.json(scandal)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.scandal.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
