// lib/scraper/hansard.ts
//
// Scrapes Ontario Legislature Hansard (debate transcripts) for mentions of
// Toronto-relevant topics from our keyword taxonomy. Returns enrichment data
// (keyword hits, bill number mentions) that can be used to tag related bills.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { buildHeaders, checkRobotsTxt, delay } from './utils'
import { STATIC_KEYWORDS } from '@/lib/classifier/keywords'

const OLA_BASE = 'https://www.ola.org'
const OLA_HANSARD_PATH =
  '/en/legislative-business/house-documents/parliament-43/session-1/hansard'

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
  const listUrl = `${OLA_BASE}${OLA_HANSARD_PATH}`
  const { data } = await axios.get<string>(listUrl, {
    headers: buildHeaders(),
    timeout: 20_000,
  })

  const $ = cheerio.load(data)
  const links: HansardLink[] = []

  // TODO: verify selectors against live OLA HTML after first deployment
  $('.views-table tbody tr td a').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    const dateText = $(el).text().trim()
    if (!href) return
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
  // Extract all visible text from the document body
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
      // Normalise to "Bill N" with a single space
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
  // Check robots.txt before any scraping
  const allowed = await checkRobotsTxt(OLA_BASE, OLA_HANSARD_PATH)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${OLA_HANSARD_PATH}`)
  }

  const links = await fetchHansardLinks()
  const keywordTerms = getAllKeywordTerms()
  const entries: HansardEntry[] = []

  let firstDoc = true

  for (const link of links) {
    // Polite delay between document fetches (skip before the first document)
    if (!firstDoc) {
      await delay(1000)
    }
    firstDoc = false

    try {
      const entry = await fetchHansardDocument(link, keywordTerms)
      entries.push(entry)
    } catch (err) {
      console.warn(
        `[scraper/hansard] Failed to fetch document ${link.url}: ${err instanceof Error ? err.message : String(err)}`
      )
      // skip on error — never crash the whole scrape
    }
  }

  return { entries }
}
