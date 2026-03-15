import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import type { ScandalReviewStatus } from '@/lib/ai/classify'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, action } = body as { id: string; action: 'confirm' | 'reject' }

  if (!id || !['confirm', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const status: ScandalReviewStatus = action === 'confirm' ? 'confirmed' : 'rejected'

  await prisma.newsEvent.update({
    where: { id },
    data: {
      is_scandal: action === 'confirm',
      scandal_review_status: status,
    },
  })

  return NextResponse.json({ ok: true })
}
