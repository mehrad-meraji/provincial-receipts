import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    report: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock global fetch for Turnstile verification
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '@/app/api/report/route'
import { prisma } from '@/lib/db'

const mockPrisma = prisma as unknown as {
  report: { count: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  type: 'news',
  targetId: 'item-1',
  targetTitle: 'Some headline',
  categories: ['wrong-information'],
  turnstileToken: 'tok_xyz',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.TURNSTILE_SECRET_KEY = 'test-secret'
})

it('returns 400 for invalid input', async () => {
  const res = await POST(makeRequest({ type: 'bad' }))
  expect(res.status).toBe(400)
})

it('returns 403 when Turnstile verification fails', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: false }),
  })
  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(403)
})

it('returns 429 when IP rate limit exceeded', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.count.mockResolvedValueOnce(5)
  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(429)
})

it('skips rate limit check and succeeds when IP header is absent', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.create.mockResolvedValueOnce({ id: 'r2' })

  const reqNoIp = new NextRequest('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // no x-forwarded-for
    body: JSON.stringify(validBody),
  })
  const res = await POST(reqNoIp)
  expect(res.status).toBe(200)
  expect(mockPrisma.report.count).not.toHaveBeenCalled()
})

it('returns 503 when Turnstile service is unavailable', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))
  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(503)
})

it('inserts report and returns ok:true on success', async () => {
  mockFetch.mockResolvedValueOnce({
    json: async () => ({ success: true }),
  })
  mockPrisma.report.count.mockResolvedValueOnce(0)
  mockPrisma.report.create.mockResolvedValueOnce({ id: 'r1' })

  const res = await POST(makeRequest(validBody))
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json).toEqual({ ok: true })
  expect(mockPrisma.report.create).toHaveBeenCalledOnce()
})
