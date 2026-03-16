import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const report = await prisma.report.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const body = await req.json()

  // Update underlying item
  try {
    if (report.type === 'news') {
      const { url, topic, is_scandal, hidden } = body as {
        url?: string
        topic?: string
        is_scandal?: boolean
        hidden?: boolean
      }
      const data: Record<string, unknown> = {}
      if (url !== undefined) data.url = url
      if (topic !== undefined) data.topic = topic
      if (is_scandal !== undefined) data.is_scandal = is_scandal
      if (hidden !== undefined) data.hidden = hidden

      if (Object.keys(data).length > 0) {
        await prisma.newsEvent.update({ where: { id: report.targetId }, data })
      }
    } else if (report.type === 'bill') {
      const { url, status: billStatus } = body as {
        url?: string
        status?: string
      }
      const data: Record<string, unknown> = {}
      if (url !== undefined) data.url = url
      if (billStatus !== undefined) data.status = billStatus

      if (Object.keys(data).length > 0) {
        await prisma.bill.update({ where: { id: report.targetId }, data })
      }
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        // Unique constraint (e.g. duplicate URL) — do NOT resolve the report
        return NextResponse.json(
          { error: 'That URL is already used by another news item' },
          { status: 409 }
        )
      }
      if (err.code === 'P2025') {
        // Target item no longer exists — still resolve the report
        await prisma.report.update({ where: { id }, data: { status: 'resolved' } })
        return NextResponse.json({ ok: true, warning: 'target item no longer exists' })
      }
    }
    throw err
  }

  await prisma.report.update({ where: { id }, data: { status: 'resolved' } })
  return NextResponse.json({ ok: true })
}
