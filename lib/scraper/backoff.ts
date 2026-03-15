import { prisma } from '@/lib/db'

const DEFAULT_BACKOFF_MS = 60 * 60 * 1000 // 1 hour

export async function isBackedOff(source: string): Promise<boolean> {
  try {
    const record = await prisma.sourceBackoff.findUnique({ where: { source } })
    if (!record) return false
    return record.backoffUntil > new Date()
  } catch {
    // DB unavailable — don't block the scraper
    return false
  }
}

export async function setBackoff(
  source: string,
  error?: string,
  durationMs: number = DEFAULT_BACKOFF_MS
): Promise<void> {
  const backoffUntil = new Date(Date.now() + durationMs)
  await prisma.sourceBackoff.upsert({
    where: { source },
    create: { source, backoffUntil, lastError: error ?? null },
    update: { backoffUntil, lastError: error ?? null },
  })
}

export async function clearBackoff(source: string): Promise<void> {
  await prisma.sourceBackoff.deleteMany({ where: { source } })
}
