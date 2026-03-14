import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeNews } from '@/lib/scraper/news'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeNews()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-news]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
