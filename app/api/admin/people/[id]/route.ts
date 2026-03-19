import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Confidence, Prisma } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      connections: {
        orderBy: { createdAt: 'asc' },
        include: { scandal: { select: { id: true, title: true, slug: true } } },
      },
      sources: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(person)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as Partial<{
    name: string
    slug: string
    bio: string | null
    photo_filename: string | null
    organization: string | null
    organization_url: string | null
    confidence: string
    published: boolean
  }>

  if (body.confidence) {
    const valid = Object.values(Confidence)
    if (!valid.includes(body.confidence as Confidence)) {
      return NextResponse.json({ error: 'Invalid confidence value' }, { status: 400 })
    }
  }

  if (body.name !== undefined && !body.name.trim()) {
    return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
  }
  if (body.slug !== undefined && !body.slug.trim()) {
    return NextResponse.json({ error: 'slug cannot be empty' }, { status: 400 })
  }

  try {
    const person = await prisma.person.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.slug !== undefined && { slug: body.slug.trim() }),
        ...(body.bio !== undefined && { bio: body.bio?.trim() || null }),
        ...(body.photo_filename !== undefined && { photo_filename: body.photo_filename?.trim() || null }),
        ...(body.organization !== undefined && { organization: body.organization?.trim() || null }),
        ...(body.organization_url !== undefined && { organization_url: body.organization_url?.trim() || null }),
        ...(body.confidence !== undefined && { confidence: body.confidence as Confidence }),
        ...(body.published !== undefined && { published: body.published }),
      },
    })
    return NextResponse.json(person)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.person.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}
