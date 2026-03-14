import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeHansard } from '@/lib/scraper/hansard'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeHansard()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-hansard]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
