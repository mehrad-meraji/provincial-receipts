import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const VALID_TAGS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other'] as const

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, tag, action } = body as { id?: string; tag?: string; action?: string }

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  if (action !== 'add' && action !== 'remove') {
    return NextResponse.json({ error: 'action must be add or remove' }, { status: 400 })
  }
  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'tag is required' }, { status: 400 })
  }
  if (action === 'add' && !VALID_TAGS.includes(tag as typeof VALID_TAGS[number])) {
    return NextResponse.json(
      { error: `tag must be one of: ${VALID_TAGS.join(', ')}` },
      { status: 400 }
    )
  }

  const bill = await prisma.bill.findUnique({ where: { id }, select: { tags: true } })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  if (action === 'add') {
    if (bill.tags.includes(tag)) {
      return NextResponse.json({ tags: bill.tags })
    }
    const updated = await prisma.bill.update({
      where: { id },
      data: { tags: [...bill.tags, tag] },
      select: { tags: true },
    })
    return NextResponse.json({ tags: updated.tags })
  }

  // remove
  if (!bill.tags.includes(tag)) {
    return NextResponse.json({ tags: bill.tags })
  }
  const updated = await prisma.bill.update({
    where: { id },
    data: { tags: bill.tags.filter(t => t !== tag) },
    select: { tags: true },
  })
  return NextResponse.json({ tags: updated.tags })
}
