interface NewsItemProps {
  item: {
    id: string
    headline: string
    url: string
    source: string
    published_at: Date
    topic: string | null
    sentiment: string | null
    is_scandal: boolean
    tags: string[]
  }
}

export default function NewsItem({ item }: NewsItemProps) {
  const dateStr = new Date(item.published_at).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className={`border-b border-zinc-100 dark:border-zinc-800 py-3 ${item.is_scandal ? 'border-l-2 border-l-red-500 pl-3' : ''}`}>
      {item.is_scandal && (
        <span className="inline-block text-xs font-mono uppercase tracking-wider text-red-600 dark:text-red-400 font-bold mb-1">
          Scandal
        </span>
      )}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block font-medium text-zinc-950 dark:text-white hover:underline leading-snug text-sm"
      >
        {item.headline}
      </a>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        <span>{item.source}</span>
        <span>·</span>
        <span>{dateStr}</span>
        {item.topic && (
          <>
            <span>·</span>
            <span className="uppercase">{item.topic}</span>
          </>
        )}
      </div>
    </div>
  )
}
