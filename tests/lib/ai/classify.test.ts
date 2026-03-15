import { describe, it, expect } from 'vitest'
import { parseClassification, SCANDAL_KEYWORDS } from '@/lib/ai/classify'

describe('parseClassification', () => {
  it('parses a valid AI response', () => {
    const raw = JSON.stringify({
      topic: 'housing',
      sentiment: 'scandal',
      is_scandal: true,
      tags: ['greenbelt', 'conflict of interest'],
    })
    const result = parseClassification(raw)
    expect(result.topic).toBe('housing')
    expect(result.is_scandal).toBe(true)
    expect(result.tags).toContain('greenbelt')
  })

  it('returns safe defaults for malformed JSON', () => {
    const result = parseClassification('not json at all')
    expect(result.topic).toBe('other')
    expect(result.is_scandal).toBe(false)
    expect(result.sentiment).toBe('neutral')
  })

  it('returns safe defaults for a JSON object missing fields', () => {
    const result = parseClassification(JSON.stringify({ topic: 'transit' }))
    expect(result.topic).toBe('transit')
    expect(result.is_scandal).toBe(false)
  })
})

describe('SCANDAL_KEYWORDS', () => {
  it('exports an array of strings', () => {
    expect(Array.isArray(SCANDAL_KEYWORDS)).toBe(true)
    expect(SCANDAL_KEYWORDS.length).toBeGreaterThan(0)
  })

  it('includes expected terms', () => {
    expect(SCANDAL_KEYWORDS).toContain('corruption')
    expect(SCANDAL_KEYWORDS).toContain('fraud')
    expect(SCANDAL_KEYWORDS).toContain('misconduct')
  })
})

describe('parseClassification — scandal_review_status', () => {
  it('always returns scandal_review_status: null', () => {
    const raw = JSON.stringify({ topic: 'ethics', sentiment: 'scandal', is_scandal: true, tags: [] })
    const result = parseClassification(raw)
    expect(result.scandal_review_status).toBeNull()
  })

  it('returns scandal_review_status: null for malformed JSON', () => {
    const result = parseClassification('not json')
    expect(result.scandal_review_status).toBeNull()
  })
})
