const SECTORS = [
  {
    label: 'Healthcare',
    amount: '>$21.3B',
    notes: 'Projected shortfall through 2028',
    sourceLabel: 'FAO Health Sector Spending Plan Review 2023',
    sourceUrl: 'https://fao-on.org/en/report/health-2023/',
  },
  {
    label: 'Education (K–12)',
    amount: '>$6B',
    notes: '10-year operating funding shortfall',
    sourceLabel: 'FAO / OSSTF',
    sourceUrl: 'https://www.osstf.on.ca/en-CA/news/ford-government-trying-to-hide-significant-cuts-to-education-funding.aspx',
  },
  {
    label: 'School Infrastructure',
    amount: '$12.7B',
    notes: 'Repair & construction shortfall',
    sourceLabel: 'FAO School Buildings Capital Report 2024',
    sourceUrl: 'https://fao-on.org/en/report/school-boards-capital-2024/',
  },
  {
    label: 'Post-Secondary Education',
    amount: '>$2.7B',
    notes: 'Projected shortfall through 2027–28',
    sourceLabel: 'FAO Expenditure Monitor',
    sourceUrl: 'https://fao-on.org/',
  },
  {
    label: 'Social & Children\'s Services',
    amount: '>$3.7B',
    notes: 'Children, community & social services underspend',
    sourceLabel: 'FAO / CBC',
    sourceUrl: 'https://www.cbc.ca/news/canada/toronto/ontario-fao-mccss-report-1.7225423',
  },
]

const TOTAL = '>$46B'

export default function ServiceCutsPanel() {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded font-mono overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          FAO-documented funding shortfalls · Ford government, 2018–present
        </p>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {SECTORS.map(({ label, amount, notes, sourceLabel, sourceUrl }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-950 dark:text-white">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{notes}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-ontario-red dark:text-red-400 tabular-nums">{amount}</p>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
              >
                {sourceLabel}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total documented shortfall (CAD)</p>
        </div>
        <p className="text-2xl font-bold text-ontario-red dark:text-red-400 tabular-nums">{TOTAL}</p>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Figures represent spending shortfalls documented by the Financial Accountability Office of Ontario (FAO), an independent officer of the Ontario Legislature.
          Shortfalls measure actual or projected government spending against its own stated commitments and population-adjusted baselines.
          These are not direct "cuts" in all cases — many reflect chronic underfunding relative to inflation, population growth, and service demand.
        </p>
      </div>
    </div>
  )
}
