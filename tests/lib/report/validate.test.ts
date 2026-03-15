import { describe, it, expect } from 'vitest'
import { validateReportInput } from '@/lib/report/validate'

describe('validateReportInput', () => {
  const valid = {
    type: 'news' as const,
    targetId: 'abc123',
    targetTitle: 'Some headline',
    categories: ['wrong-information'],
    turnstileToken: 'tok_123',
  }

  it('accepts a valid news report', () => {
    expect(validateReportInput(valid)).toBeNull()
  })

  it('accepts a valid bill report', () => {
    expect(validateReportInput({ ...valid, type: 'bill' })).toBeNull()
  })

  it('rejects invalid type', () => {
    expect(validateReportInput({ ...valid, type: 'unknown' as never })).toMatch(/type/)
  })

  it('rejects empty targetId', () => {
    expect(validateReportInput({ ...valid, targetId: '' })).toMatch(/targetId/)
  })

  it('rejects empty targetTitle', () => {
    expect(validateReportInput({ ...valid, targetTitle: '' })).toMatch(/targetTitle/)
  })

  it('rejects empty categories array', () => {
    expect(validateReportInput({ ...valid, categories: [] })).toMatch(/categories/)
  })

  it('rejects non-array categories', () => {
    expect(validateReportInput({ ...valid, categories: 'wrong' as never })).toMatch(/categories/)
  })

  it('rejects missing turnstileToken', () => {
    expect(validateReportInput({ ...valid, turnstileToken: '' })).toMatch(/turnstileToken/)
  })

  it('rejects other category without comment', () => {
    expect(validateReportInput({ ...valid, categories: ['other'] })).toMatch(/comment/)
  })

  it('accepts other category with comment', () => {
    expect(validateReportInput({ ...valid, categories: ['other'], comment: 'details here' })).toBeNull()
  })
})
