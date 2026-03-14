import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeMpps } from '@/lib/scraper/mpps'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeMpps()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-mpps]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
