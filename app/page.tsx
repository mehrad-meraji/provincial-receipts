import Link from 'next/link'
import { prisma } from '@/lib/db'
import Masthead from './components/layout/Masthead'
import DatelineBar from './components/layout/DatelineBar'
import SectionDivider from './components/layout/SectionDivider'
import ScandalFeed from './components/news/ScandalFeed'

// Always SSR — data changes with every cron run
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [recentNews, recentScandals] = await Promise.all([
    prisma.newsEvent.findMany({
      where: { hidden: false },
      orderBy: { published_at: 'desc' },
      take: 20,
    }),
    prisma.scandal.findMany({
      where: { published: true },
      orderBy: { date_reported: 'desc' },
      include: {
        _count: { select: { legal_actions: true, news_links: true, bills: true, mpps: true } },
      },
    }),
  ])

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Scandals Section */}
        {recentScandals.length > 0 && (
          <section>
            <SectionDivider label="Documented Scandals" />
            <div className="relative pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
              {recentScandals.map((scandal) => {
                const dateLabel = new Date(scandal.date_reported).toLocaleDateString('en-CA', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })
                const badges = [
                  { label: 'legal actions', count: scandal._count.legal_actions },
                  { label: 'bills', count: scandal._count.bills },
                  { label: 'news stories', count: scandal._count.news_links },
                  { label: 'MPPs', count: scandal._count.mpps },
                ].filter(b => b.count > 0)
                return (
                  <div key={scandal.id} className="relative mb-8">
                    <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" />
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{dateLabel}</p>
                    <Link
                      href={`/scandals/${scandal.slug}`}
                      className="block border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <h2 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">{scandal.title}</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{scandal.summary}</p>
                      {badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {badges.map(b => (
                            <span key={b.label} className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">
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
          </section>
        )}

        {/* Queen's Park Watch */}
        <section>
          <SectionDivider label="Queen's Park Watch" />
          <ScandalFeed items={recentNews} />
        </section>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
