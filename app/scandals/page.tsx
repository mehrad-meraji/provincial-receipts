import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Documented Scandals | Queen's Park Watch",
}

export default async function ScandalsPage() {
  const scandals = await prisma.scandal.findMany({
    where: { published: true },
    orderBy: { date_reported: 'desc' },
    include: {
      _count: {
        select: {
          legal_actions: true,
          news_links: true,
          bills: true,
          mpps: true,
        },
      },
    },
  })

  return (
    <main className="min-h-screen">
      <Masthead />
      <DatelineBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:underline">Dashboard</Link>
          <span className="mx-2">→</span>
          <span>Scandals</span>
        </nav>

        <SectionDivider label="Documented Scandals" />

        {scandals.length === 0 ? (
          <p className="font-mono text-zinc-400 text-center py-12">No documented scandals yet.</p>
        ) : (
          <div className="relative pl-6">
            {/* Vertical timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />

            {scandals.map((scandal) => {
              const dateLabel = new Date(scandal.date_reported).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              const badges: { label: string; count: number }[] = [
                { label: 'legal actions', count: scandal._count.legal_actions },
                { label: 'bills', count: scandal._count.bills },
                { label: 'news stories', count: scandal._count.news_links },
                { label: 'MPPs', count: scandal._count.mpps },
              ]

              return (
                <div key={scandal.id} className="relative mb-8">
                  {/* Timeline dot */}
                  <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" />

                  {/* Date label */}
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                    {dateLabel}
                  </p>

                  {/* Card */}
                  <Link
                    href={`/scandals/${scandal.slug}`}
                    className="block border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <h2 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">
                      {scandal.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {scandal.summary}
                    </p>

                    {badges.some((b) => b.count > 0) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {badges
                          .filter((b) => b.count > 0)
                          .map((b) => (
                            <span
                              key={b.label}
                              className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5"
                            >
                              {b.count} {b.label}
                            </span>
                          ))}
                      </div>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
