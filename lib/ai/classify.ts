import OpenAI from 'openai'

// Swap provider by changing these two values:
const AI_BASE_URL = 'https://models.inference.ai.azure.com'  // GitHub Models
const AI_MODEL = 'gpt-4o-mini'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: AI_BASE_URL,
      apiKey: process.env.GITHUB_TOKEN ?? '',
    })
  }
  return _client
}

export type ScandalReviewStatus = 'pending' | 'confirmed' | 'rejected'

export interface ArticleClassification {
  topic: 'housing' | 'transit' | 'ethics' | 'environment' | 'finance' | 'other'
  sentiment: 'scandal' | 'critical' | 'neutral' | 'positive'
  is_scandal: boolean
  tags: string[]
  scandal_review_status: 'pending' | null
}

const DEFAULTS: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
  scandal_review_status: null,
}

export function parseClassification(raw: string): ArticleClassification {
  try {
    const parsed = JSON.parse(raw)
    return {
      topic: parsed.topic ?? DEFAULTS.topic,
      sentiment: parsed.sentiment ?? DEFAULTS.sentiment,
      is_scandal: parsed.is_scandal ?? DEFAULTS.is_scandal,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      scandal_review_status: null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export const SCANDAL_KEYWORDS = [
  'corruption', 'misconduct', 'fraud', 'bribery', 'breach', 'unethical',
  'cover-up', 'coverup', 'scandal', 'probe', 'investigation', 'fired',
  'resigned', 'conflict of interest', 'kickback', 'inappropriate',
  'improper', 'illegal', 'lawsuit', 'charged', 'convicted',
]

const PROMPT_TEMPLATE = (headline: string, excerpt: string) => `
Classify this Ontario provincial politics news article.
Headline: "${headline}"
Excerpt: "${excerpt}"

Mark is_scandal: true ONLY for credible evidence of misconduct, corruption, ethical breach, or abuse of power. Routine policy criticism, controversy, or opposition complaints are NOT scandals.

Return valid JSON only, no prose:
{
  "topic": "housing" | "transit" | "ethics" | "environment" | "finance" | "other",
  "sentiment": "scandal" | "critical" | "neutral" | "positive",
  "is_scandal": boolean,
  "tags": string[]
}
`.trim()

export async function classifyArticle(
  headline: string,
  excerpt: string,
  retryCount = 0
): Promise<ArticleClassification> {
  const MAX_RETRIES = 3
  try {
    const response = await getClient().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(headline, excerpt) }],
      max_completion_tokens: 200,
    })
    const raw = response.choices[0]?.message?.content ?? ''
    const result = parseClassification(raw)
    const keywordMatch = SCANDAL_KEYWORDS.some(kw =>
      `${headline} ${excerpt}`.toLowerCase().includes(kw)
    )
    if (result.is_scandal && !keywordMatch) {
      return { ...result, is_scandal: false, scandal_review_status: 'pending' }
    }
    return { ...result, scandal_review_status: null }
  } catch (err: any) {
    // Rate limit handling
    if (err?.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = parseInt(err?.headers?.['retry-after'] ?? '60', 10)
      console.warn(`[classify] Rate limit hit, retrying after ${retryAfter}s (attempt ${retryCount + 1})`)
      await new Promise(res => setTimeout(res, retryAfter * 1000))
      return classifyArticle(headline, excerpt, retryCount + 1)
    }
    console.error('[classify] AI call failed:', err)
    return { ...DEFAULTS }
  }
}

/** Extract bill number from text using regex, e.g. "Bill 97" → "Bill 97" */
export function extractBillNumber(text: string): string | null {
  const match = text.match(/Bill\s+(\d+)/i)
  return match ? `Bill ${match[1]}` : null
}
