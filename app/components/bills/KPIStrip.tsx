import Link from 'next/link'

interface KPIStripProps {
  scandals: number
  // Pre-formatted strings — null when no budget data has been scraped yet
  budgetDeficitFormatted: string | null
  budgetIsDeficit: boolean
}

export default function KPIStrip({
  scandals,
  budgetDeficitFormatted,
  budgetIsDeficit,
}: KPIStripProps) {
  const kpis: Array<{ label: string; value: string; danger: boolean; href: string | null }> = [
    { label: 'Documented Scandals', value: String(scandals), danger: scandals > 0, href: null },
    { label: 'Documented Shortfall', value: '>$46B', danger: true, href: '/budget' },
    { label: 'Total Obligations', value: '~$1T+', danger: true, href: '/budget#debt' },
  ]

  if (budgetDeficitFormatted !== null) {
    kpis.push({
      label: 'Yearly Provincial Deficit',
      value: budgetDeficitFormatted,
      danger: budgetIsDeficit,
      href: '/budget',
    })
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
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
