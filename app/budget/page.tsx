import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import BudgetSummaryBar from '@/app/components/budget/BudgetSummaryBar'
import MinistryTable from '@/app/components/budget/MinistryTable'
import ServiceCutsPanel from '@/app/components/budget/ServiceCutsPanel'
import DebtBreakdownPanel from '@/app/components/budget/DebtBreakdownPanel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ontario Budget & Service Cuts',
  description: "Doug Ford's Ontario government budget breakdown: $46B+ in documented public service cuts to healthcare, education, and social services since 2018, plus $1T+ in total provincial obligations.",
  keywords: ['Ontario budget', 'Doug Ford cuts', 'Ontario deficit', 'Ontario debt', 'healthcare cuts Ontario', 'education cuts Ontario', 'FAO Ontario', 'Ontario public services'],
  openGraph: {
    title: 'Ontario Budget & Service Cuts | Fuck Doug Ford',
    description: "$46B+ in documented public service cuts and $1T+ in total obligations under Doug Ford's Ontario government.",
    url: 'https://fuckdougford.ca/budget',
  },
  twitter: {
    title: 'Ontario Budget & Service Cuts | Fuck Doug Ford',
    description: "$46B+ in documented public service cuts and $1T+ in total obligations under Doug Ford's Ontario government.",
  },
}

export default async function BudgetPage() {
  const snapshot = await prisma.budgetSnapshot.findFirst({
    orderBy: { fiscal_year: 'desc' },
    include: {
      ministries: {
        include: { programs: { orderBy: { amount: 'desc' } } },
        orderBy: { amount: 'desc' },
      },
    },
  })

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section>
          <SectionDivider label="Cuts to Public Services Since 2018" />
          <ServiceCutsPanel />
        </section>

        <section>
          <SectionDivider label="Total Estimated Obligations" />
          <DebtBreakdownPanel />
        </section>

        {snapshot ? (
          <>
            <section>
              <SectionDivider label={`${snapshot.fiscal_year} Ontario Budget`} />
              <BudgetSummaryBar
                fiscalYear={snapshot.fiscal_year}
                totalRevenue={snapshot.total_revenue}
                totalExpense={snapshot.total_expense}
                deficit={snapshot.deficit}
                scrapedAt={snapshot.scraped_at}
              />
            </section>

            <section>
              <SectionDivider label="Spending by Ministry" />
              <MinistryTable
                ministries={snapshot.ministries}
                totalExpense={snapshot.total_expense}
              />
            </section>
          </>
        ) : (
          <p className="text-sm text-zinc-400 font-mono py-12 text-center">
            Budget data not yet loaded. Run the scraper to populate.
          </p>
        )}
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Budget · Updated annually</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
