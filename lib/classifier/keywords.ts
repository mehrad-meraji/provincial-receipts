export type KeywordCategory =
  | 'direct'
  | 'toronto_flashpoints'
  | 'housing'
  | 'transit'
  | 'municipal'
  | 'public_health'
  | 'social_services'
  | 'civil_rights'
  | 'environment'

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
  public_health: {
    weight: 3,
    terms: [
      'public health', 'harm reduction', 'injection site', 'safe injection',
      'supervised consumption', 'overdose', 'opioid', 'mental health',
      'healthcare', 'hospital', 'addiction', 'naloxone', 'drug policy',
      'public safety', 'health unit', 'community health', 'health care',
    ],
  },
  social_services: {
    weight: 2,
    terms: [
      'social services', 'social assistance', 'welfare', 'disability',
      'long-term care', 'child welfare', 'ontario works', 'odsp',
      'income support', 'affordable housing', 'homelessness', 'shelter',
      'food bank', 'poverty',
    ],
  },
  civil_rights: {
    weight: 2,
    terms: [
      'human rights', 'charter', 'indigenous', 'first nations', 'labour',
      'collective bargaining', 'strike', 'worker', 'civil liberties',
      'discrimination', 'accessibility', 'equity', 'diversity',
    ],
  },
  environment: {
    weight: 2,
    terms: [
      'environment', 'climate', 'conservation', 'wetland', 'species at risk',
      'emissions', 'pollution', 'clean water', 'drinking water',
      'environmental assessment',
    ],
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
