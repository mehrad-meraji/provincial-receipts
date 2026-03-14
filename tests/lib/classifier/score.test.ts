import { describe, it, expect } from 'vitest'
import { scoreBill } from '@/lib/classifier/score'
import type { BillInput } from '@/lib/classifier/score'

describe('scoreBill', () => {
  it('scores zero for a bill with no keyword matches', () => {
    const bill: BillInput = { title: 'An Act to amend the Corporations Act', sponsor: 'Ted Arnott', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBe(0)
    expect(result.toronto_flagged).toBe(false)
  })

  it('scores a direct Toronto match at weight 4', () => {
    const bill: BillInput = { title: 'City of Toronto Amendment Act', sponsor: 'Doug Ford', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBeGreaterThanOrEqual(4)
    expect(result.toronto_flagged).toBe(true)
  })

  it('applies 1.5x multiplier when title contains a negative modifier', () => {
    const bill: BillInput = { title: 'An Act to Remove Bike Lanes in Toronto', sponsor: 'Doug Ford', scraperTags: [] }
    const result = scoreBill(bill)
    // "bike lanes" (3) + "toronto" (4) = 7, × 1.5 = 10.5, capped at 10
    expect(result.impact_score).toBe(10)
    expect(result.toronto_flagged).toBe(true)
  })

  it('caps score at 10', () => {
    const bill: BillInput = { title: 'Toronto Transit TTC Bike Lanes Greenbelt Zoning Rent', sponsor: 'x', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.impact_score).toBe(10)
  })

  it('does not read classifier-written tags — only scraperTags', () => {
    // scraperTags should be the ONLY tags passed to scorer
    const bill: BillInput = { title: 'Generic Act', sponsor: 'x', scraperTags: ['housing'] }
    const result = scoreBill(bill)
    // "housing" is not a keyword term — scraperTags are matched against keyword terms
    expect(result.impact_score).toBe(0)
  })

  it('returns a topic for matched category', () => {
    const bill: BillInput = { title: 'Ontario Greenbelt Protection Act', sponsor: 'x', scraperTags: [] }
    const result = scoreBill(bill)
    expect(result.topic).toBe('housing')
  })
})
