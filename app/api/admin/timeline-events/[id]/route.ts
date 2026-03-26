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
  const event = await prisma.timelineEvent.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as Partial<{
    date: string
    label: string
    description: string | null
    url: string | null
    icon: string | null
    type: string
    published: boolean
  }>

  const event = await prisma.timelineEvent.update({
    where: { id },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.label !== undefined && { label: body.label.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.url !== undefined && { url: body.url?.trim() || null }),
      ...(body.icon !== undefined && { icon: body.icon?.trim() || null }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.published !== undefined && { published: body.published }),
    },
  })

  return NextResponse.json({
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.timelineEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
