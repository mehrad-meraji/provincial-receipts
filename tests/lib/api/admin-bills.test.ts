import { it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    bill: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}))

import { GET } from '@/app/api/admin/bills/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const mockPrisma = prisma as unknown as {
  bill: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/bills')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

const fakeBill = {
  id: 'b1',
  bill_number: 'B-42',
  title: 'Housing Act',
  tags: ['housing'],
  toronto_flagged: true,
  published: true,
  date_introduced: new Date('2026-01-15'),
}

beforeEach(() => vi.clearAllMocks())

it('returns 401 when unauthenticated', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)
  const res = await GET(makeRequest())
  expect(res.status).toBe(401)
})

it('returns paginated bills with default params', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([fakeBill])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.page).toBe(1)
  expect(body.pageSize).toBe(25)
  expect(body.total).toBe(1)
  expect(body.bills).toHaveLength(1)
  expect(body.bills[0].id).toBe('b1')
})

it('returns ISO date strings for date_introduced', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([fakeBill])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  const body = await res.json()
  expect(body.bills[0].date_introduced).toBe('2026-01-15T00:00:00.000Z')
})

it('returns null for null date_introduced', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([{ ...fakeBill, date_introduced: null }])
  mockPrisma.bill.count.mockResolvedValueOnce(1)
  const res = await GET(makeRequest())
  const body = await res.json()
  expect(body.bills[0].date_introduced).toBeNull()
})

it('applies published filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'published' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ published: true }) })
  )
})

it('applies toronto filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'toronto' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ toronto_flagged: true }) })
  )
})

it('applies unpublished filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'unpublished' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: expect.objectContaining({ published: false }) })
  )
})

it('applies search query (case-insensitive) to bill_number and title', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ q: 'housing' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where.OR).toEqual([
    { bill_number: { contains: 'housing', mode: 'insensitive' } },
    { title: { contains: 'housing', mode: 'insensitive' } },
  ])
})

it('treats unknown filter as all (no filter)', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ filter: 'bogus' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where).not.toHaveProperty('published')
  expect(call.where).not.toHaveProperty('toronto_flagged')
})

it('treats empty q as no search filter', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ q: '' }))
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.where).not.toHaveProperty('OR')
})

it('treats invalid page as page 1', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest({ page: 'abc' }))
  expect(mockPrisma.bill.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 0 })
  )
})

it('returns empty bills with correct total for page beyond last', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(5)
  const res = await GET(makeRequest({ page: '99' }))
  const body = await res.json()
  expect(body.bills).toEqual([])
  expect(body.total).toBe(5)
})

it('uses correct sort order', async () => {
  mockPrisma.bill.findMany.mockResolvedValueOnce([])
  mockPrisma.bill.count.mockResolvedValueOnce(0)
  await GET(makeRequest())
  const call = mockPrisma.bill.findMany.mock.calls[0][0]
  expect(call.orderBy).toEqual([
    { date_introduced: { sort: 'desc', nulls: 'last' } },
    { id: 'asc' },
  ])
})
