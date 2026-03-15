'use client'

import { useState } from 'react'

interface NewsItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  hidden: boolean
}

export default function NewsFeedOverride({ initialItems }: { initialItems: NewsItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)

  async function toggleHidden(id: string, hidden: boolean) {
    setLoading(id)
    try {
      await fetch('/api/admin/news-hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hidden }),
      })
      setItems(prev => prev.map(item => item.id === id ? { ...item, hidden } : item))
    } finally {
      setLoading(null)
    }
  }

  const visible = items.filter(i => !i.hidden)
  const hidden = items.filter(i => i.hidden)

  function renderItem(item: NewsItem) {
    return (
      <div key={item.id} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <div className="flex-1 min-w-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-sm hover:underline truncate block">
            {item.headline}
          </a>
          <p className="text-xs text-zinc-400 font-mono">
            {item.source} · {new Date(item.published_at).toLocaleDateString('en-CA')}
          </p>
        </div>
        <button
          onClick={() => toggleHidden(item.id, !item.hidden)}
          disabled={loading === item.id}
          className="px-3 py-1 text-xs shrink-0 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          {item.hidden ? 'Unhide' : 'Hide'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>{visible.map(renderItem)}</div>
      {hidden.length > 0 && (
        <div>
          <button
            onClick={() => setShowHidden(v => !v)}
            className="text-xs text-zinc-400 hover:text-zinc-600 font-mono mb-2"
          >
            {showHidden ? '▼' : '▶'} Hidden articles ({hidden.length})
          </button>
          {showHidden && <div className="opacity-50">{hidden.map(renderItem)}</div>}
        </div>
      )}
    </div>
  )
}
