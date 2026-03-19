import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: personId } = await params
  const body = await req.json() as {
    url: string
    title: string
    source_type: string
  }

  if (!body.url?.trim() || !body.title?.trim() || !body.source_type) {
    return NextResponse.json({ error: 'url, title, and source_type are required' }, { status: 400 })
  }

  const VALID_SOURCE_TYPES = ['Registry', 'News', 'Corporate', 'Court', 'FOI']
  if (!VALID_SOURCE_TYPES.includes(body.source_type)) {
    return NextResponse.json({ error: `source_type must be one of: ${VALID_SOURCE_TYPES.join(', ')}` }, { status: 400 })
  }

  try {
    const source = await prisma.personSource.create({
      data: {
        personId,
        url: body.url.trim(),
        title: body.title.trim(),
        source_type: body.source_type,
      },
    })
    return NextResponse.json(source, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'This source URL already exists for this person' }, { status: 409 })
    }
    throw err
  }
}
