import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string; connectionId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId } = await params
  await prisma.personConnection.delete({ where: { id: connectionId } })
  return NextResponse.json({ ok: true })
}
