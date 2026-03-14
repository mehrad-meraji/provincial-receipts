import { buildStaticTaxonomy, NEGATIVE_MODIFIERS } from './keywords'
import type { Taxonomy } from './keywords'

export interface BillInput {
  title: string
  sponsor: string
  scraperTags: string[]  // tags from the scraper only — never classifier-written tags
}

export interface ScoreResult {
  impact_score: number
  tags: string[]
  topic: string | null
  toronto_flagged: boolean
}

export function scoreBill(bill: BillInput, taxonomy?: Taxonomy): ScoreResult {
  const t = taxonomy ?? buildStaticTaxonomy()
  const searchText = [bill.title, bill.sponsor, ...bill.scraperTags]
    .join(' ')
    .toLowerCase()
  const titleLower = bill.title.toLowerCase()

  let score = 0
  const matchedTags: string[] = []
  const categoryCounts: Record<string, number> = {}

  for (const [term, { weight, category }] of Object.entries(t)) {
    if (searchText.includes(term)) {
      score += weight
      matchedTags.push(category)
      categoryCounts[category] = (categoryCounts[category] ?? 0) + weight
    }
  }

  const hasNegativeModifier = NEGATIVE_MODIFIERS.some((mod) =>
    titleLower.includes(mod)
  )
  if (hasNegativeModifier && score > 0) {
    score *= 1.5
    matchedTags.push('negative')
  }

  score = Math.min(score, 10)
  score = Math.round(score * 10) / 10

  // Determine primary topic by highest accumulated weight
  const topic =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null

  const toronto_flagged = score >= 3

  const tags = [...new Set(matchedTags)]
  if (toronto_flagged) tags.push('toronto')

  return { impact_score: score, tags, topic, toronto_flagged }
}
