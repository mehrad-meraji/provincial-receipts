import OpenAI from 'openai'
import { prisma } from '@/lib/db'

const AI_BASE_URL = 'https://models.inference.ai.azure.com'
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

export interface KeywordDiscoveryResult {
  suggested: number       // terms suggested by AI
  promoted: number        // terms auto-promoted to 'active' (seen_count >= 3)
  newSuggestions: number  // net-new terms added to DB
}

interface AISuggestion {
  term: string
  weight: 1 | 2 | 3 | 4
  category: 'direct' | 'toronto_flashpoints' | 'housing' | 'transit' | 'municipal'
}

export async function discoverKeywords(): Promise<KeywordDiscoveryResult> {
  // 1. Fetch last 50 bills from DB
  const bills = await prisma.bill.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: { bill_number: true, title: true, tags: true },
  })

  // 2. Load existing pending+active suggestions to avoid re-suggesting
  const existingSuggestions = await prisma.keywordSuggestion.findMany({
    where: { status: { in: ['pending', 'active'] } },
    select: { term: true, seen_count: true },
  })
  const existingTerms = existingSuggestions.map((s) => s.term)

  // 3. Build prompt and call AI
  const prompt = `You are helping track Ontario government bills that affect Toronto.

Here are recent Ontario bills (bill_number, title, tags):
${JSON.stringify(bills)}

Existing tracked keywords (do not re-suggest): ${existingTerms.join(', ')}

Suggest up to 10 new search terms that would identify bills affecting Toronto residents.
Focus on: place names, policy areas, infrastructure, local government powers.

Return valid JSON only:
{ "suggestions": [{ "term": string, "weight": 1|2|3|4, "category": "direct"|"toronto_flashpoints"|"housing"|"transit"|"municipal" }] }`

  let aiSuggestions: AISuggestion[] = []
  try {
    const response = await getClient().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 500,
    })
    const raw = response.choices[0]?.message?.content ?? ''
    try {
      const parsed = JSON.parse(raw)
      aiSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    } catch {
      console.error('[discover] Failed to parse AI response:', raw)
      return { suggested: 0, promoted: 0, newSuggestions: 0 }
    }
  } catch (err) {
    console.error('[discover] AI call failed:', err)
    return { suggested: 0, promoted: 0, newSuggestions: 0 }
  }

  // 4–6. Upsert each suggestion into the DB
  const existingMap = new Map(existingSuggestions.map((s) => [s.term, s.seen_count]))

  let promoted = 0
  let newSuggestions = 0

  for (const suggestion of aiSuggestions) {
    const { term, weight, category } = suggestion
    const currentCount = existingMap.get(term) ?? 0
    const seenCountAfter = currentCount + 1
    const isNew = currentCount === 0
    const willPromote = seenCountAfter >= 3

    if (willPromote) promoted++
    if (isNew) newSuggestions++

    await prisma.keywordSuggestion.upsert({
      where: { term },
      update: {
        seen_count: { increment: 1 },
        ...(willPromote ? { status: 'active' } : {}),
      },
      create: {
        term,
        weight,
        category,
        seen_count: 1,
        status: 'pending',
        source_bills: [],
      },
    })
  }

  return {
    suggested: aiSuggestions.length,
    promoted,
    newSuggestions,
  }
}
