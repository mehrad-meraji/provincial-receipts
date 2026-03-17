import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import BillTable from '@/app/components/bills/BillTable'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({
    where: { published: true },
    orderBy: { impact_score: 'desc' },
    include: { sponsor_mpp: { select: { party: true, riding: true } } },
  })

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <section>
          <SectionDivider label="Bills" />
          <BillTable bills={bills} />
        </section>
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
