import NewsItem from './NewsItem'

interface ScandalFeedProps {
  items: Parameters<typeof NewsItem>[0]['item'][]
}

export default function ScandalFeed({ items }: ScandalFeedProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 font-mono text-sm">
        No news items yet. Run the news scraper to populate data.
      </div>
    )
  }

  return (
    <div>
      {items.map(item => <NewsItem key={item.id} item={item} />)}
    </div>
  )
}
