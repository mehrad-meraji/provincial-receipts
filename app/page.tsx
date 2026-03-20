import Link from 'next/link'
import { prisma } from '@/lib/db'
import Masthead from './components/layout/Masthead'
import DatelineBar from './components/layout/DatelineBar'
import PeopleCarousel from './components/people/PeopleCarousel'
import { getPeopleForCarousel } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
import {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe, type LucideIcon,
} from 'lucide-react'
import KPIStrip from '@/app/components/bills/KPIStrip'
import { formatBudgetAmount } from '@/lib/format'
// import SectionDivider from './components/layout/SectionDivider'
// import ScandalFeed from './components/news/ScandalFeed'

// Always SSR — data changes with every cron run
export const dynamic = 'force-dynamic'

const ICON_MAP: Record<string, LucideIcon> = {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe,
}

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = name ? ICON_MAP[name] : null
  if (!Icon) return <Newspaper className={className} size={12} />
  return <Icon className={className} size={12} />
}

export default async function HomePage() {
  const [
    // recentNews,
    recentScandals,
    dbTimelineEvents,
    flags,
    budgetSnapshot,
  ] = await Promise.all([
    // prisma.newsEvent.findMany({
    //   where: { hidden: false },
    //   orderBy: { published_at: 'desc' },
    //   take: 20,
    // }),
    prisma.scandal.findMany({
      where: { published: true },
      orderBy: { date_reported: 'desc' },
      include: {
        _count: { select: { legal_actions: true, news_links: true, bills: true, mpps: true } },
      },
    }),
    // Graceful fallback until migration is applied
    (prisma.timelineEvent as typeof prisma.timelineEvent | undefined)
      ?.findMany({ where: { published: true }, orderBy: { date: 'desc' } })
      .catch(() => []) ?? Promise.resolve([]),
    getFeatureFlags(),
    prisma.budgetSnapshot.findFirst({
      orderBy: { fiscal_year: 'desc' },
      select: { deficit: true },
    }),
  ])

  const carouselPeople = flags.named_individuals_enabled
    ? await getPeopleForCarousel()
    : []

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 pt-6">
        <KPIStrip
          scandals={recentScandals.length}
          budgetDeficitFormatted={budgetSnapshot ? formatBudgetAmount(budgetSnapshot.deficit < 0n ? -budgetSnapshot.deficit : budgetSnapshot.deficit) : null}
          budgetIsDeficit={budgetSnapshot ? budgetSnapshot.deficit > 0n : false}
        />
      </div>

      {carouselPeople.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <PeopleCarousel people={carouselPeople} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Scandals Section */}
        {recentScandals.length > 0 && (
          <section>
            <h1 className="mb-6 text-md uppercase font-bold dark:text-zinc-400 text-zinc-600">Documented Scandals</h1>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
              {(() => {
                // Hard-coded historical markers
                const calendarEvents: { date: Date; label: string; icon: string; url?: string }[] = [
                  { date: new Date('2024-11-18'), label: 'Ford wins third majority',        icon: 'Vote' },
                  { date: new Date('2022-06-02'), label: 'Ford wins second majority',       icon: 'Vote' },
                  { date: new Date('2021-09-29'), label: 'Ontario lifts vaccine passport',  icon: 'Syringe' },
                  { date: new Date('2021-04-07'), label: 'Third COVID lockdown',            icon: 'Lock' },
                  { date: new Date('2020-11-23'), label: 'Second COVID lockdown',           icon: 'Lock' },
                  { date: new Date('2020-03-17'), label: 'Ontario declares COVID emergency', icon: 'AlertTriangle' },
                  { date: new Date('2020-01-25'), label: 'First COVID case in Canada',      icon: 'AlertTriangle' },
                  { date: new Date('2018-06-07'), label: 'Ford elected Premier',            icon: 'Vote' },
                ]

                type ScandalItem = { kind: 'scandal'; date: Date; data: typeof recentScandals[0] }
                type EventItem   = { kind: 'event';   date: Date; label: string; icon: string; url?: string | null }
                type Item = ScandalItem | EventItem

                // Merge scandals + DB timeline events + hard-coded markers into one sorted list
                const allItems: Item[] = [
                  ...recentScandals.map((s: (typeof recentScandals)[number]) => ({
                    kind: 'scandal' as const,
                    date: new Date(s.date_reported),
                    data: s,
                  })),
                  ...dbTimelineEvents.map((e: { date: Date; label: string; icon: string | null; url: string | null }) => ({
                    kind: 'event' as const,
                    date: new Date(e.date),
                    label: e.label,
                    icon: e.icon ?? 'Newspaper',
                    url: e.url,
                  })),
                  ...calendarEvents.map(e => ({
                    kind: 'event' as const,
                    date: e.date,
                    label: e.label,
                    icon: e.icon,
                    url: e.url ?? null,
                  })),
                ].sort((a, b) => b.date.getTime() - a.date.getTime())
                  // Include events up to end of current month; future events within the month
                  // display as the 1st of the month until their actual date arrives.
                  .filter((() => {
                    const now = new Date()
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    return (item: Item) => item.kind === 'scandal' || item.date <= endOfMonth
                  })())
                  .map((item): Item => {
                    if (item.kind === 'event' && item.date > new Date()) {
                      const d = new Date()
                      return { ...item, date: new Date(d.getFullYear(), d.getMonth(), 1) }
                    }
                    return item
                  })
                  // Re-sort after date clamping so year markers always appear before their year's items
                  .sort((a, b) => b.date.getTime() - a.date.getTime())

                const nodes: React.ReactNode[] = []
                let lastYear: number | null = null

                for (const item of allItems) {
                  const year = item.date.getFullYear()

                  // Year marker — fires whenever any item (scandal or event) crosses a year boundary
                  if (year !== lastYear) {
                    nodes.push(
                      <div key={`year-${year}`} className="relative mb-6 -ml-1">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-zinc-300 dark:bg-zinc-600" />
                        <span className="ml-2 font-mono text-xs font-bold dark:text-zinc-400 text-zinc-600 uppercase tracking-widest">
                          {year}
                        </span>
                      </div>
                    )
                    lastYear = year
                  }

                  if (item.kind === 'scandal') {
                    const scandal = item.data
                    const dateLabel = item.date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
                    const badges = [
                      { label: 'legal actions', count: scandal._count.legal_actions },
                      { label: 'bills',         count: scandal._count.bills },
                      { label: 'news stories',  count: scandal._count.news_links },
                      { label: 'MPPs',          count: scandal._count.mpps },
                    ].filter(b => b.count > 0)

                    nodes.push(
                      <div key={scandal.id} className="relative mb-8">
                        <div className="absolute -left-4.75 top-1 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" />
                        <p className="font-mono text-[10px] dark:text-zinc-400 text-zinc-600 uppercase tracking-widest mb-2">{dateLabel}</p>
                        <Link
                          href={`/scandals/${scandal.slug}`}
                          className="block border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <h2 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">{scandal.title}</h2>
                          <p className="text-sm dark:text-zinc-400 text-zinc-600 mt-1 line-clamp-3">
                            {scandal.tldr || scandal.summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                          </p>
                          {badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {badges.map(b => (
                                <span key={b.label} className="font-mono text-[10px] dark:text-zinc-400 text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">
                                  {b.count} {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      </div>
                    )
                  } else {
                    const inner = (
                      <div className="flex items-center gap-2 py-1">
                        <span className="font-mono text-[10px] uppercase tracking-widest dark:text-zinc-400 text-zinc-600">
                          {item.date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {' — '}{item.label}
                        </span>
                      </div>
                    )
                    nodes.push(
                      <div key={`evt-${item.label}-${item.date.toISOString()}`} className="relative mb-6">
                        <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 dark:text-zinc-400 text-zinc-600 bg-white dark:bg-zinc-950" />
                        {item.url
                          ? item.url.startsWith('/')
                            ? <Link href={item.url} className="hover:opacity-75 transition-opacity">{inner}</Link>
                            : <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">{inner}</a>
                          : inner
                        }
                      </div>
                    )
                  }
                }

                return nodes
              })()}
            </div>
          </section>
        )}

        {/* Queen's Park Watch */}
        {/*<section>*/}
        {/*  <SectionDivider label="Queen's Park Watch" />*/}
        {/*  <ScandalFeed items={recentNews} />*/}
        {/*</section>*/}
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs dark:text-zinc-400 text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
