interface ImpactScoreProps {
  score: number
  flagged?: boolean
}

export default function ImpactScore({ score, flagged }: ImpactScoreProps) {
  const colorClass =
    score >= 7 ? 'text-red-600 dark:text-red-400' :
    score >= 4 ? 'text-orange-600 dark:text-orange-400' :
    score >= 1 ? 'text-yellow-600 dark:text-yellow-500' :
    'text-zinc-400 dark:text-zinc-600'

  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${colorClass}`} title={`Toronto impact score: ${score}/10`}>
      {flagged && <span className="mr-1">⚠</span>}
      {score.toFixed(1)}
    </span>
  )
}
