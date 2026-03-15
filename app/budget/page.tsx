import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import BudgetSummaryBar from '@/app/components/budget/BudgetSummaryBar'
import MinistryTable from '@/app/components/budget/MinistryTable'

export const dynamic = 'force-dynamic'

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
      <Masthead />
      <DatelineBar />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
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
