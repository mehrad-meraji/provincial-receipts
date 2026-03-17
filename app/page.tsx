import type { MPP } from '@prisma/client'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatBudgetAmount } from '@/lib/format'
import Masthead from './components/layout/Masthead'
import DatelineBar from './components/layout/DatelineBar'
import SectionDivider from './components/layout/SectionDivider'
// import TorontoAlertBanner from './components/bills/TorontoAlertBanner'
import KPIStrip from './components/bills/KPIStrip'
import BillTable from './components/bills/BillTable'
import ScandalFeed from './components/news/ScandalFeed'
import MPPCard from './components/mpps/MPPCard'

// Always SSR — data changes with every cron run
export const dynamic = 'force-dynamic'

const PASSED_STATUSES = ['Royal Assent', 'Proclaimed in Force']
const ACTIVE_EXCLUDED = [...PASSED_STATUSES, 'Withdrawn']
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

export default async function HomePage() {
  // Fetch all dashboard data in parallel
  const [
    torontoBills,
    activeBillsCount,
    scandalsCount,
    passedLawsCount,
    topBills,
    recentNews,
    torontoMpps,
    budgetSnapshot,
    recentScandals,
  ] = await Promise.all([
    prisma.bill.count({ where: { toronto_flagged: true } }),
    prisma.bill.count({ where: { status: { notIn: ACTIVE_EXCLUDED } } }),
    prisma.newsEvent.count({ where: { is_scandal: true, hidden: false, published_at: { gte: THIRTY_DAYS_AGO } } }),
    prisma.bill.count({ where: { status: { in: PASSED_STATUSES } } }),
    prisma.bill.findMany({
      where: { published: true },
      orderBy: { impact_score: 'desc' },
      take: 20,
      include: { sponsor_mpp: { select: { party: true, riding: true } } },
    }),
    prisma.newsEvent.findMany({
      where: { hidden: false },
      orderBy: { published_at: 'desc' },
      take: 20,
    }),
    prisma.mPP.findMany({
      where: { toronto_area: true },
      include: { _count: { select: { bills: true } } },
      orderBy: { name: 'asc' },
      take: 12,
    }),
    prisma.budgetSnapshot.findFirst({
      orderBy: { fiscal_year: 'desc' },
      select: { deficit: true, total_expense: true },
    }),
    prisma.scandal.findMany({
      where: { published: true },
      orderBy: { date_reported: 'desc' },
      include: {
        _count: { select: { legal_actions: true, news_links: true, bills: true, mpps: true } },
      },
    }),
  ])

  const topBillTitle = topBills[0]?.title

  return (
    <main className="min-h-screen">
      <Masthead />
      {/*<TorontoAlertBanner count={torontoBills} topBillTitle={topBillTitle} />*/}
      <DatelineBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* KPI Strip */}
        <KPIStrip
          torontoBills={torontoBills}
          activeBills={activeBillsCount}
          scandals30d={scandalsCount}
          passedLaws={passedLawsCount}
          budgetDeficitFormatted={budgetSnapshot ? formatBudgetAmount(budgetSnapshot.deficit) : null}
          budgetTotalSpendFormatted={budgetSnapshot ? formatBudgetAmount(budgetSnapshot.total_expense) : null}
          budgetIsDeficit={budgetSnapshot ? budgetSnapshot.deficit > 0n : false}
        />

        {/* Bills Section */}
        <section>
          <SectionDivider label="Bills Affecting Toronto" />
          <BillTable bills={topBills} />
        </section>

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

        {/* Two-column layout: News + MPPs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scandal Feed - wider column */}
          <section className="lg:col-span-2">
            <SectionDivider label="Queen's Park Watch" />
            <ScandalFeed items={recentNews} />
          </section>

          {/* Toronto MPPs - narrower column */}
          { torontoMpps.length > 0 && (
            <section>
              <SectionDivider label="Toronto Area MPPs" />
              <div className="grid grid-cols-1 gap-2">
                {torontoMpps.map((mpp: MPP & { _count: { bills: number } }) => (
                  <MPPCard
                    key={mpp.id}
                    mpp={{
                      ...mpp,
                      _count: { bills: mpp._count.bills },
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
