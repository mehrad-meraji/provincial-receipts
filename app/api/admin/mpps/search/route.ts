import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const where = q.trim()
    ? { name: { contains: q, mode: 'insensitive' as const } }
    : {}

  const mpps = await prisma.mPP.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 20,
    select: {
      id: true,
      name: true,
      party: true,
      riding: true,
    },
  })

  return NextResponse.json({ mpps })
}
