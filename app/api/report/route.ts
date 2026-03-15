import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateReportInput } from '@/lib/report/validate'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 1. Validate input
  const validationError = validateReportInput(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { type, targetId, targetTitle, categories, comment, turnstileToken } =
    body as {
      type: string
      targetId: string
      targetTitle: string
      categories: string[]
      comment?: string
      turnstileToken: string
    }

  // 2. Verify Turnstile
  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    }
  )
  const verifyData = await verifyRes.json()
  if (verifyData.success !== true) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 })
  }

  // 3. Extract IP from Vercel-set header
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  // 4. Per-IP rate limit: max 5 reports per hour
  if (ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.report.count({
      where: { ip, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 5) {
      return NextResponse.json({ error: 'Too many reports' }, { status: 429 })
    }
  }

  // 5. Insert
  await prisma.report.create({
    data: { type, targetId, targetTitle, categories, comment, status: 'pending', ip },
  })

  return NextResponse.json({ ok: true })
}
