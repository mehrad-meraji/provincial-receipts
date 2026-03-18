import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const publishedParam = searchParams.get('published') ?? 'all'

  const where =
    publishedParam === 'true'
      ? { published: true }
      : publishedParam === 'false'
        ? { published: false }
        : {}

  const events = await prisma.timelineEvent.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    events.map(e => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))
  )
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    date: string
    label: string
    description?: string
    url?: string
    icon?: string
    type?: string
    published?: boolean
  }

  if (!body.date || !body.label) {
    return NextResponse.json({ error: 'date and label are required' }, { status: 400 })
  }

  const event = await prisma.timelineEvent.create({
    data: {
      date: new Date(body.date),
      label: body.label.trim(),
      description: body.description?.trim() ?? null,
      url: body.url?.trim() || null,
      icon: body.icon?.trim() || null,
      type: body.type ?? 'news',
      published: body.published ?? false,
    },
  })

  return NextResponse.json({
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }, { status: 201 })
}
