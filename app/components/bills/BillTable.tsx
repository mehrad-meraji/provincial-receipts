import BillRow from './BillRow'

interface BillTableProps {
  bills: Parameters<typeof BillRow>[0]['bill'][]
}

export default function BillTable({ bills }: BillTableProps) {
  if (bills.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 font-mono text-sm">
        No bills found. Run the scraper to populate data.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-zinc-950 dark:border-white">
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500">Bill</th>
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500">Title</th>
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500">Sponsor</th>
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500">Status</th>
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500 text-right">Impact</th>
            <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-500 hidden sm:table-cell">Introduced</th>
          </tr>
        </thead>
        <tbody>
          {bills.map(bill => <BillRow key={bill.id} bill={bill} />)}
        </tbody>
      </table>
    </div>
  )
}
