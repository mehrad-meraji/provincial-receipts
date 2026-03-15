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

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  if (report.type === 'news') {
    const item = await prisma.newsEvent.findUnique({
      where: { id: report.targetId },
      select: { url: true, topic: true, is_scandal: true, hidden: true },
    })
    if (!item) return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    return NextResponse.json(item)
  }

  if (report.type === 'bill') {
    const item = await prisma.bill.findUnique({
      where: { id: report.targetId },
      select: { url: true, status: true, toronto_flagged: true },
    })
    if (!item) return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    return NextResponse.json(item)
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
}
