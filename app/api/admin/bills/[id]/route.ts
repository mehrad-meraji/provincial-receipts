import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const bill = await prisma.bill.findUnique({
    where: { id },
    select: {
      id: true,
      bill_number: true,
      title: true,
      tags: true,
      toronto_flagged: true,
      published: true,
      date_introduced: true,
    },
  })

  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...bill,
    date_introduced: bill.date_introduced?.toISOString() ?? null,
  })
}
