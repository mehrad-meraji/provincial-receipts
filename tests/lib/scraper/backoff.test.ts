import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the module under test
vi.mock('@/lib/db', () => ({
  prisma: {
    sourceBackoff: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { isBackedOff, setBackoff, clearBackoff } from '@/lib/scraper/backoff'
import { prisma } from '@/lib/db'

const mockPrisma = prisma as unknown as {
  sourceBackoff: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isBackedOff', () => {
  it('returns false when no record exists', async () => {
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue(null)
    expect(await isBackedOff('test-source')).toBe(false)
  })

  it('returns true when backoffUntil is in the future', async () => {
    const future = new Date(Date.now() + 60_000)
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue({ source: 'test-source', backoffUntil: future })
    expect(await isBackedOff('test-source')).toBe(true)
  })

  it('returns false when backoffUntil is in the past', async () => {
    const past = new Date(Date.now() - 60_000)
    mockPrisma.sourceBackoff.findUnique.mockResolvedValue({ source: 'test-source', backoffUntil: past })
    expect(await isBackedOff('test-source')).toBe(false)
  })

  it('returns false (not throws) when DB call fails', async () => {
    mockPrisma.sourceBackoff.findUnique.mockRejectedValue(new Error('DB down'))
    expect(await isBackedOff('test-source')).toBe(false)
  })
})

describe('setBackoff', () => {
  it('calls upsert with backoffUntil approximately 1 hour from now by default', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source')
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    const backoffUntil: Date = call.create.backoffUntil
    const diffMs = backoffUntil.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(59 * 60 * 1000)
    expect(diffMs).toBeLessThan(61 * 60 * 1000)
  })

  it('stores the error string in lastError', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source', 'Status code 429')
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    expect(call.create.lastError).toBe('Status code 429')
  })

  it('accepts a custom duration', async () => {
    mockPrisma.sourceBackoff.upsert.mockResolvedValue({})
    await setBackoff('test-source', undefined, 2 * 60 * 60 * 1000) // 2 hours
    const call = mockPrisma.sourceBackoff.upsert.mock.calls[0][0]
    const diffMs = call.create.backoffUntil.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(119 * 60 * 1000)
  })
})

describe('clearBackoff', () => {
  it('calls deleteMany with the correct source', async () => {
    mockPrisma.sourceBackoff.deleteMany.mockResolvedValue({ count: 1 })
    await clearBackoff('test-source')
    expect(mockPrisma.sourceBackoff.deleteMany).toHaveBeenCalledWith({
      where: { source: 'test-source' },
    })
  })

  it('is a no-op (no throw) when no record exists', async () => {
    mockPrisma.sourceBackoff.deleteMany.mockResolvedValue({ count: 0 })
    await expect(clearBackoff('test-source')).resolves.not.toThrow()
  })
})
