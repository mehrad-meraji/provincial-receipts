export type KeywordCategory =
  | 'direct'
  | 'toronto_flashpoints'
  | 'housing'
  | 'transit'
  | 'municipal'

export interface KeywordTier {
  weight: number
  terms: string[]
}

export const STATIC_KEYWORDS: Record<KeywordCategory, KeywordTier> = {
  direct: {
    weight: 4,
    terms: ['toronto', 'city of toronto', 'ttc', 'toronto transit commission'],
  },
  toronto_flashpoints: {
    weight: 3,
    terms: [
      'bike lanes', 'ontario place', 'strong mayor', 'fourplex',
      'gardiner', 'scarborough', 'eg west', 'bloor',
    ],
  },
  housing: {
    weight: 2,
    terms: [
      'greenbelt', 'rent', 'rent control', 'zoning', 'official plan',
      'infill', 'severance', 'residential intensification',
    ],
  },
  transit: {
    weight: 2,
    terms: ['transit', 'subway', 'lrt', 'metrolinx', 'go train', 'rapid transit'],
  },
  municipal: {
    weight: 1,
    terms: ['municipal', 'planning act', 'conservation authority', 'omb', 'lpat'],
  },
}

export const NEGATIVE_MODIFIERS = [
  'remove', 'removes', 'strip', 'strips', 'repeal', 'repeals',
  'override', 'overrides', 'eliminate', 'eliminates',
  'reduce', 'reduces', 'cancel', 'cancels', 'revoke', 'revokes',
]

export type Taxonomy = Record<string, { weight: number; category: KeywordCategory }>

/** Build a flat term→weight lookup from static config */
export function buildStaticTaxonomy(): Taxonomy {
  const taxonomy: Taxonomy = {}
  for (const [category, tier] of Object.entries(STATIC_KEYWORDS)) {
    for (const term of tier.terms) {
      taxonomy[term] = { weight: tier.weight, category: category as KeywordCategory }
    }
  }
  return taxonomy
}

/** Load active keyword suggestions from DB and merge with static taxonomy */
export async function loadTaxonomy(): Promise<Taxonomy> {
  const taxonomy = buildStaticTaxonomy()

  try {
    const { prisma } = await import('@/lib/db')
    const active = await prisma.keywordSuggestion.findMany({
      where: { status: 'active' },
    })
    for (const suggestion of active) {
      taxonomy[suggestion.term] = {
        weight: suggestion.weight,
        category: suggestion.category as KeywordCategory,
      }
    }
  } catch {
    // If DB is unreachable, fall back to static taxonomy
  }

  return taxonomy
}
