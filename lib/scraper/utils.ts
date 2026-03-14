import robotsParser from 'robots-parser'
import axios from 'axios'

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
