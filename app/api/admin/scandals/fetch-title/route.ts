import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { url } = body as { url: string }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FuckDougford/1.0)' },
    })
    const html = await res.text()
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = match ? match[1].trim() : ''
    return NextResponse.json({ title })
  } catch {
    return NextResponse.json({ title: '' })
  }
}
