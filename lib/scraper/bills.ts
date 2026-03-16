// lib/scraper/bills.ts
//
// Scrapes Ontario Legislative Assembly (OLA) bills via HTML scraping (no official API).
// Processes ONE page per invocation (~20 bills) to stay within Vercel's 60s function
// timeout (target 45s). Uses ScrapeState singleton in DB to track pagination cursor.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { buildHeaders, checkRobotsTxt, delay, getCurrentParliament } from './utils'
import { scoreBill } from '@/lib/classifier/score'
import { loadTaxonomy } from '@/lib/classifier/keywords'
import { isBackedOff, setBackoff, clearBackoff } from './backoff'

const OLA_BASE = 'https://www.ola.org'
const OLA_BILLS_PATH_TEMPLATE =
  '/en/legislative-business/bills/{parliament}/session-1'

export interface BillScrapeResult {
  scraped: number     // bills processed
  upserted: number    // new or updated
  page: number        // page that was scraped
  resetCycle: boolean // true if pagination was reset
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface BillListRow {
  bill_number: string
  title: string
  url: string
  sponsor: string
  status: string
  date_introduced: Date | null
}

interface BillDetail {
  reading_stage: string | null
  vote_results: { yes: number; no: number; abstain: number } | null
  vote_by_party: {
    PC: number
    Liberal: number
    NDP: number
    Green: number
    Independent: number
  } | null
  scraperTags: string[]
}

// ---------------------------------------------------------------------------
// List-page scraper
// ---------------------------------------------------------------------------

async function fetchBillList(page: number, billsPath: string): Promise<BillListRow[]> {
  const url = `${OLA_BASE}${billsPath}?page=${page}`
  const { data } = await axios.get<string>(url, {
    headers: buildHeaders(),
    timeout: 20_000,
  })

  const $ = cheerio.load(data)
  const rows: BillListRow[] = []

  // TODO: verify selectors against live OLA HTML after first deployment
  $('table.views-table tbody tr').each((_i, el) => {
    try {
      const billNumberRaw = $(el)
        .find('td.views-field-field-bill-number')
        .text()
        .trim()
      const titleEl = $(el).find('td.views-field-field-short-title a')
      const titleText = titleEl.text().trim()
      const href = titleEl.attr('href') ?? ''
      const fullUrl = href.startsWith('http') ? href : `${OLA_BASE}${href}`
      const sponsor = $(el)
        .find('td.views-field-field-member-of-parliament')
        .text()
        .trim()
      const status = $(el)
        .find('td.views-field-field-bill-status')
        .text()
        .trim()
      const dateText = $(el)
        .find('td.views-field-field-date-introduced')
        .text()
        .trim()

      let date_introduced: Date | null = null
      if (dateText) {
        try {
          const parsed = new Date(dateText)
          if (!isNaN(parsed.getTime())) {
            date_introduced = parsed
          }
        } catch {
          // leave null if unparseable
        }
      }

      if (!billNumberRaw || !titleText) return // skip malformed rows

      rows.push({
        bill_number: billNumberRaw,
        title: titleText,
        url: fullUrl,
        sponsor,
        status,
        date_introduced,
      })
    } catch {
      // skip any row that throws — never crash the whole scrape
    }
  })

  return rows
}

// ---------------------------------------------------------------------------
// Detail-page scraper
// ---------------------------------------------------------------------------

async function fetchBillDetail(detailUrl: string): Promise<BillDetail> {
  const detail: BillDetail = {
    reading_stage: null,
    vote_results: null,
    vote_by_party: null,
    scraperTags: [],
  }

  try {
    const { data } = await axios.get<string>(detailUrl, {
      headers: buildHeaders(),
      timeout: 20_000,
    })

    const $ = cheerio.load(data)

    // TODO: verify selectors against live OLA HTML after first deployment

    // Reading stage
    const readingStageRaw = $(
      '.field--name-field-reading-stage .field__item'
    )
      .first()
      .text()
      .trim()
    if (readingStageRaw) {
      detail.reading_stage = readingStageRaw
      detail.scraperTags.push(readingStageRaw.toLowerCase())
    }

    // Vote results table
    const voteTable = $('.field--name-field-vote-results table')
    if (voteTable.length > 0) {
      // Attempt to parse "Yes", "No", "Abstain" columns from header + first data row
      const headers: string[] = []
      voteTable.find('thead th, thead td').each((_i, th) => {
        headers.push($(th).text().trim().toLowerCase())
      })

      const values: number[] = []
      voteTable.find('tbody tr').first().find('td').each((_i, td) => {
        const val = parseInt($(td).text().trim(), 10)
        values.push(isNaN(val) ? 0 : val)
      })

      const yesIdx = headers.findIndex((h) => h.includes('yes') || h === 'yea')
      const noIdx = headers.findIndex((h) => h.includes('no') || h === 'nay')
      const abstainIdx = headers.findIndex(
        (h) => h.includes('abstain') || h.includes('absent')
      )

      if (values.length > 0) {
        detail.vote_results = {
          yes: yesIdx >= 0 ? (values[yesIdx] ?? 0) : 0,
          no: noIdx >= 0 ? (values[noIdx] ?? 0) : 0,
          abstain: abstainIdx >= 0 ? (values[abstainIdx] ?? 0) : 0,
        }
      }

      // Party breakdown — look for a second table or additional rows in the same table
      const partyBreakdown: BillDetail['vote_by_party'] = {
        PC: 0,
        Liberal: 0,
        NDP: 0,
        Green: 0,
        Independent: 0,
      }
      let foundParty = false

      voteTable.find('tbody tr').each((_i, row) => {
        const cells = $(row).find('td')
        if (cells.length < 2) return
        const partyName = $(cells[0]).text().trim()
        const voteCount = parseInt($(cells[1]).text().trim(), 10)
        if (isNaN(voteCount)) return

        if (/\bpc\b|progressive conservative/i.test(partyName)) {
          partyBreakdown.PC = voteCount
          foundParty = true
        } else if (/liberal/i.test(partyName)) {
          partyBreakdown.Liberal = voteCount
          foundParty = true
        } else if (/ndp|new democrat/i.test(partyName)) {
          partyBreakdown.NDP = voteCount
          foundParty = true
        } else if (/green/i.test(partyName)) {
          partyBreakdown.Green = voteCount
          foundParty = true
        } else if (/independent/i.test(partyName)) {
          partyBreakdown.Independent = voteCount
          foundParty = true
        }
      })

      if (foundParty) {
        detail.vote_by_party = partyBreakdown
      }
    }

    // Collect any committee or other textual keywords as scraperTags
    const committeeText = $('.field--name-field-committee').text().trim()
    if (committeeText) {
      detail.scraperTags.push(
        ...committeeText
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((t) => t.length > 3)
      )
    }

    // Bill description/summary — provides the richest source of keywords
    const descriptionText = (
      $('.field--name-body .field__item').first().text() ||
      $('.field--name-field-description .field__item').first().text() ||
      $('.view-bill-detail .field__item').first().text()
    ).trim()
    if (descriptionText) {
      // Use the raw description as one long tag string for keyword matching
      detail.scraperTags.push(descriptionText.toLowerCase().slice(0, 2000))
    }
  } catch {
    // Return whatever partial detail was collected — never throw
  }

  return detail
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scrapeBillsPage(): Promise<BillScrapeResult> {
  if (await isBackedOff('ola-bills')) {
    console.warn('[scraper/bills] backed off, skipping')
    return { scraped: 0, upserted: 0, page: 0, resetCycle: false }
  }

  // Detect current parliament dynamically
  const parliament = await getCurrentParliament()
  const billsPath = OLA_BILLS_PATH_TEMPLATE.replace('{parliament}', parliament)

  // Check robots.txt before any scraping
  const allowed = await checkRobotsTxt(OLA_BASE, billsPath)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${billsPath}`)
  }

  // Load taxonomy once for the entire batch
  const taxonomy = await loadTaxonomy()

  // Get or create the ScrapeState singleton
  const state = await prisma.scrapeState.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', last_bill_page: 0 },
  })
  const page = state.last_bill_page + 1 // next page to scrape

  // Fetch list page
  let rows: BillListRow[]
  try {
    rows = await fetchBillList(page, billsPath)
    await clearBackoff('ola-bills')
  } catch (err) {
    if ((err as any)?.response?.status === 429) {
      await setBackoff('ola-bills', String(err))
    }
    throw err
  }

  // Handle end-of-pagination: reset cycle
  if (rows.length === 0) {
    await prisma.scrapeState.update({
      where: { id: 'singleton' },
      data: { last_bill_page: 0, last_scraped_at: new Date() },
    })
    return { scraped: 0, upserted: 0, page, resetCycle: true }
  }

  let upserted = 0

  let firstBill = true
  for (const row of rows) {
    try {
      // Polite delay between detail fetches (skip before the first bill)
      if (!firstBill) {
        await delay(1000)
      }
      firstBill = false

      // Fetch detail page
      const detail = await fetchBillDetail(row.url)

      // Score the bill before the upsert so all data lands in one atomic write
      const scoreResult = scoreBill(
        {
          title: row.title,
          sponsor: row.sponsor,
          scraperTags: detail.scraperTags,
        },
        taxonomy
      )

      // Try to find the sponsor MPP for party affiliation linking
      let sponsorMppId: string | undefined
      if (row.sponsor) {
        try {
          const mpp = await prisma.mPP.findFirst({
            where: { name: { equals: row.sponsor, mode: 'insensitive' } },
            select: { id: true },
          })
          if (mpp) sponsorMppId = mpp.id
        } catch {
          // non-critical — bill still upserted without the link
        }
      }

      // Upsert bill (keyed on bill_number) with score included
      await prisma.bill.upsert({
        where: { bill_number: row.bill_number },
        create: {
          bill_number: row.bill_number,
          title: row.title,
          sponsor: row.sponsor,
          status: row.status,
          date_introduced: row.date_introduced ?? undefined,
          reading_stage: detail.reading_stage ?? undefined,
          vote_results: detail.vote_results ?? undefined,
          vote_by_party: detail.vote_by_party ?? undefined,
          url: row.url,
          last_scraped: new Date(),
          tags: scoreResult.tags,
          impact_score: scoreResult.impact_score,
          toronto_flagged: scoreResult.toronto_flagged,
          ...(scoreResult.toronto_flagged ? { published: true } : {}),
          sponsorMppId,
        },
        update: {
          title: row.title,
          sponsor: row.sponsor,
          status: row.status,
          date_introduced: row.date_introduced ?? undefined,
          reading_stage: detail.reading_stage ?? undefined,
          vote_results: detail.vote_results ?? undefined,
          vote_by_party: detail.vote_by_party ?? undefined,
          url: row.url,
          last_scraped: new Date(),
          tags: scoreResult.tags,
          impact_score: scoreResult.impact_score,
          toronto_flagged: scoreResult.toronto_flagged,
          ...(sponsorMppId ? { sponsorMppId } : {}),
        },
      })

      upserted++
    } catch (err) {
      if ((err as any)?.response?.status === 429) {
        await setBackoff('ola-bills', String(err))
        break
      }
      console.warn(
        `[scraper] Failed to process bill ${row.bill_number}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // Advance the cursor
  await prisma.scrapeState.update({
    where: { id: 'singleton' },
    data: { last_bill_page: page, last_scraped_at: new Date() },
  })

  return {
    scraped: rows.length,
    upserted,
    page,
    resetCycle: false,
  }
}
