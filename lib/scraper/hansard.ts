// lib/scraper/hansard.ts
//
// Scrapes Ontario Legislature Hansard (debate transcripts) for mentions of
// Toronto-relevant topics from our keyword taxonomy. Returns enrichment data
// (keyword hits, bill number mentions) that can be used to tag related bills.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { buildHeaders, checkRobotsTxt, getCurrentParliament } from './utils'
import { STATIC_KEYWORDS } from '@/lib/classifier/keywords'
import { isBackedOff, setBackoff, clearBackoff } from './backoff'

const OLA_BASE = 'https://www.ola.org'
const OLA_HANSARD_PATH_TEMPLATE =
  '/en/legislative-business/house-documents/{parliament}/session-1'

const MAX_DOCUMENTS = 5

export interface HansardEntry {
  date: string
  url: string
  keywords_found: string[]
  bill_numbers_mentioned: string[] // "Bill 97" format
}

export interface HansardScrapeResult {
  entries: HansardEntry[]
}

// ---------------------------------------------------------------------------
// Flatten all keyword terms from the static taxonomy
// ---------------------------------------------------------------------------

function getAllKeywordTerms(): string[] {
  const terms: string[] = []
  for (const tier of Object.values(STATIC_KEYWORDS)) {
    terms.push(...tier.terms)
  }
  return terms
}

// ---------------------------------------------------------------------------
// List-page scraper — returns up to MAX_DOCUMENTS document links
// ---------------------------------------------------------------------------

interface HansardLink {
  date: string
  url: string
}

async function fetchHansardLinks(): Promise<HansardLink[]> {
  const parliament = await getCurrentParliament()
  const hansardPath = OLA_HANSARD_PATH_TEMPLATE.replace('{parliament}', parliament)
  const listUrl = `${OLA_BASE}${hansardPath}`
  const { data } = await axios.get<string>(listUrl, {
    headers: buildHeaders(),
    timeout: 20_000,
  })

  const $ = cheerio.load(data)
  const links: HansardLink[] = []

  // Parse date-based hansard links: /parliament-44/session-1/YYYY-MM-DD/hansard
  $('a[href*="/hansard"]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    const dateText = $(el).find('time').attr('datetime')?.split('T')[0] ?? ''

    if (!href || !href.includes('/hansard') || !dateText) return

    const fullUrl = href.startsWith('http') ? href : `${OLA_BASE}${href}`
    links.push({ date: dateText, url: fullUrl })
  })

  // Return the most recent MAX_DOCUMENTS entries
  return links.slice(0, MAX_DOCUMENTS)
}

// ---------------------------------------------------------------------------
// Document scraper — extract keyword matches and bill number mentions
// ---------------------------------------------------------------------------

async function fetchHansardDocument(
  link: HansardLink,
  keywordTerms: string[]
): Promise<HansardEntry> {
  const { data } = await axios.get<string>(link.url, {
    headers: buildHeaders(),
    timeout: 30_000,
  })

  const $ = cheerio.load(data)
  const bodyText = $('body').text()

  // Find keyword matches (case-insensitive, deduplicated)
  const keywordsFound = new Set<string>()
  for (const term of keywordTerms) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(bodyText)) {
      keywordsFound.add(term)
    }
  }

  // Extract bill number mentions ("Bill 97" format)
  const billMatches = bodyText.match(/Bill\s+\d+/gi) ?? []
  const billNumbersFound = [...new Set(
    billMatches.map((m) => {
      const num = m.match(/\d+/)?.[0] ?? ''
      return `Bill ${num}`
    })
  )]

  return {
    date: link.date,
    url: link.url,
    keywords_found: [...keywordsFound],
    bill_numbers_mentioned: billNumbersFound,
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scrapeHansard(): Promise<HansardScrapeResult> {
  if (await isBackedOff('ola-hansard')) {
    console.warn('[scraper/hansard] backed off, skipping')
    return { entries: [] }
  }

  const parliament = await getCurrentParliament()
  const hansardPath = OLA_HANSARD_PATH_TEMPLATE.replace('{parliament}', parliament)

  const allowed = await checkRobotsTxt(OLA_BASE, hansardPath)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${hansardPath}`)
  }

  let links: HansardLink[]
  try {
    links = await fetchHansardLinks()
    await clearBackoff('ola-hansard')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-hansard', String(err))
    }
    throw err
  }

  const keywordTerms = getAllKeywordTerms()

  // Fetch all documents concurrently (only 5 max, very manageable)
  const results = await Promise.allSettled(
    links.map(link => fetchHansardDocument(link, keywordTerms))
  )

  const entries: HansardEntry[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      entries.push(result.value)
    } else {
      const err = result.reason
      if ((err as any)?.response?.status === 429) {
        await setBackoff('ola-hansard', String(err))
        break
      }
      console.warn(
        `[scraper/hansard] Failed to fetch document: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return { entries }
}
