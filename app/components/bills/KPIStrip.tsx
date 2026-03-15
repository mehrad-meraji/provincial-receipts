import Link from 'next/link'

interface KPIStripProps {
  torontoBills: number
  activeBills: number
  scandals30d: number
  passedLaws: number
  // Pre-formatted strings — null when no budget data has been scraped yet
  budgetDeficitFormatted: string | null
  budgetTotalSpendFormatted: string | null
  budgetIsDeficit: boolean
}

export default function KPIStrip({
  torontoBills,
  activeBills,
  scandals30d,
  passedLaws,
  budgetDeficitFormatted,
  budgetTotalSpendFormatted,
  budgetIsDeficit,
}: KPIStripProps) {
  const kpis: Array<{ label: string; value: string; danger: boolean; href: string | null }> = [
    { label: 'Toronto Bills', value: String(torontoBills), danger: torontoBills > 10, href: null },
    { label: 'Active Bills', value: String(activeBills), danger: false, href: null },
    { label: 'Scandals (30d)', value: String(scandals30d), danger: scandals30d > 0, href: null },
    { label: 'Passed Laws', value: String(passedLaws), danger: false, href: null },
  ]

  if (budgetDeficitFormatted !== null && budgetTotalSpendFormatted !== null) {
    kpis.push(
      {
        label: 'Provincial Deficit',
        value: budgetDeficitFormatted,
        danger: budgetIsDeficit,
        href: '/budget',
      },
      {
        label: 'Annual Spend',
        value: budgetTotalSpendFormatted,
        danger: false,
        href: '/budget',
      }
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
      {kpis.map(({ label, value, danger, href }) => {
        const content = (
          <div className="bg-white dark:bg-zinc-950 px-4 py-3 text-center">
            <div className={`text-2xl font-mono font-bold tabular-nums ${danger ? 'text-ontario-red dark:text-red-400' : 'text-zinc-950 dark:text-white'}`}>
              {value}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {label}
            </div>
          </div>
        )
        return href ? (
          <Link key={label} href={href} className="hover:opacity-80 transition-opacity">
            {content}
          </Link>
        ) : (
          <div key={label}>{content}</div>
        )
      })}
    </div>
  )
}
