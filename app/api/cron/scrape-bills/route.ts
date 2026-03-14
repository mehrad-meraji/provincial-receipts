import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth, unauthorizedResponse } from '@/lib/cron-auth'
import { scrapeBillsPage } from '@/lib/scraper/bills'

export const maxDuration = 60  // Vercel Pro: 60s timeout

export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) return unauthorizedResponse()

  try {
    const result = await scrapeBillsPage()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/scrape-bills]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
