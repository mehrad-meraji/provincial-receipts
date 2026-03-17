// lib/scraper/mpps.ts
//
// Scrapes the Ontario Legislative Assembly MPP roster page and upserts records
// into the MPP table. Fetches each detail page to pick up email addresses.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { buildHeaders, checkRobotsTxt, delay } from './utils'
import { isBackedOff, setBackoff, clearBackoff } from './backoff'

const OLA_BASE = 'https://www.ola.org'
const OLA_MPPS_PATH = '/en/members/current'

const DETAIL_CONCURRENCY = 5

const TORONTO_KEYWORDS = [
  'Toronto',
  'Scarborough',
  'Etobicoke',
  'York',
  'Don Valley',
  'Willowdale',
  'Eglinton',
]

export interface MppScrapeResult {
  scraped: number
  upserted: number
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface MppListRow {
  name: string
  url: string
  riding: string
  party: string
}

// ---------------------------------------------------------------------------
// List-page scraper
// ---------------------------------------------------------------------------

async function fetchMppList(): Promise<MppListRow[]> {
  const url = `${OLA_BASE}${OLA_MPPS_PATH}`
  const { data } = await axios.get<string>(url, {
    headers: buildHeaders(),
    timeout: 20_000,
  })

  const $ = cheerio.load(data)
  const rows: MppListRow[] = []

  $('.member-list-row').each((_i, el) => {
    try {
      const titleEl = $(el).find('h3')
      const name = titleEl.text().trim()
      const href = $(el).find('a.mpp-card-link').attr('href') ?? ''
      const fullUrl = href.startsWith('http') ? href : `${OLA_BASE}${href}`
      const riding = $(el).find('.current-members-riding').text().trim()
      const party = $(el).find('.current-members-party').text().trim()

      if (!name || !href) return // skip malformed rows

      rows.push({ name, url: fullUrl, riding, party })
    } catch {
      // skip any row that throws — never crash the whole scrape
    }
  })

  return rows
}

// ---------------------------------------------------------------------------
// Detail-page scraper
// ---------------------------------------------------------------------------

async function fetchMppEmail(detailUrl: string): Promise<string | null> {
  try {
    const { data } = await axios.get<string>(detailUrl, {
      headers: buildHeaders(),
      timeout: 20_000,
    })

    const $ = cheerio.load(data)

    const emailEl = $('.field--name-field-email a')
    const email = emailEl.attr('href')?.replace(/^mailto:/i, '').trim()
    return (email ?? emailEl.text().trim()) || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scrapeMpps(): Promise<MppScrapeResult> {
  if (await isBackedOff('ola-mpps')) {
    console.warn('[scraper/mpps] backed off, skipping')
    return { scraped: 0, upserted: 0 }
  }

  const allowed = await checkRobotsTxt(OLA_BASE, OLA_MPPS_PATH)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${OLA_MPPS_PATH}`)
  }

  let rows: MppListRow[]
  try {
    rows = await fetchMppList()
    await clearBackoff('ola-mpps')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-mpps', String(err))
    }
    throw err
  }

  let upserted = 0
  let rateLimited = false

  async function processMpp(row: MppListRow): Promise<boolean> {
    const email = await fetchMppEmail(row.url)

    const toronto_area = TORONTO_KEYWORDS.some((keyword) =>
      row.riding.includes(keyword)
    )

    await prisma.mPP.upsert({
      where: { name_riding: { name: row.name, riding: row.riding } },
      create: {
        name: row.name,
        party: row.party,
        riding: row.riding,
        email: email ?? undefined,
        url: row.url,
        toronto_area,
      },
      update: {
        party: row.party,
        email: email ?? undefined,
        url: row.url,
        toronto_area,
      },
    })

    return true
  }

  for (let i = 0; i < rows.length; i += DETAIL_CONCURRENCY) {
    if (rateLimited) break
    if (i > 0) await delay(300) // polite delay between batches

    const batch = rows.slice(i, i + DETAIL_CONCURRENCY)
    const results = await Promise.allSettled(batch.map(row => processMpp(row)))

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled') {
        upserted++
      } else {
        const err = result.reason
        if ((err as any)?.response?.status === 429) {
          await setBackoff('ola-mpps', String(err))
          rateLimited = true
          break
        }
        console.warn(
          `[scraper/mpps] Failed to process MPP ${batch[j].name}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }
  }

  return {
    scraped: rows.length,
    upserted,
  }
}
