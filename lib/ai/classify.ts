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

export interface ArticleClassification {
  topic: 'housing' | 'transit' | 'ethics' | 'environment' | 'finance' | 'other'
  sentiment: 'scandal' | 'critical' | 'neutral' | 'positive'
  is_scandal: boolean
  tags: string[]
}

const DEFAULTS: ArticleClassification = {
  topic: 'other',
  sentiment: 'neutral',
  is_scandal: false,
  tags: [],
}

export function parseClassification(raw: string): ArticleClassification {
  try {
    const parsed = JSON.parse(raw)
    return {
      topic: parsed.topic ?? DEFAULTS.topic,
      sentiment: parsed.sentiment ?? DEFAULTS.sentiment,
      is_scandal: parsed.is_scandal ?? DEFAULTS.is_scandal,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

const PROMPT_TEMPLATE = (headline: string, excerpt: string) => `
Classify this Ontario provincial politics news article.
Headline: "${headline}"
Excerpt: "${excerpt}"

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
  excerpt: string
): Promise<ArticleClassification> {
  try {
    const response = await getClient().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(headline, excerpt) }],
      temperature: 0,
      max_tokens: 200,
    })
    const raw = response.choices[0]?.message?.content ?? ''
    return parseClassification(raw)
  } catch (err) {
    console.error('[classify] AI call failed:', err)
    return { ...DEFAULTS }
  }
}

/** Extract bill number from text using regex, e.g. "Bill 97" → "Bill 97" */
export function extractBillNumber(text: string): string | null {
  const match = text.match(/Bill\s+(\d+)/i)
  return match ? `Bill ${match[1]}` : null
}
