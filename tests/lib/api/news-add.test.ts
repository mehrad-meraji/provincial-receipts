import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    newsEvent: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/news-add/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  newsEvent: { create: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/news-add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(401)
})

it('returns 400 when headline is missing', async () => {
  const res = await POST(makeRequest({ url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when url is missing', async () => {
  const res = await POST(makeRequest({ headline: 'h', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when source is missing', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 400 when is_scandal is not a boolean', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: 'yes' }))
  expect(res.status).toBe(400)
})

it('returns 400 when is_scandal is omitted', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's' }))
  expect(res.status).toBe(400)
})

it('returns 400 when url is not a valid URL', async () => {
  const res = await POST(makeRequest({ headline: 'h', url: 'not-a-url', source: 's', is_scandal: false }))
  expect(res.status).toBe(400)
})

it('returns 409 on duplicate URL', async () => {
  const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' })
  mockPrisma.newsEvent.create.mockRejectedValueOnce(err)
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(409)
})

it('creates record with correct fields for non-scandal', async () => {
  const now = new Date()
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: false,
  })
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      headline: 'h',
      url: 'https://example.com',
      source: 's',
      is_scandal: false,
      hidden: false,
      tags: [],
      scandal_review_status: null,
      published_at: expect.any(Date),
    }),
    select: expect.objectContaining({
      id: true,
      headline: true,
      url: true,
      source: true,
      published_at: true,
      hidden: true,
      is_scandal: true,
    }),
  })
})

it('sets scandal_review_status=confirmed for scandal items', async () => {
  const now = new Date()
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n2', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: true,
  })
  await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: true }))
  expect(mockPrisma.newsEvent.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      is_scandal: true,
      scandal_review_status: 'confirmed',
    }),
    select: expect.objectContaining({
      id: true,
      headline: true,
      url: true,
      source: true,
      published_at: true,
      hidden: true,
      is_scandal: true,
    }),
  })
})

it('returns the created item in NewsItem shape', async () => {
  const now = new Date('2026-03-15T12:00:00.000Z')
  mockPrisma.newsEvent.create.mockResolvedValueOnce({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    published_at: now, hidden: false, is_scandal: false,
  })
  const res = await POST(makeRequest({ headline: 'h', url: 'https://example.com', source: 's', is_scandal: false }))
  const body = await res.json()
  expect(body).toMatchObject({
    id: 'n1', headline: 'h', url: 'https://example.com', source: 's',
    hidden: false, is_scandal: false,
  })
  expect(typeof body.published_at).toBe('string')
})
