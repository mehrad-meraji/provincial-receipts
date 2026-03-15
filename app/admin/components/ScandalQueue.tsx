'use client'

import { useState } from 'react'

interface ScandalItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  excerpt: string | null
}

export default function ScandalQueue({ initialItems }: { initialItems: ScandalItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: 'confirm' | 'reject') {
    setLoading(id)
    try {
      await fetch('/api/admin/scandal-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      setItems(prev => prev.filter(item => item.id !== id))
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-400 font-mono">No pending scandal reviews.</p>
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="font-medium text-sm hover:underline">
                {item.headline}
              </a>
              <p className="text-xs text-zinc-400 font-mono">
                {item.source} · {new Date(item.published_at).toLocaleDateString('en-CA')}
              </p>
              {item.excerpt && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{item.excerpt}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(item.id, 'confirm')}
                disabled={loading === item.id}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => handleAction(item.id, 'reject')}
                disabled={loading === item.id}
                className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
