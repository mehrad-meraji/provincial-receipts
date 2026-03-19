import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string; sourceId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sourceId } = await params
  await prisma.personSource.delete({ where: { id: sourceId } })
  return NextResponse.json({ ok: true })
}
