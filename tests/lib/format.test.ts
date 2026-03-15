import { describe, it, expect } from 'vitest'
import { formatBudgetAmount, centsToNumber } from '@/lib/format'

describe('centsToNumber', () => {
  it('converts bigint cents to dollar number', () => {
    expect(centsToNumber(146000000000n)).toBe(1460000000)
  })

  it('handles zero', () => {
    expect(centsToNumber(0n)).toBe(0)
  })
})

describe('formatBudgetAmount', () => {
  it('formats billions with one decimal', () => {
    // $14.6B = 14,600,000,000 dollars = 1,460,000,000,000 cents
    expect(formatBudgetAmount(1460000000000n)).toBe('$14.6B')
  })

  it('formats exactly 1 billion', () => {
    expect(formatBudgetAmount(100000000000n)).toBe('$1.0B')
  })

  it('formats hundreds of billions', () => {
    expect(formatBudgetAmount(23250000000000n)).toBe('$232.5B')
  })

  it('rounds to one decimal place', () => {
    // $91.15B rounds to $91.2B
    expect(formatBudgetAmount(9115000000000n)).toBe('$91.2B')
  })

  it('formats millions (sub-billion)', () => {
    expect(formatBudgetAmount(37000000000n)).toBe('$370.0M')
  })
})

describe('formatBudgetAmount — edge cases', () => {
  it('formats zero as millions', () => {
    expect(formatBudgetAmount(0n)).toBe('$0.0M')
  })

  it('formats negative billions (deficit)', () => {
    // -$14.6B deficit
    expect(formatBudgetAmount(-1460000000000n)).toBe('-$14.6B')
  })

  it('formats negative millions', () => {
    expect(formatBudgetAmount(-37000000000n)).toBe('-$370.0M')
  })

  it('formats value just below 1B threshold as millions', () => {
    // $999.9M = 99990000000n cents
    expect(formatBudgetAmount(99990000000n)).toBe('$999.9M')
  })
})

describe('centsToNumber — edge cases', () => {
  it('handles negative cents', () => {
    expect(centsToNumber(-146000000000n)).toBe(-1460000000)
  })
})
