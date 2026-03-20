const COMPONENTS = [
  {
    label: 'Net Debt (on-book)',
    amount: '~$430B',
    notes: 'Accumulated borrowing; projected by 2026–27',
    sourceLabel: 'FAO Economic & Budget Outlook',
    sourceUrl: 'https://fao-on.org/en/report/ebo-2024/',
  },
  {
    label: 'Infrastructure Maintenance Backlog',
    amount: '~$300B+',
    notes: 'Deferred capital: roads, hospitals, transit, schools',
    sourceLabel: 'Various — FAO, AECOM, FCM',
    sourceUrl: 'https://fao-on.org/en/report/school-boards-capital-2024/',
  },
  {
    label: 'Pension & Post-Employment Obligations',
    amount: '~$200–300B',
    notes: 'Public sector pension + post-employment benefit liabilities',
    sourceLabel: 'Ontario Public Accounts',
    sourceUrl: 'https://www.ontario.ca/page/public-accounts-ontario',
  },
  {
    label: 'Environmental & Contingent Liabilities',
    amount: '>$10B',
    notes: 'Site remediation, legal contingencies, Crown corp. exposure',
    sourceLabel: 'Ontario Public Accounts',
    sourceUrl: 'https://www.ontario.ca/page/public-accounts-ontario',
  },
]

const TOTAL = '~$1T+'

export default function DebtBreakdownPanel() {
  return (
    <div id="debt" className="border border-zinc-200 dark:border-zinc-800 rounded font-mono overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Total obligations estimate · on-book debt + off-book liabilities
        </p>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {COMPONENTS.map(({ label, amount, notes, sourceLabel, sourceUrl }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-950 dark:text-white">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{notes}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-zinc-950 dark:text-white tabular-nums">{amount}</p>
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
        <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total estimated obligations (CAD)</p>
        <p className="text-2xl font-bold text-ontario-red dark:text-red-400 tabular-nums">{TOTAL}</p>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          The ~$1T figure represents total government obligations, not the annual deficit or net debt alone.
          Net debt (~$430B) appears in official accounts; infrastructure backlog, pension obligations, and contingent liabilities
          are largely off-book and disputed between analysts. Methodology varies — some estimates are higher.
          Ontario carries one of the largest sub-sovereign debt loads in the world.
        </p>
      </div>
    </div>
  )
}
