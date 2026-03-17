import { describe, it, expect } from 'vitest'
import { parseBudgetSummary, parseMinistryPrograms } from '@/lib/scraper/budget'

// Minimal HTML fixtures that exercise the title cleanup paths

const MINISTRY_HTML_WITH_FOOTNOTES = `
<table>
  <caption>Table 3.10 — Total Expense</caption>
  <thead><tr><th>Ministry</th><th>2025-26</th></tr></thead>
  <tbody>
    <tr><td>Ministry of Health1</td><td>$60,310</td></tr>
    <tr><td>Education²</td><td>$35,000</td></tr>
    <tr><td>Treasury Board Secretariat (Base)</td><td>$5,000</td></tr>
    <tr><td>Treasury Board Secretariat (Total)</td><td>$5,200</td></tr>
  </tbody>
</table>
`

const SUMMARY_HTML = `
<table>
  <tr><td>Total Revenue</td><td>$200.0</td></tr>
  <tr><td>Total Expense</td><td>$218.0</td></tr>
</table>
` + MINISTRY_HTML_WITH_FOOTNOTES

const PROGRAMS_HTML_WITH_FOOTNOTES = `
<table>
  <caption>Program Summary</caption>
  <tbody>
    <tr><td>Public Health Program1</td><td>$1,000</td></tr>
    <tr><td>Mental Health³</td><td>$500</td></tr>
  </tbody>
</table>
`

describe('parseBudgetSummary — title cleanup', () => {
  it('strips trailing ASCII digit footnotes from ministry names', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const names = result.ministries.map(m => m.name)
    expect(names).toContain('Ministry of Health')
    expect(names.some(n => /\d$/.test(n))).toBe(false)
  })

  it('strips unicode superscript digits from ministry names', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const names = result.ministries.map(m => m.name)
    expect(names).toContain('Education')
    expect(names.some(n => /[¹²³⁴⁵⁶⁷⁸⁹⁰]/.test(n))).toBe(false)
  })

  it('deduplicates (Base)/(Total) rows, keeping the larger amount', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    const treasury = result.ministries.filter(m => m.name.toLowerCase().includes('treasury'))
    expect(treasury).toHaveLength(1)
    expect(treasury[0].amount).toBe(520_000_000_000n) // $5,200M in cents
  })
})

describe('parseMinistryPrograms — title cleanup', () => {
  it('strips trailing ASCII digit footnotes from program names', () => {
    const programs = parseMinistryPrograms(PROGRAMS_HTML_WITH_FOOTNOTES)
    expect(programs.map(p => p.name)).toContain('Public Health Program')
    expect(programs.some(p => /\d$/.test(p.name))).toBe(false)
  })

  it('strips unicode superscript digits from program names', () => {
    const programs = parseMinistryPrograms(PROGRAMS_HTML_WITH_FOOTNOTES)
    expect(programs.map(p => p.name)).toContain('Mental Health')
    expect(programs.some(p => /[¹²³⁴⁵⁶⁷⁸⁹⁰]/.test(p.name))).toBe(false)
  })
})
