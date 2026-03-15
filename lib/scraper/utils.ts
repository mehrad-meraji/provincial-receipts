import robotsParser from 'robots-parser'
import axios from 'axios'
import stringSimilarity from 'string-similarity'

export const USER_AGENT =
  'FuckDougFord/1.0 (civic transparency project; contact@YOUR_EMAIL.com)'

export function normaliseText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function buildHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-CA,en;q=0.9',
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROBOTS_CACHE: Map<string, { allowed: boolean; checkedAt: number }> = new Map()
const ROBOTS_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
  const cached = ROBOTS_CACHE.get(baseUrl)
  if (cached && Date.now() - cached.checkedAt < ROBOTS_TTL_MS) {
    return cached.allowed
  }

  try {
    const { data } = await axios.get(`${baseUrl}/robots.txt`, {
      headers: buildHeaders(),
      timeout: 5000,
    })
    const robots = robotsParser(`${baseUrl}/robots.txt`, data)
    const allowed = robots.isAllowed(path, USER_AGENT) !== false
    ROBOTS_CACHE.set(baseUrl, { allowed, checkedAt: Date.now() })
    return allowed
  } catch {
    // If robots.txt is unreachable, assume allowed
    return true
  }
}

const PARLIAMENT_CACHE: { number: string; cachedAt: number } | null = null
const PARLIAMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Dynamically detect the current parliament number by scraping the OLA bills page.
 * Falls back to parliament-44 if detection fails.
 */
export async function getCurrentParliament(): Promise<string> {
  // Note: Using a simple mutable check instead of a cached object
  // In production, consider using a proper cache or database
  try {
    const billsPageUrl = 'https://www.ola.org/en/legislative-business/bills/current'
    const { data } = await axios.get(billsPageUrl, {
      headers: buildHeaders(),
      timeout: 10000,
    })

    const cheerio = await import('cheerio')
    const $ = cheerio.load(data)

    // Extract parliament number from first bill link: /parliament-44/session-1/bill-XX
    const billLink = $('a[href*="/parliament-"][href*="/bill-"]').first().attr('href')
    if (billLink) {
      const match = billLink.match(/parliament-(\d+)/)
      if (match && match[1]) {
        return `parliament-${match[1]}`
      }
    }

    // Fallback to parliament-44
    return 'parliament-44'
  } catch (err) {
    // If detection fails, log and fallback to parliament-44
    console.warn(
      `[scraper] Failed to detect current parliament: ${err instanceof Error ? err.message : String(err)}`
    )
    return 'parliament-44'
  }
}

/**
 * Deduplicate articles based on content similarity.
 * @param articles Array of PendingItem
 * @param threshold Similarity threshold (0.9 = 90%)
 * @returns Deduped array
 */
export function dedupeArticlesBySimilarity(articles: Array<{ title: string; contentSnippet: string; content: string; link: string; sourceName: string }>, threshold = 0.9) {
  const deduped: typeof articles = []
  for (const article of articles) {
    const textA = `${article.title} ${article.contentSnippet} ${article.content}`.toLowerCase().replace(/[^a-z0-9 ]/g, '')
    const isDuplicate = deduped.some((other) => {
      const textB = `${other.title} ${other.contentSnippet} ${other.content}`.toLowerCase().replace(/[^a-z0-9 ]/g, '')
      const similarity = stringSimilarity.compareTwoStrings(textA, textB)
      return similarity >= threshold
    })
    if (!isDuplicate) deduped.push(article)
  }
  return deduped
}
