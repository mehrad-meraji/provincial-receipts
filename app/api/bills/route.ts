import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const toronto_only = searchParams.get('toronto_only') === 'true'
  const status = searchParams.get('status') // optional filter
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const where: Record<string, unknown> = {}
  if (toronto_only) where.published = true
  if (status) where.status = status

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: [{ published: 'desc' }, { impact_score: 'desc' }, { date_introduced: 'desc' }],
      take: limit,
      skip: offset,
      include: { sponsor_mpp: true },
    }),
    prisma.bill.count({ where }),
  ])

  return NextResponse.json({ bills, total, limit, offset })
}
