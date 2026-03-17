import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ministryId, name, amount } = body as { ministryId?: string; name?: string; amount?: string }

  if (!ministryId) return NextResponse.json({ error: 'ministryId is required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
  }

  const amountCents = BigInt(Math.round(Number(amount))) * 100_000_000n

  try {
    const program = await prisma.budgetProgram.create({
      data: {
        ministryId,
        name: name.trim(),
        amount: amountCents,
        sort_order: 9999,
      },
    })
    return NextResponse.json(
      { ...program, amount: program.amount.toString() },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') return NextResponse.json({ error: 'Ministry not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'A program with that name already exists under this ministry.' }, { status: 409 })
    }
    throw err
  }
}
