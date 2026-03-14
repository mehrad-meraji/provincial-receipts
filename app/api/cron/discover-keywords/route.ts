import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { discoverKeywords } from '@/lib/ai/discover'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await discoverKeywords()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/discover-keywords]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
