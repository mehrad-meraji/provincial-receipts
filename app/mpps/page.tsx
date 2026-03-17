import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import MPPCard from '@/app/components/mpps/MPPCard'

export const dynamic = 'force-dynamic'

export default async function MPPsPage() {
  const mpps = await prisma.mPP.findMany({
    include: { _count: { select: { bills: true } } },
    orderBy: { name: 'asc' },
  })

  const torontoMpps = mpps.filter((m) => m.toronto_area)
  const otherMpps = mpps.filter((m) => !m.toronto_area)

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {torontoMpps.length > 0 && (
          <section>
            <SectionDivider label="Toronto Area MPPs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {torontoMpps.map((mpp) => (
                <MPPCard key={mpp.id} mpp={mpp} />
              ))}
            </div>
          </section>
        )}

        {otherMpps.length > 0 && (
          <section>
            <SectionDivider label="All MPPs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {otherMpps.map((mpp) => (
                <MPPCard key={mpp.id} mpp={mpp} />
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600 font-mono">
        <p>Data sourced from Ontario Legislative Assembly · Updated every 6 hours</p>
        <p className="mt-1">This is a civic transparency project. Not affiliated with the Government of Ontario.</p>
      </footer>
    </main>
  )
}
