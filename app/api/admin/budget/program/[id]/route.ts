import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, amount } = body as { name?: string; amount?: string }

  const data: { name?: string; amount?: bigint } = {}
  if (name?.trim()) data.name = name.trim()
  if (amount !== undefined) {
    if (isNaN(Number(amount))) {
      return NextResponse.json({ error: 'amount must be a numeric string (millions)' }, { status: 400 })
    }
    data.amount = BigInt(Math.round(Number(amount))) * 100_000_000n
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const program = await prisma.budgetProgram.update({ where: { id }, data })
    return NextResponse.json({ ...program, amount: program.amount.toString() })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err.code === 'P2002') return NextResponse.json({ error: 'A program with that name already exists under this ministry.' }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await prisma.budgetProgram.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw err
  }
}
