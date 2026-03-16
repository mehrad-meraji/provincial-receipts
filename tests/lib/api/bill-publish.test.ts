import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/bill-publish/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: { update: ReturnType<typeof vi.fn> }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/bill-publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'b1', published: true }))
  expect(res.status).toBe(401)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ published: true }))
  expect(res.status).toBe(400)
})

it('returns 400 when published is not a boolean', async () => {
  const res = await POST(makeRequest({ id: 'b1', published: 'yes' }))
  expect(res.status).toBe(400)
})

it('publishes a bill and returns { published: true }', async () => {
  mockPrisma.bill.update.mockResolvedValueOnce({ published: true })
  const res = await POST(makeRequest({ id: 'b1', published: true }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toEqual({ published: true })
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { published: true },
    select: { published: true },
  })
})

it('unpublishes a bill and returns { published: false }', async () => {
  mockPrisma.bill.update.mockResolvedValueOnce({ published: false })
  const res = await POST(makeRequest({ id: 'b1', published: false }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toEqual({ published: false })
})

it('returns 404 when bill not found (P2025)', async () => {
  const { PrismaClientKnownRequestError } = await import('@prisma/client')
  mockPrisma.bill.update.mockRejectedValueOnce(
    new PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: '0' })
  )
  const res = await POST(makeRequest({ id: 'nonexistent', published: true }))
  expect(res.status).toBe(404)
})
