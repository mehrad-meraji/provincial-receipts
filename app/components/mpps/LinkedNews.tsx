import NewsItem from '../news/NewsItem'

interface LinkedNewsProps {
  items: Parameters<typeof NewsItem>[0]['item'][]
  title?: string
}

export default function LinkedNews({ items, title = 'Related News' }: LinkedNewsProps) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">{title}</h3>
      <div>
        {items.map(item => <NewsItem key={item.id} item={item} />)}
      </div>
    </div>
  )
}
