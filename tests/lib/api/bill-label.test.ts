import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { POST } from '@/app/api/admin/bill-label/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/bill-label', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(401)
})

it('returns 400 when id is missing', async () => {
  const res = await POST(makeRequest({ tag: 'housing', action: 'add' }))
  expect(res.status).toBe(400)
})

it('returns 400 when action is invalid', async () => {
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'explode' }))
  expect(res.status).toBe(400)
})

it('returns 400 when tag is missing', async () => {
  const res = await POST(makeRequest({ id: 'b1', action: 'remove' }))
  expect(res.status).toBe(400)
})

it('returns 400 when adding an invalid tag', async () => {
  const res = await POST(makeRequest({ id: 'b1', tag: 'invalid-tag', action: 'add' }))
  expect(res.status).toBe(400)
})

it('allows removing a legacy tag not in predefined set', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['infrastructure'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: [] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'infrastructure', action: 'remove' }))
  expect(res.status).toBe(200)
})

it('returns 404 when bill not found', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce(null)
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(404)
})

it('adds a tag and returns updated tags', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['transit'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: ['transit', 'housing'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.tags).toEqual(['transit', 'housing'])
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { tags: ['transit', 'housing'] },
    select: { tags: true },
  })
})

it('is a no-op when adding a tag already present', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['housing'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'add' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.bill.update).not.toHaveBeenCalled()
  const body = await res.json()
  expect(body.tags).toEqual(['housing'])
})

it('removes a tag and returns updated tags', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['housing', 'transit'] })
  mockPrisma.bill.update.mockResolvedValueOnce({ tags: ['transit'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'remove' }))
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.tags).toEqual(['transit'])
  expect(mockPrisma.bill.update).toHaveBeenCalledWith({
    where: { id: 'b1' },
    data: { tags: ['transit'] },
    select: { tags: true },
  })
})

it('is a no-op when removing a tag not present', async () => {
  mockPrisma.bill.findUnique.mockResolvedValueOnce({ id: 'b1', tags: ['transit'] })
  const res = await POST(makeRequest({ id: 'b1', tag: 'housing', action: 'remove' }))
  expect(res.status).toBe(200)
  expect(mockPrisma.bill.update).not.toHaveBeenCalled()
  const body = await res.json()
  expect(body.tags).toEqual(['transit'])
})
