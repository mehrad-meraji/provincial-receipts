import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ids, action } = body as { ids: unknown; action: unknown }

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 25) {
    return NextResponse.json({ error: 'ids must be a non-empty array of up to 25 items' }, { status: 400 })
  }
  if (!ids.every(id => typeof id === 'string')) {
    return NextResponse.json({ error: 'ids must be strings' }, { status: 400 })
  }
  if (action !== 'publish' && action !== 'unpublish' && action !== 'delete') {
    return NextResponse.json({ error: 'action must be publish, unpublish, or delete' }, { status: 400 })
  }

  if (action === 'delete') {
    const result = await prisma.person.deleteMany({ where: { id: { in: ids as string[] } } })
    return NextResponse.json({ count: result.count })
  }

  const result = await prisma.person.updateMany({
    where: { id: { in: ids as string[] } },
    data: { published: action === 'publish' },
  })

  return NextResponse.json({ count: result.count })
}
