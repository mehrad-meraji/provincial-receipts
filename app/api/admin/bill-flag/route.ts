import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, action } = body as { id: string; action: 'add' | 'remove' }

  if (!id || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await prisma.bill.update({
    where: { id },
    data: { toronto_flagged: action === 'add' },
  })

  return NextResponse.json({ ok: true })
}
