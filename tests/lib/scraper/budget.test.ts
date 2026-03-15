import { describe, it, expect } from 'vitest'
import { parseBudgetSummary, parseMinistryTocUrls, parseMinistryPrograms, normaliseMinistryName } from '@/lib/scraper/budget'

// Minimal fixture HTML that mimics the chapter-3 fiscal summary table structure.
// Real selectors must be verified against live HTML — these fixtures match the
// structure seen at budget.ontario.ca/2025/chapter-3.html on 2026-03-14.
const SUMMARY_HTML = `
<html><body>
<table>
  <caption>Ontario's Fiscal Plan</caption>
  <tbody>
    <tr><td>Total Revenue</td><td>$218.0</td></tr>
    <tr><td>Total Expense</td><td>$232.5</td></tr>
    <tr><td>Reserve</td><td>($0.1)</td></tr>
    <tr><td>Surplus/(Deficit)</td><td>($14.6)</td></tr>
  </tbody>
</table>
<table>
  <caption>Program Expense</caption>
  <tbody>
    <tr><td>Health Sector</td><td>$91.1</td></tr>
    <tr><td>Education Sector</td><td>$41.0</td></tr>
  </tbody>
</table>
</body></html>
`

const TOC_HTML = `
<html><body>
<ul>
  <li><a href="/page/expenditure-estimates-ministry-health-2025-26">Ministry of Health</a></li>
  <li><a href="/page/expenditure-estimates-ministry-education-2025-26">Ministry of Education</a></li>
</ul>
</body></html>
`

// Per-ministry tables list amounts in millions (e.g. "$60,310" = $60,310M = ~$60.3B)
const MINISTRY_HTML = `
<html><body>
<table>
  <caption>Program Summary</caption>
  <tbody>
    <tr><td>Ontario Health Insurance Plan</td><td>$60,310</td></tr>
    <tr><td>Hospital Services</td><td>$24,100</td></tr>
  </tbody>
</table>
</body></html>
`

describe('normaliseMinistryName', () => {
  it('strips "Ministry of" prefix and lowercases', () => {
    expect(normaliseMinistryName('Ministry of Health')).toBe('health')
  })

  it('strips "Ministry of the" prefix', () => {
    expect(normaliseMinistryName('Ministry of the Attorney General')).toBe('attorney general')
  })

  it('handles names without prefix', () => {
    expect(normaliseMinistryName('Health Sector')).toBe('health sector')
  })

  it('trims whitespace', () => {
    expect(normaliseMinistryName('  Ministry of Finance  ')).toBe('finance')
  })
})

describe('parseBudgetSummary', () => {
  it('extracts total_revenue and total_expense in cents', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    // $218.0B = 21800000000000n cents
    expect(result.total_revenue).toBe(21800000000000n)
    expect(result.total_expense).toBe(23250000000000n)
  })

  it('computes deficit as total_expense - total_revenue', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    expect(result.deficit).toBe(result.total_expense - result.total_revenue)
    // $232.5B - $218.0B = $14.5B = 1,450,000,000,000 cents
    expect(result.deficit).toBe(1450000000000n)
  })

  it('returns ministry rows with amounts in cents', () => {
    const result = parseBudgetSummary(SUMMARY_HTML)
    expect(result.ministries).toHaveLength(2)
    expect(result.ministries[0].name).toBe('Health Sector')
    expect(result.ministries[0].amount).toBe(9110000000000n)
  })

  it('throws if revenue row is missing', () => {
    expect(() => parseBudgetSummary('<html><body></body></html>')).toThrow()
  })
})

describe('parseMinistryTocUrls', () => {
  it('extracts ministry page URLs from TOC', () => {
    const urls = parseMinistryTocUrls(TOC_HTML)
    expect(urls).toHaveLength(2)
    expect(urls[0]).toContain('ministry-health')
  })

  it('filters to expenditure-estimates links only', () => {
    const html = '<html><body><a href="/page/other-link">Other</a><a href="/page/expenditure-estimates-ministry-finance-2025-26">Finance</a></body></html>'
    const urls = parseMinistryTocUrls(html)
    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('finance')
  })

  it('throws if no ministry URLs found', () => {
    expect(() => parseMinistryTocUrls('<html><body></body></html>')).toThrow()
  })
})

describe('parseMinistryPrograms', () => {
  it('extracts program name and amount in cents', () => {
    const programs = parseMinistryPrograms(MINISTRY_HTML)
    expect(programs).toHaveLength(2)
    expect(programs[0].name).toBe('Ontario Health Insurance Plan')
    // $60,310M = 60310 × 1,000,000 dollars = 6,031,000,000,000 cents
    expect(programs[0].amount).toBe(6031000000000n)
  })

  it('returns empty array if no program summary table found', () => {
    const programs = parseMinistryPrograms('<html><body></body></html>')
    expect(programs).toHaveLength(0)
  })
})
