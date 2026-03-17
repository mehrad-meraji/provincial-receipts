import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, amount } = body as { name?: string; amount?: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
  }

  // Get the latest snapshot
  const snapshot = await prisma.budgetSnapshot.findFirst({ orderBy: { fiscal_year: 'desc' } })
  if (!snapshot) {
    return NextResponse.json({ error: 'No budget snapshot found. Run the scraper first.' }, { status: 404 })
  }

  // Convert millions → bigint cents: 1M = 100_000_000 cents
  const amountCents = BigInt(Math.round(Number(amount))) * 100_000_000n

  try {
    const ministry = await prisma.budgetMinistry.create({
      data: {
        snapshotId: snapshot.id,
        name: name.trim(),
        amount: amountCents,
        sort_order: 9999,
      },
    })
    return NextResponse.json(
      { ...ministry, amount: ministry.amount.toString() },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'A ministry with that name already exists.' }, { status: 409 })
    }
    throw err
  }
}
