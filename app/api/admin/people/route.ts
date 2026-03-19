import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Confidence } from '@prisma/client'

function slugify(name: string): string {
  return name
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
  const q = searchParams.get('q') ?? ''

  const people = await prisma.person.findMany({
    where: q.trim() ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { connections: true, sources: true } },
    },
  })

  return NextResponse.json(people)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    name: string
    slug?: string
    bio?: string
    photo_filename?: string
    organization?: string
    organization_url?: string
    confidence: string
    published?: boolean
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const validConfidence = Object.values(Confidence)
  if (!validConfidence.includes(body.confidence as Confidence)) {
    return NextResponse.json({ error: `confidence must be one of: ${validConfidence.join(', ')}` }, { status: 400 })
  }

  const slug = body.slug?.trim() || slugify(body.name.trim())

  const person = await prisma.person.create({
    data: {
      name: body.name.trim(),
      slug,
      bio: body.bio?.trim() || null,
      photo_filename: body.photo_filename?.trim() || null,
      organization: body.organization?.trim() || null,
      organization_url: body.organization_url?.trim() || null,
      confidence: body.confidence as Confidence,
      published: body.published ?? false,
    },
  })

  return NextResponse.json(person, { status: 201 })
}
