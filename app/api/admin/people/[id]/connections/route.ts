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
    scandalId: string
    connection_type: string
    description: string
  }

  if (!body.scandalId || !body.connection_type || !body.description?.trim()) {
    return NextResponse.json({ error: 'scandalId, connection_type, and description are required' }, { status: 400 })
  }

  const VALID_CONNECTION_TYPES = ['Lobbyist', 'Donor', 'Director', 'Beneficiary']
  if (!VALID_CONNECTION_TYPES.includes(body.connection_type)) {
    return NextResponse.json({ error: `connection_type must be one of: ${VALID_CONNECTION_TYPES.join(', ')}` }, { status: 400 })
  }

  try {
    const connection = await prisma.personConnection.create({
      data: {
        personId,
        scandalId: body.scandalId,
        connection_type: body.connection_type,
        description: body.description.trim(),
      },
      include: { scandal: { select: { id: true, title: true, slug: true } } },
    })
    return NextResponse.json(connection, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') return NextResponse.json({ error: 'This connection already exists' }, { status: 409 })
      if (err.code === 'P2003') return NextResponse.json({ error: 'Person or scandal not found' }, { status: 422 })
    }
    throw err
  }
}
