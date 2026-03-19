import { prisma } from '@/lib/db'
import ReportsPanel from './components/ReportsPanel'
import ScandalQueue from './components/ScandalQueue'
import NewsFeedOverride from './components/NewsFeedOverride'
import BillsPanel from './components/BillsPanel'
import ScandalsPanel from './components/ScandalsPanel'
import TimelineEventsPanel from './components/TimelineEventsPanel'
import FeatureFlagsPanel from './components/FeatureFlagsPanel'
import PeoplePanel from './components/PeoplePanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [reports, pendingScandals, recentNews, timelineEvents] = await Promise.all([
    prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        type: true,
        targetId: true,
        targetTitle: true,
        categories: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.newsEvent.findMany({
      where: { scandal_review_status: 'pending' },
      orderBy: { published_at: 'desc' },
      select: { id: true, headline: true, url: true, source: true, published_at: true, excerpt: true },
    }),
    prisma.newsEvent.findMany({
      orderBy: { published_at: 'desc' },
      take: 50,
      select: { id: true, headline: true, url: true, source: true, published_at: true, hidden: true, is_scandal: true },
    }),
    prisma.timelineEvent.findMany({
      orderBy: { date: 'desc' },
    }),
  ])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <h1 className="text-2xl font-bold font-mono">Admin</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Reports ({reports.length})
        </h2>
        <ReportsPanel
          initialReports={reports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Scandal Queue ({pendingScandals.length})
        </h2>
        <ScandalQueue initialItems={pendingScandals.map(n => ({
          ...n,
          published_at: n.published_at.toISOString(),
        }))} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          News Feed Override
        </h2>
        <NewsFeedOverride initialItems={recentNews.map(n => ({
          ...n,
          published_at: n.published_at.toISOString(),
        }))} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Scandals
        </h2>
        <ScandalsPanel />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Bills
        </h2>
        <BillsPanel />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Timeline Events
        </h2>
        <TimelineEventsPanel
          initialEvents={timelineEvents.map(e => ({
            ...e,
            date: e.date.toISOString(),
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
          }))}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          Feature Flags
        </h2>
        <FeatureFlagsPanel />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          People
        </h2>
        <PeoplePanel />
      </section>

    </main>
  )
}
