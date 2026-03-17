import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const where = q.trim()
    ? { headline: { contains: q, mode: 'insensitive' as const } }
    : {}

  const news = await prisma.newsEvent.findMany({
    where,
    orderBy: { published_at: 'desc' },
    take: 20,
    select: {
      id: true,
      headline: true,
      url: true,
      source: true,
      published_at: true,
    },
  })

  return NextResponse.json({
    news: news.map(n => ({
      ...n,
      published_at: n.published_at.toISOString(),
    })),
  })
}
