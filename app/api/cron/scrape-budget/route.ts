import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeBudget } from '@/lib/scraper/budget'

// Requires Vercel Pro — pass-2 issues ~29 HTTP requests with 800ms delays
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeBudget()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-budget]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
