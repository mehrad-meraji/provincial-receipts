import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const filter = searchParams.get('filter') ?? 'all'
  const q = searchParams.get('q') ?? ''

  // Build where clause
  const where: Prisma.BillWhereInput = {}

  if (filter === 'published') where.published = true
  else if (filter === 'toronto') where.toronto_flagged = true
  else if (filter === 'unpublished') where.published = false
  // 'all' or unrecognised: no filter

  if (q.trim()) {
    where.OR = [
      { bill_number: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      orderBy: [{ date_introduced: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        bill_number: true,
        title: true,
        tags: true,
        toronto_flagged: true,
        published: true,
        date_introduced: true,
      },
    }),
    prisma.bill.count({ where }),
  ])

  return NextResponse.json({
    bills: bills.map(b => ({
      ...b,
      date_introduced: b.date_introduced?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  })
}
