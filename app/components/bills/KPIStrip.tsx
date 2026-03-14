interface KPIStripProps {
  torontoBills: number
  activeBills: number
  scandals30d: number
  passedLaws: number
}

export default function KPIStrip({ torontoBills, activeBills, scandals30d, passedLaws }: KPIStripProps) {
  const kpis = [
    { label: 'Toronto Bills', value: torontoBills, danger: torontoBills > 10 },
    { label: 'Active Bills', value: activeBills, danger: false },
    { label: 'Scandals (30d)', value: scandals30d, danger: scandals30d > 0 },
    { label: 'Passed Laws', value: passedLaws, danger: false },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
      {kpis.map(({ label, value, danger }) => (
        <div key={label} className="bg-white dark:bg-zinc-950 px-4 py-3 text-center">
          <div className={`text-2xl font-mono font-bold tabular-nums ${danger ? 'text-red-600 dark:text-red-400' : 'text-zinc-950 dark:text-white'}`}>
            {value}
          </div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
