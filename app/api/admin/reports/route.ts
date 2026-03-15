import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reports = await prisma.report.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      type: true,
      targetId: true,
      targetTitle: true,
      categories: true,
      comment: true,
      status: true,
      createdAt: true,
      // ip intentionally omitted
    },
  })

  return NextResponse.json(
    reports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))
  )
}
