import { describe, it, expect } from 'vitest'
import { parseClassification } from '@/lib/ai/classify'

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
