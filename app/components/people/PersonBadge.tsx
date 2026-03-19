const BADGE_STYLES: Record<string, string> = {
  Lobbyist:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Donor:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Director:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Beneficiary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const FALLBACK = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

interface PersonBadgeProps {
  connection_type: string
  className?: string
}

export default function PersonBadge({ connection_type, className = '' }: PersonBadgeProps) {
  const style = BADGE_STYLES[connection_type] ?? FALLBACK
  return (
    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${style} ${className}`}>
      {connection_type}
    </span>
  )
}
