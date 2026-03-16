import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    newsEvent: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/scandal-review/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  newsEvent: { update: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/scandal-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'n1', action: 'confirm' }))
  expect(res.status).toBe(401)
})

it('returns 400 for invalid action', async () => {
  const res = await POST(makeRequest({ id: 'n1', action: 'explode' }))
  expect(res.status).toBe(400)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ action: 'confirm' }))
  expect(res.status).toBe(400)
})

it('sets is_scandal=true and status=confirmed on confirm', async () => {
  mockPrisma.newsEvent.update.mockResolvedValueOnce({})
  const res = await POST(makeRequest({ id: 'n1', action: 'confirm' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.update).toHaveBeenCalledWith({
    where: { id: 'n1' },
    data: { is_scandal: true, scandal_review_status: 'confirmed' },
  })
})

it('sets is_scandal=false and status=rejected on reject', async () => {
  mockPrisma.newsEvent.update.mockResolvedValueOnce({})
  const res = await POST(makeRequest({ id: 'n1', action: 'reject' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.newsEvent.update).toHaveBeenCalledWith({
    where: { id: 'n1' },
    data: { is_scandal: false, scandal_review_status: 'rejected' },
  })
})
