interface TorontoAlertBannerProps {
  count: number
  topBillTitle?: string
}

export default function TorontoAlertBanner({ count, topBillTitle }: TorontoAlertBannerProps) {
  if (count === 0) return null

  return (
    <div className="w-full bg-ontario-red text-white px-4 py-3 text-sm font-mono flex flex-col md:flex-row justify-center items-center gap-3">
      <span className="font-bold uppercase tracking-wider text-red-100">⚠ Toronto Alert</span>
      <span className="text-red-100">
        {count} bill{count !== 1 ? 's' : ''} directly affect Toronto
        {topBillTitle ? ` · Highest impact: ${topBillTitle}` : ''}
      </span>
    </div>
  )
}
