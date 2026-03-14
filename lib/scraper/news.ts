// lib/scraper/news.ts
//
// Scrapes RSS feeds, classifies articles via AI, and stores new NewsEvent
// records. Caps at 25 new articles per invocation to stay within Vercel's
// 60s function timeout.

import Parser from 'rss-parser'
import { classifyArticle, extractBillNumber } from '@/lib/ai/classify'
import { prisma } from '@/lib/db'
import { delay } from './utils'
import { RSS_SOURCES } from './rss-sources'

const MAX_NEW_ARTICLES = 25

export interface NewsScrapeResult {
  fetched: number     // RSS items fetched across all feeds
  stored: number      // new articles stored
  classified: number  // articles sent to AI
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function scrapeNews(): Promise<NewsScrapeResult> {
  const parser = new Parser()

  let fetched = 0
  let stored = 0
  let classified = 0

  // Collect new items (not already in DB) across all feeds up to the cap
  interface PendingItem {
    title: string
    link: string
    pubDate?: string
    contentSnippet?: string
    content?: string
    sourceName: string
  }

  const pendingItems: PendingItem[] = []

  for (const source of RSS_SOURCES) {
    if (pendingItems.length >= MAX_NEW_ARTICLES) break

    try {
      const feed = await parser.parseURL(source.url)

      for (const item of feed.items ?? []) {
        if (pendingItems.length >= MAX_NEW_ARTICLES) break

        fetched++

        const url = item.link ?? ''
        if (!url) continue

        // Skip articles already in the database
        const existing = await prisma.newsEvent.findUnique({
          where: { url },
        })
        if (existing) continue

        pendingItems.push({
          title: item.title ?? '',
          link: url,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet,
          content: item.content,
          sourceName: source.name,
        })
      }
    } catch (err) {
      console.warn(
        `[scraper/news] Failed to parse feed ${source.url}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

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

    // Classify the article via AI
    let classification = {
      topic: 'other' as const,
      sentiment: 'neutral' as const,
      is_scandal: false,
      tags: [] as string[],
    }

    try {
      classification = await classifyArticle(headline, excerpt)
      classified++
    } catch (err) {
      console.warn(
        `[scraper/news] Classification failed for "${headline}": ${err instanceof Error ? err.message : String(err)}`
      )
    }

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
