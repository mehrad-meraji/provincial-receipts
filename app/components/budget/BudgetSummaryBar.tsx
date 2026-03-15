// Server component — intentionally accepts bigint props from the parent server component.
// Never make this a client component; bigint is not JSON-serialisable across client boundaries.
import { formatBudgetAmount } from '@/lib/format'

interface BudgetSummaryBarProps {
  fiscalYear: string
  totalRevenue: bigint
  totalExpense: bigint
  deficit: bigint
  scrapedAt: Date
}

export default function BudgetSummaryBar({
  fiscalYear,
  totalRevenue,
  totalExpense,
  deficit,
  scrapedAt,
}: BudgetSummaryBarProps) {
  const isDeficit = deficit > 0n

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-4 font-mono">
      <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Revenue</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{formatBudgetAmount(totalRevenue)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Expenses</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{formatBudgetAmount(totalExpense)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            {isDeficit ? 'Deficit' : 'Surplus'}
          </div>
          <div className={`text-xl font-bold ${isDeficit ? 'text-ontario-red dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatBudgetAmount(deficit < 0n ? -deficit : deficit)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Fiscal Year</div>
          <div className="text-xl font-bold text-zinc-950 dark:text-white">{fiscalYear}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
        Last scraped: {scrapedAt.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}
        <a
          href={`https://budget.ontario.ca/${fiscalYear.split('-')[0]}/chapter-3.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Source: Ontario Budget {fiscalYear}
        </a>
      </p>
    </div>
  )
}
