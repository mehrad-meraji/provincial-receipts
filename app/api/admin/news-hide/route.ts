import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, hidden } = body as { id: string; hidden: boolean }

  if (!id || typeof hidden !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await prisma.newsEvent.update({
    where: { id },
    data: { hidden },
  })

  return NextResponse.json({ ok: true })
}
