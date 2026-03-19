import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const DEFAULT_CONFIG = { id: 'singleton', named_individuals_enabled: false }

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json(config ?? DEFAULT_CONFIG)
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { named_individuals_enabled?: boolean }

  const config = await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      named_individuals_enabled: body.named_individuals_enabled ?? false,
    },
    update: {
      ...(body.named_individuals_enabled !== undefined && {
        named_individuals_enabled: body.named_individuals_enabled,
      }),
    },
  })

  return NextResponse.json(config)
}
