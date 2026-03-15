import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''

  if (!q.trim()) {
    return NextResponse.json([])
  }

  const bills = await prisma.bill.findMany({
    where: {
      toronto_flagged: false,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { sponsor: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, bill_number: true, title: true, sponsor: true, status: true },
    take: 20,
  })

  return NextResponse.json(bills)
}
