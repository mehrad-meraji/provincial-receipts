// lib/scraper/news.ts
//
// Scrapes RSS feeds, classifies articles via AI, and stores new NewsEvent
// records. Caps at 25 new articles per invocation to stay within Vercel's
// 60s function timeout.

import { classifyArticle, extractBillNumber, type ArticleClassification } from '@/lib/ai/classify'
import { prisma } from '@/lib/db'
import { delay } from './utils'
import { fetchNewsApiArticles } from './newsapi'

const MAX_NEW_ARTICLES = 25

export interface NewsScrapeResult {
  fetched: number     // RSS items fetched across all feeds
  stored: number      // new articles stored
  classified: number  // articles sent to AI
}

export interface PendingItem {
  title: string
  link: string
  pubDate?: string
  contentSnippet?: string
  content?: string
  sourceName: string
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scrapeNews(): Promise<NewsScrapeResult> {
  let fetched = 0
  let stored = 0
  let classified = 0

  const allCandidates: PendingItem[] = []

  // --- NewsAPI only ---
  const newsApiArticles = await fetchNewsApiArticles()
  allCandidates.push(...newsApiArticles)
  fetched += newsApiArticles.length

  // Batch duplicate check: one query for all candidate URLs
  const allUrls = allCandidates.map((c) => c.link)
  const existingRecords = await prisma.newsEvent.findMany({
    where: { url: { in: allUrls } },
    select: { url: true },
  })
  const existingUrls = new Set(existingRecords.map((r) => r.url))

  const pendingItems = allCandidates.filter((c) => !existingUrls.has(c.link))

  // Process and store each new item
  let firstItem = true

  for (const item of pendingItems) {
    // Rate-limit friendliness: delay between AI classification calls
    if (!firstItem) {
      await delay(200)
    }
    firstItem = false

    const headline = item.title
    const rawExcerpt = item.contentSnippet ?? item.content ?? ''
    const excerpt = rawExcerpt.slice(0, 500)

    // Parse published_at — fall back to now if unparseable
    let published_at: Date
    try {
      const parsed = item.pubDate ? new Date(item.pubDate) : new Date()
      published_at = isNaN(parsed.getTime()) ? new Date() : parsed
    } catch {
      published_at = new Date()
    }

    // Classify the article via AI.
    let classification: ArticleClassification = {
      topic: 'other',
      sentiment: 'neutral',
      is_scandal: false,
      tags: [],
      scandal_review_status: null,
    }

    classification = await classifyArticle(headline, excerpt)
    classified++

    // Look up linked bill by extracted bill number
    let linkedBill: { id: string } | null = null
    try {
      const billRef = extractBillNumber(`${headline} ${excerpt}`)
      if (billRef) {
        linkedBill = await prisma.bill.findUnique({
          where: { bill_number: billRef },
          select: { id: true },
        })
      }
    } catch {
      // non-fatal — store without a bill link
    }

    // Persist the article
    try {
      await prisma.newsEvent.create({
        data: {
          headline,
          url: item.link,
          source: item.sourceName,
          published_at,
          topic: classification.topic,
          sentiment: classification.sentiment,
          is_scandal: classification.is_scandal,
          tags: classification.tags,
          excerpt,
          hidden: false,
          scandal_review_status: classification.scandal_review_status,
          billId: linkedBill?.id ?? undefined,
        },
      })
      stored++
    } catch (err) {
      console.warn(
        `[scraper/news] Failed to store article "${headline}": ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return { fetched, stored, classified }
}
