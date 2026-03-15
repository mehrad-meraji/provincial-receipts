export interface ReportInput {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
  categories: string[]
  comment?: string
  turnstileToken: string
}

/**
 * Returns null if valid, or an error string describing the first problem found.
 */
export function validateReportInput(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid body'
  const b = body as Record<string, unknown>

  if (b.type !== 'news' && b.type !== 'bill') {
    return 'type must be "news" or "bill"'
  }
  if (!b.targetId || typeof b.targetId !== 'string') {
    return 'targetId is required'
  }
  if (!b.targetTitle || typeof b.targetTitle !== 'string') {
    return 'targetTitle is required'
  }
  if (!Array.isArray(b.categories) || b.categories.length === 0) {
    return 'categories must be a non-empty array'
  }
  if (!b.turnstileToken || typeof b.turnstileToken !== 'string') {
    return 'turnstileToken is required'
  }
  if (
    (b.categories as string[]).includes('other') &&
    (!b.comment || typeof b.comment !== 'string' || (b.comment as string).trim() === '')
  ) {
    return 'comment is required when category is "other"'
  }
  return null
}
