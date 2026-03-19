import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

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

  const source = await prisma.personSource.create({
    data: {
      personId,
      url: body.url.trim(),
      title: body.title.trim(),
      source_type: body.source_type,
    },
  })

  return NextResponse.json(source, { status: 201 })
}
