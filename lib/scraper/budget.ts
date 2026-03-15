// lib/scraper/budget.ts
//
// Scrapes the Ontario provincial budget from two public HTML sources:
//   Pass 1: budget.ontario.ca/2025/chapter-3.html  — fiscal summary + ministry totals
//   Pass 2: ontario.ca expenditure estimates TOC    — sub-program detail per ministry
//
// NOTE: HTML selectors are best-effort based on the 2025 budget page structure.
// Verify selectors after each annual budget release and update BUDGET_YEAR below.

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '@/lib/db'
import { buildHeaders, checkRobotsTxt, delay } from './utils'

// ─── Constants ──────────────────────────────────────────────────────────────

const BUDGET_YEAR = '2025-26'
const BUDGET_SUMMARY_URL = 'https://budget.ontario.ca/2025/chapter-3.html'
const ESTIMATES_TOC_URL =
  'https://www.ontario.ca/page/expenditure-estimates-volume-1-table-contents-2025-26'
const ESTIMATES_BASE_URL = 'https://www.ontario.ca'
const FETCH_DELAY_MS = 800

// ─── Public result type ──────────────────────────────────────────────────────

export interface BudgetScrapeResult {
  fiscal_year: string
  ministries_scraped: number
  programs_scraped: number
  match_rate: number // 0–1: fraction of pass-1 ministries matched in pass-2
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface SummaryResult {
  total_revenue: bigint
  total_expense: bigint
  deficit: bigint
  ministries: Array<{ name: string; amount: bigint }>
}

interface ProgramRow {
  name: string
  amount: bigint
}

// ─── Dollar-string parser ────────────────────────────────────────────────────

/**
 * Parse an Ontario budget dollar string into bigint cents.
 * Handles formats: "$218.0", "$91.1", "($14.6)", "218,000" (millions in tables).
 * The chapter-3 table uses billions (e.g. "$91.1" = $91.1B).
 * The per-ministry tables use millions (e.g. "$60,310" = $60,310M).
 */
function parseDollarString(raw: string, unit: 'billions' | 'millions'): bigint {
  const negative = raw.includes('(')
  const cleaned = raw.replace(/[$(),\s]/g, '')
  if (!cleaned || cleaned === '') throw new Error(`Cannot parse dollar string: "${raw}"`)

  // Split on decimal point to avoid float arithmetic
  const [intPart, fracPart = ''] = cleaned.split('.')
  const intVal = BigInt(intPart || '0')
  // Pad/truncate fractional part to 1 decimal digit (budget figures use 1dp)
  const fracDigit = fracPart.length > 0 ? BigInt(fracPart[0]) : 0n

  // Unit multipliers in cents:
  //   billions:  1B dollars = 100_000_000_000 cents; 0.1B = 10_000_000_000 cents
  //   millions:  1M dollars = 100_000_000 cents; treat comma-separated integers as whole millions
  let cents: bigint
  if (unit === 'billions') {
    cents = intVal * 100_000_000_000n + fracDigit * 10_000_000_000n
  } else {
    // millions: amounts are whole numbers like "60,310" (no decimal expected, but handle just in case)
    cents = intVal * 100_000_000n + fracDigit * 10_000_000n
  }

  return negative ? -cents : cents
}

// ─── Exported parse functions (pure — accept HTML, return data) ──────────────

/**
 * Normalise a ministry name for fuzzy matching between pass-1 and pass-2 sources.
 * e.g. "Ministry of Health" → "health", "Health Sector" → "health sector"
 */
export function normaliseMinistryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^ministry of the\s+/i, '')
    .replace(/^ministry of\s+/i, '')
    .replace(/&/g, 'and')
    .replace(/[,\.]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseBudgetSummary(html: string): SummaryResult {
  const $ = cheerio.load(html)
  
  const fiscalValues = new Map<string, bigint>()
  const ministryMap = new Map<string, { name: string; amount: bigint }>()

  // Helper to find the column index for BUDGET_YEAR in a table
  function findYearColumnIndex(table: any): number {
    let colIndex = -1
    // Target the first row (headers) to avoid counting labels in data rows
    $(table).find('tr').first().find('th, td').each((idx: number, el: any) => {
      const text = $(el).text().replace(/–/g, '-').replace(/\s+/g, '')
      if (text.includes(BUDGET_YEAR)) {
        colIndex = idx
      }
    })
    return colIndex
  }

  // Helper to determine the unit of a table based on its text
  function getTableUnit(table: any): 'billions' | 'millions' {
    const text = $(table).text().toLowerCase()
    return text.includes('billions') ? 'billions' : 'millions'
  }

  // 1. First pass: find fiscal summary items (Revenue, Expense) from any table
  $('table').each((_i, table) => {
    const colIndex = findYearColumnIndex(table)
    if (colIndex === -1) return

    const unit = getTableUnit(table)

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('th, td')
      if (cells.length <= colIndex) return

      const label = $(cells[0]).text().trim().toLowerCase()
      const valueText = $(cells[colIndex]).text().trim()
      if (!valueText || valueText === '–') return

      if (label === 'total revenue' || label.includes('total revenue')) {
        try { fiscalValues.set('revenue', parseDollarString(valueText, unit)) } catch { /* skip */ }
      } else if (label === 'total expense' || label.includes('total expense') || label.includes('total expenditure')) {
        try { fiscalValues.set('expense', parseDollarString(valueText, unit)) } catch { /* skip */ }
      }
    })
  })

  // 2. Second pass: find Ministry expenditures (Table 3.10 is "Total Expense")
  $('table').each((_i, table) => {
    const caption = $(table).find('caption').text().toLowerCase()
    const tableText = $(table).text()
    
    // Detailed ministry table 3.10 contains "(Base)" and "(Total)" markers
    if (!caption.includes('expense') || !tableText.includes('(Base)')) return

    const colIndex = findYearColumnIndex(table)
    if (colIndex === -1) return

    const unit = getTableUnit(table)

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('th, td')
      if (cells.length <= colIndex) return

      let rawName = $(cells[0]).text().trim()
      if (!rawName) return

      // Exclude generic summary rows
      const lowerName = rawName.toLowerCase()
      if (lowerName === 'total expense' || lowerName.includes('total base programs') || lowerName.includes('significant exceptional') || lowerName.includes('interest and other debt')) {
        return
      }

      // Cleanup: strip (Total), (Base) and footnotes
      let cleanName = rawName
        .replace(/\s*\([\s\w]+\)\s*$/i, '') // Strips (Base), (Total), (Total programs), etc
        .replace(/sup.*$/i, '')            // Strips sup tags/markers if any leaked in
        .replace(/\s+/g, ' ')
        .trim()
      
      if (!cleanName) return

      // Normalise for deduplication key
      const normName = normaliseMinistryName(cleanName)

      const valueText = $(cells[colIndex]).text().trim()
      if (!valueText || valueText === '–') return

      try {
        const amount = parseDollarString(valueText, unit)
        if (amount > 0n) {
          const existing = ministryMap.get(normName)
          // We prefer the larger amount if multiple rows exist (Total vs Base)
          if (!existing || existing.amount < amount) {
            ministryMap.set(normName, { name: cleanName, amount })
          }
        }
      } catch {
        // skip unparseable
      }
    })
  })

  const total_revenue = fiscalValues.get('revenue')
  const total_expense = fiscalValues.get('expense')

  if (total_revenue === undefined) {
    throw new Error('[scraper/budget] Pass 1 failed: could not find Total Revenue row — page structure may have changed')
  }
  if (total_expense === undefined) {
    throw new Error('[scraper/budget] Pass 1 failed: could not find Total Expense row — page structure may have changed')
  }

  const deficit = total_expense - total_revenue
  const ministries = Array.from(ministryMap.values())

  return { total_revenue, total_expense, deficit, ministries }
}

/**
 * Parse expenditure estimates TOC page and return per-ministry page URLs.
 * Throws if no ministry URLs are found (would silently produce no sub-programs).
 */
export function parseMinistryTocUrls(html: string): string[] {
  const $ = cheerio.load(html)
  const urls: string[] = []

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? ''
    if (href.includes('expenditure-estimates-ministry')) {
      const full = href.startsWith('http') ? href : `${ESTIMATES_BASE_URL}${href}`
      urls.push(full)
    }
  })

  if (urls.length === 0) {
    throw new Error('[scraper/budget] Pass 2 TOC returned zero ministry URLs — page structure may have changed')
  }

  return urls
}

/**
 * Parse a per-ministry expenditure estimates page and return program rows.
 * Returns an empty array (does not throw) if no Program Summary table is found —
 * partial sub-program data is acceptable.
 */
export function parseMinistryPrograms(html: string): ProgramRow[] {
  const $ = cheerio.load(html)
  const programs: ProgramRow[] = []

  // Find a table whose caption contains "Program Summary" or "Summary"
  $('table').each((_i, table) => {
    const caption = $(table).find('caption').text().toLowerCase()
    if (!caption.includes('program') || !caption.includes('summary')) return

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('td')
      if (cells.length < 2) return
      const name = $(cells[0]).text().trim()
      const valueText = $(cells[1]).text().trim()
      if (!name || !valueText) return
      try {
        // Per-ministry tables use millions
        const amount = parseDollarString(valueText, 'millions')
        if (amount > 0n) {
          programs.push({ name, amount })
        }
      } catch {
        // skip unparseable rows
      }
    })
  })

  return programs
}

// ─── Fetch helpers ───────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const { data, status } = await axios.get<string>(url, {
    headers: buildHeaders(),
    timeout: 20_000,
    validateStatus: () => true, // handle non-200 manually
  })
  if (status !== 200) {
    throw new Error(`[scraper/budget] HTTP ${status} fetching ${url}`)
  }
  return data
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function scrapeBudget(): Promise<BudgetScrapeResult> {
  // ── Pass 1: fiscal summary + ministry totals ──────────────────────────────

  const pass1Allowed = await checkRobotsTxt('https://budget.ontario.ca', '/2025/chapter-3.html')
  if (!pass1Allowed) {
    throw new Error('[scraper/budget] robots.txt disallows scraping budget.ontario.ca')
  }

  const summaryHtml = await fetchHtml(BUDGET_SUMMARY_URL)
  const summary = parseBudgetSummary(summaryHtml)

  // Upsert the snapshot
  const snapshot = await prisma.budgetSnapshot.upsert({
    where: { fiscal_year: BUDGET_YEAR },
    create: {
      fiscal_year: BUDGET_YEAR,
      total_revenue: summary.total_revenue,
      total_expense: summary.total_expense,
      deficit: summary.deficit,
    },
    update: {
      total_revenue: summary.total_revenue,
      total_expense: summary.total_expense,
      deficit: summary.deficit,
    },
  })

  // Upsert ministry totals
  for (let i = 0; i < summary.ministries.length; i++) {
    const m = summary.ministries[i]
    await prisma.budgetMinistry.upsert({
      where: { snapshotId_name: { snapshotId: snapshot.id, name: m.name } },
      create: { snapshotId: snapshot.id, name: m.name, amount: m.amount, sort_order: i },
      update: { amount: m.amount, sort_order: i },
    })
  }

  // ── Pass 2: sub-programs ──────────────────────────────────────────────────

  const pass2Allowed = await checkRobotsTxt(
    'https://www.ontario.ca',
    '/page/expenditure-estimates-volume-1-table-contents-2025-26'
  )
  if (!pass2Allowed) {
    throw new Error('[scraper/budget] robots.txt disallows scraping ontario.ca')
  }

  const tocHtml = await fetchHtml(ESTIMATES_TOC_URL)
  const ministryUrls = parseMinistryTocUrls(tocHtml) // throws if empty

  // Build a lookup of normalised name → ministry db row
  const dbMinistries = await prisma.budgetMinistry.findMany({ where: { snapshotId: snapshot.id } })
  const ministryByNorm = new Map(dbMinistries.map((m) => [normaliseMinistryName(m.name), m]))

  let programs_scraped = 0
  let matched = 0
  let firstFetch = true

  for (const url of ministryUrls) {
    if (!firstFetch) await delay(FETCH_DELAY_MS)
    firstFetch = false

    try {
      const html = await fetchHtml(url)
      const programs = parseMinistryPrograms(html)

      // Derive ministry name from URL slug for matching
      // e.g. ".../expenditure-estimates-ministry-health-2025-26" → "health"
      const slug = url.split('/').pop() ?? ''
      const rawSlugName = slug
        .replace(/expenditure-estimates-ministry-/, '')
        .replace(/-\d{4}-\d{2}$/, '')
        .replace(/-/g, ' ')
        .trim()
      
      const normSlug = normaliseMinistryName(rawSlugName)

      // Find matching ministry using normalised name or slug
      let dbMinistry = ministryByNorm.get(normSlug)
      if (!dbMinistry) {
        // Fallback: partial match — require the slug to substantially overlap with a ministry name
        for (const [norm, m] of ministryByNorm) {
          const longer = norm.length > normSlug.length ? norm : normSlug
          const shorter = norm.length <= normSlug.length ? norm : normSlug
          const overlapRatio = shorter.length / longer.length
          if (overlapRatio >= 0.5 && (norm.includes(normSlug) || normSlug.includes(norm))) {
            dbMinistry = m
            break
          }
        }
      }

      if (!dbMinistry) {
        console.warn(`[scraper/budget] No matching ministry for URL slug "${normSlug}" (${url}). Available: ${Array.from(ministryByNorm.keys()).join(', ')}`)
        continue
      }

      matched++

      for (let i = 0; i < programs.length; i++) {
        const p = programs[i]
        await prisma.budgetProgram.upsert({
          where: { ministryId_name: { ministryId: dbMinistry.id, name: p.name } },
          create: { ministryId: dbMinistry.id, name: p.name, amount: p.amount, sort_order: i },
          update: { amount: p.amount, sort_order: i },
        })
        programs_scraped++
      }
    } catch (err) {
      console.warn(
        `[scraper/budget] Failed to scrape ministry URL ${url}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const match_rate = dbMinistries.length > 0 ? matched / dbMinistries.length : 0

  if (match_rate < 0.5) {
    console.warn(
      `[scraper/budget] Low ministry match rate: ${(match_rate * 100).toFixed(0)}% — ministry name normalisation may need updating`
    )
  }

  return {
    fiscal_year: BUDGET_YEAR,
    ministries_scraped: summary.ministries.length,
    programs_scraped,
    match_rate,
  }
}
