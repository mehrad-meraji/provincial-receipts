import axios from 'axios'
import { isBackedOff, setBackoff, clearBackoff } from './backoff'
import type { PendingItem } from './news'

const NEWSAPI_URL = 'https://newsapi.org/v2/everything'
const NEWSAPI_QUERY = 'ontario OR "doug ford" OR "queen\'s park" OR "ontario legislature"'
const SOURCE_ID = 'newsapi'

export async function fetchNewsApiArticles(): Promise<PendingItem[]> {
  if (await isBackedOff(SOURCE_ID)) {
    console.warn('[scraper/newsapi] backed off, skipping')
    return []
  }

  try {
    const response = await axios.get(NEWSAPI_URL, {
      params: {
        q: NEWSAPI_QUERY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 25,
        apiKey: process.env.NEWS_API_KEY ?? '',
      },
      timeout: 15_000,
    })

    const data = response.data

    if (data.status === 'error') {
      if (data.code === 'rateLimited') {
        console.warn('[scraper/newsapi] rate limited')
        await setBackoff(SOURCE_ID, `rateLimited: ${data.message}`)
        return []
      }
      console.warn(`[scraper/newsapi] API error: ${data.code} — ${data.message}`)
      return []
    }

    await clearBackoff(SOURCE_ID)

    return (data.articles ?? [])
      .filter((a: { url?: string }) => !!a.url)
      .map((a: { title?: string; url: string; publishedAt?: string; description?: string; content?: string; source?: { name?: string } }) => ({
        title: a.title ?? '',
        link: a.url,
        pubDate: a.publishedAt,
        contentSnippet: a.description ?? '',
        content: a.content ?? '',
        sourceName: `NewsAPI: ${a.source?.name ?? 'Unknown'}`,
      }))
  } catch (err) {
    console.warn(
      `[scraper/newsapi] fetch failed: ${err instanceof Error ? err.message : String(err)}`
    )
    return []
  }
}
