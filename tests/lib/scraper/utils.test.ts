import { describe, it, expect, vi } from 'vitest'
import { normaliseText, delay, buildHeaders } from '@/lib/scraper/utils'

describe('normaliseText', () => {
  it('trims whitespace and collapses internal spaces', () => {
    expect(normaliseText('  Bill  97  ')).toBe('Bill 97')
  })

  it('returns empty string for blank input', () => {
    expect(normaliseText('   ')).toBe('')
  })
})

describe('buildHeaders', () => {
  it('includes a User-Agent string', () => {
    const headers = buildHeaders()
    expect(headers['User-Agent']).toContain('FuckDougFord')
  })
})

describe('delay', () => {
  it('resolves after approximately the given ms', async () => {
    const start = Date.now()
    await delay(50)
    expect(Date.now() - start).toBeGreaterThanOrEqual(40)
  })
})
