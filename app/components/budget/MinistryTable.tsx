import MinistryRow from './MinistryRow'
import { formatBudgetAmount, centsToNumber } from '@/lib/format'

interface Program {
  id: string
  name: string
  amount: bigint // used only for formatting; converted before passing to MinistryRow
}

interface Ministry {
  id: string
  name: string
  amount: bigint
  programs: Program[]
}

interface MinistryTableProps {
  ministries: Ministry[]
  totalExpense: bigint
}

export default function MinistryTable({ ministries, totalExpense }: MinistryTableProps) {
  const totalExpenseDollars = centsToNumber(totalExpense)

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b-2 border-zinc-950 dark:border-white">
          <th className="py-2 px-4 text-left text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Ministry / Program</th>
          <th className="py-2 px-4 text-right text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Amount</th>
          <th className="py-2 px-4 hidden sm:table-cell text-xs uppercase tracking-wider font-mono text-zinc-500 dark:text-zinc-400">Share</th>
        </tr>
      </thead>
      <tbody>
        {ministries.map((m) => (
          <MinistryRow
            key={m.id}
            name={m.name}
            amount={centsToNumber(m.amount)}
            totalExpense={totalExpenseDollars}
            formattedAmount={formatBudgetAmount(m.amount)}
            programs={m.programs.map((p) => ({
              id: p.id,
              name: p.name,
              formattedAmount: formatBudgetAmount(p.amount),
            }))}
          />
        ))}
      </tbody>
    </table>
  )
}
