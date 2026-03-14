interface VoteBreakdownProps {
  voteByParty: Record<string, number> | null
  voteResults: { yes: number; no: number; abstain: number } | null
}

export default function VoteBreakdown({ voteByParty, voteResults }: VoteBreakdownProps) {
  if (!voteResults && !voteByParty) {
    return <p className="text-sm text-zinc-400 font-mono">No vote data available.</p>
  }

  return (
    <div className="space-y-3">
      {voteResults && (
        <div className="flex gap-4 font-mono text-sm">
          <span className="text-green-600 dark:text-green-400">✓ {voteResults.yes} Yes</span>
          <span className="text-red-600 dark:text-red-400">✗ {voteResults.no} No</span>
          {voteResults.abstain > 0 && (
            <span className="text-zinc-400">— {voteResults.abstain} Abstain</span>
          )}
        </div>
      )}
      {voteByParty && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(voteByParty).map(([party, count]) => (
            <span key={party} className="text-xs font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5">
              {party}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
