import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Bill } from '@prisma/client'
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import StatusBadge from '@/app/components/bills/StatusBadge'
import ImpactScore from '@/app/components/bills/ImpactScore'
import LinkedNews from '@/app/components/mpps/LinkedNews'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MPPPage({ params }: PageProps) {
  const { id } = await params

  const mpp = await prisma.mPP.findUnique({
    where: { id },
    include: {
      bills: {
        orderBy: { impact_score: 'desc' },
        take: 20,
      },
      scandals: {
        where: { published: true },
        select: { id: true, title: true, slug: true },
      },
    },
  })

  if (!mpp) notFound()

  // Get news linked to this MPP's bills
  const billIds = mpp.bills.map((b: Bill) => b.id)
  const linkedNews = billIds.length > 0
    ? await prisma.newsEvent.findMany({
        where: { billId: { in: billIds } },
        orderBy: { published_at: 'desc' },
        take: 10,
      })
    : []

  return (
    <main className="min-h-screen">
      <Masthead />
      <DatelineBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:underline">Dashboard</Link>
          <span className="mx-2">→</span>
          <span>{mpp.name}</span>
        </nav>

        {/* MPP header */}
        <div className="border-b-4 border-zinc-950 dark:border-white pb-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{mpp.party}</span>
            {mpp.toronto_area && (
              <span className="text-xs font-mono text-ontario-red dark:text-red-400">Toronto area</span>
            )}
          </div>
          <h1 className="text-2xl font-serif font-bold text-zinc-950 dark:text-white">{mpp.name}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 font-mono">MPP for {mpp.riding}</p>
          {mpp.email && (
            <a href={`mailto:${mpp.email}`} className="text-sm text-zinc-500 hover:underline font-mono mt-1 block">
              {mpp.email}
            </a>
          )}
        </div>

        {/* Bills sponsored */}
        {mpp.bills.length > 0 && (
          <div className="mb-8">
            <SectionDivider label={`Bills Sponsored (${mpp.bills.length})`} />
            <div className="space-y-2">
              {mpp.bills.map((bill: Bill) => (
                <div key={bill.id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="font-mono text-xs text-zinc-400 w-16 shrink-0">{bill.bill_number}</span>
                  <Link href={`/bills/${bill.id}`} className="text-sm hover:underline text-zinc-950 dark:text-white flex-1">
                    {bill.title}
                  </Link>
                  <StatusBadge status={bill.status} />
                  <ImpactScore score={bill.impact_score} flagged={bill.toronto_flagged} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked news */}
        {linkedNews.length > 0 && (
          <div>
            <SectionDivider label="Related News" />
            <LinkedNews items={linkedNews} title="News linked to their bills" />
          </div>
        )}

        {/* Related scandals */}
        {mpp.scandals.length > 0 && (
          <div className="mb-8">
            <SectionDivider label="Related Scandals" />
            <div className="space-y-2">
              {mpp.scandals.map((scandal: { id: string; title: string; slug: string }) => (
                <Link
                  key={scandal.id}
                  href={`/scandals/${scandal.slug}`}
                  className="block border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-sm text-zinc-950 dark:text-white">{scandal.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* External link */}
        {mpp.url && (
          <div className="mt-8">
            <a
              href={mpp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-zinc-500 hover:underline"
            >
              View on Ontario Legislative Assembly →
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
