import Link from 'next/link'

interface MPPCardProps {
  mpp: {
    id: string
    name: string
    party: string
    riding: string
    toronto_area: boolean
    _count?: { bills: number }
  }
}

const PARTY_COLORS: Record<string, string> = {
  'Progressive Conservative': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'PC': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Ontario Liberal': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Liberal': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'NDP': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Independent': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export default function MPPCard({ mpp }: MPPCardProps) {
  const partyClass = PARTY_COLORS[mpp.party] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

  return (
    <Link href={`/mpps/${mpp.id}`} className="block border border-zinc-200 dark:border-zinc-800 rounded p-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-zinc-950 dark:text-white text-sm">{mpp.name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{mpp.riding}</div>
        </div>
        <span className={`shrink-0 text-xs font-mono px-1.5 py-0.5 rounded ${partyClass}`}>
          {mpp.party.replace('Progressive Conservative', 'PC').replace('Ontario ', '')}
        </span>
      </div>
      {mpp.toronto_area && (
        <div className="mt-2 text-xs font-mono text-ontario-red dark:text-red-400">Toronto area</div>
      )}
      {mpp._count && (
        <div className="mt-1 text-xs text-zinc-400 font-mono">{mpp._count.bills} bills</div>
      )}
    </Link>
  )
}
