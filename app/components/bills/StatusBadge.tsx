interface StatusBadgeProps {
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  'Royal Assent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'Proclaimed in Force': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'Second Reading': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'Third Reading': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'First Reading': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  'Committee': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  'Withdrawn': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 line-through',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium ${colorClass}`}>
      {status}
    </span>
  )
}
