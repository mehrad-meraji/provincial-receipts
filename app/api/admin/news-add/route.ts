import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { headline, url, source, is_scandal } = body as {
    headline?: string
    url?: string
    source?: string
    is_scandal?: unknown
  }

  if (!headline || !url || !source) {
    return NextResponse.json({ error: 'headline, url, and source are required' }, { status: 400 })
  }

  if (typeof is_scandal !== 'boolean') {
    return NextResponse.json({ error: 'is_scandal must be a boolean' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const created = await prisma.newsEvent.create({
      data: {
        headline,
        url,
        source,
        is_scandal,
        published_at: new Date(),
        hidden: false,
        tags: [],
        scandal_review_status: is_scandal ? 'confirmed' : null,
      },
      select: {
        id: true,
        headline: true,
        url: true,
        source: true,
        published_at: true,
        hidden: true,
        is_scandal: true,
      },
    })
    return NextResponse.json(created)
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'This URL already exists in the feed.' }, { status: 409 })
    }
    throw err
  }
}
