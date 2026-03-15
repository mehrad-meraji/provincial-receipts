import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios')
vi.mock('@/lib/scraper/backoff', () => ({
  isBackedOff: vi.fn().mockResolvedValue(false),
  setBackoff: vi.fn().mockResolvedValue(undefined),
  clearBackoff: vi.fn().mockResolvedValue(undefined),
}))

import axios from 'axios'
import { fetchNewsApiArticles } from '@/lib/scraper/newsapi'
import { isBackedOff, setBackoff, clearBackoff } from '@/lib/scraper/backoff'

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> }
const mockedIsBackedOff = isBackedOff as ReturnType<typeof vi.fn>
const mockedSetBackoff = setBackoff as ReturnType<typeof vi.fn>
const mockedClearBackoff = clearBackoff as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockedIsBackedOff.mockResolvedValue(false)
  process.env.NEWS_API_KEY = 'test-key'
})

describe('fetchNewsApiArticles', () => {
  it('returns empty array when source is backed off', async () => {
    mockedIsBackedOff.mockResolvedValue(true)
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedAxios.get).not.toHaveBeenCalled()
  })

  it('returns mapped PendingItems on success', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        status: 'ok',
        articles: [
          {
            title: 'Doug Ford cuts transit funding',
            url: 'https://example.com/article1',
            publishedAt: '2026-03-14T10:00:00Z',
            description: 'Ontario premier slashes GO train budget.',
            content: null,
            source: { name: 'Toronto Star' },
          },
        ],
      },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Doug Ford cuts transit funding')
    expect(result[0].link).toBe('https://example.com/article1')
    expect(result[0].sourceName).toBe('NewsAPI: Toronto Star')
    expect(mockedClearBackoff).toHaveBeenCalledWith('newsapi')
  })

  it('calls setBackoff and returns [] on rateLimited error', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { status: 'error', code: 'rateLimited', message: 'Too many requests' },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedSetBackoff).toHaveBeenCalledWith('newsapi', expect.any(String))
  })

  it('returns [] and does not set backoff on other API errors', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('network error'))
    const result = await fetchNewsApiArticles()
    expect(result).toEqual([])
    expect(mockedSetBackoff).not.toHaveBeenCalled()
  })

  it('filters out articles with no URL', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: {
        status: 'ok',
        articles: [
          { title: 'No URL article', url: null, publishedAt: '2026-03-14T10:00:00Z', description: '', source: { name: 'CBC' } },
          { title: 'Valid article', url: 'https://example.com/valid', publishedAt: '2026-03-14T10:00:00Z', description: '', source: { name: 'CBC' } },
        ],
      },
    })
    const result = await fetchNewsApiArticles()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid article')
  })
})
