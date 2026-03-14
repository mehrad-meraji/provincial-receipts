import Link from 'next/link'
import StatusBadge from './StatusBadge'
import ImpactScore from './ImpactScore'

interface BillRowProps {
  bill: {
    id: string
    bill_number: string
    title: string
    sponsor: string
    status: string
    impact_score: number
    toronto_flagged: boolean
    date_introduced: Date | null
    tags: string[]
  }
}

export default function BillRow({ bill }: BillRowProps) {
  const dateStr = bill.date_introduced
    ? new Date(bill.date_introduced).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  return (
    <tr className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${bill.toronto_flagged ? 'border-l-2 border-l-red-500' : ''}`}>
      <td className="px-3 py-3 font-mono text-xs text-zinc-500 whitespace-nowrap">
        <Link href={`/bills/${bill.id}`} className="hover:underline text-zinc-950 dark:text-white font-medium">
          {bill.bill_number}
        </Link>
      </td>
      <td className="px-3 py-3 text-sm max-w-xs">
        <Link href={`/bills/${bill.id}`} className="hover:underline font-medium text-zinc-950 dark:text-white leading-snug">
          {bill.title}
        </Link>
        {bill.tags.slice(0, 3).map(tag => (
          <span key={tag} className="ml-1 text-xs text-zinc-400 dark:text-zinc-500 font-mono">#{tag}</span>
        ))}
      </td>
      <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{bill.sponsor}</td>
      <td className="px-3 py-3"><StatusBadge status={bill.status} /></td>
      <td className="px-3 py-3 text-right"><ImpactScore score={bill.impact_score} flagged={bill.toronto_flagged} /></td>
      <td className="px-3 py-3 text-xs text-zinc-400 dark:text-zinc-500 font-mono whitespace-nowrap hidden sm:table-cell">{dateStr}</td>
    </tr>
  )
}
