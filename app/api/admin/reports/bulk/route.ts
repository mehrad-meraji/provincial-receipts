import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids, action } = await req.json() as { ids: string[]; action: 'dismiss' | 'resolve' }

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => typeof id === 'string')) {
    return NextResponse.json({ error: 'ids must be a non-empty array of strings' }, { status: 400 })
  }
  if (action !== 'dismiss' && action !== 'resolve') {
    return NextResponse.json({ error: 'action must be "dismiss" or "resolve"' }, { status: 400 })
  }

  const status = action === 'dismiss' ? 'dismissed' : 'resolved'

  const result = await prisma.report.updateMany({
    where: { id: { in: ids } },
    data: { status },
  })

  return NextResponse.json({ ok: true, count: result.count })
}
