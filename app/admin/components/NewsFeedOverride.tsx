'use client'

import { useState, type FormEvent } from 'react'

interface NewsItem {
  id: string
  headline: string
  url: string
  source: string
  published_at: string
  hidden: boolean
  is_scandal: boolean
}

export default function NewsFeedOverride({ initialItems }: { initialItems: NewsItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formUrl, setFormUrl] = useState('')
  const [formHeadline, setFormHeadline] = useState('')
  const [formSource, setFormSource] = useState('')
  const [formIsScandal, setFormIsScandal] = useState(false)

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

  async function toggleScandal(id: string, wasScandal: boolean) {
    setLoading(id)
    try {
      await fetch('/api/admin/scandal-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: wasScandal ? 'reject' : 'confirm' }),
      })
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_scandal: !wasScandal } : item))
    } finally {
      setLoading(null)
    }
  }

  async function submitNewItem(e: FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      let res: Response
      try {
        res = await fetch('/api/admin/news-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ headline: formHeadline, url: formUrl, source: formSource, is_scandal: formIsScandal }),
        })
      } catch {
        setFormError('Network error — please try again')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? 'Something went wrong')
        return
      }
      setItems(prev => [data, ...prev])
      setFormUrl('')
      setFormHeadline('')
      setFormSource('')
      setFormIsScandal(false)
      setShowForm(false)
    } finally {
      setFormLoading(false)
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
          onClick={() => toggleScandal(item.id, item.is_scandal)}
          disabled={loading === item.id}
          className={
            item.is_scandal
              ? 'px-3 py-1 text-xs shrink-0 bg-ontario-red text-white rounded hover:bg-red-700 disabled:opacity-50'
              : 'px-3 py-1 text-xs shrink-0 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50'
          }
        >
          {item.is_scandal ? 'Unscandal' : 'Scandal'}
        </button>
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
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(v => !v); setFormError(null) }}
          className="text-xs font-mono text-zinc-400 hover:text-zinc-600"
        >
          {showForm ? '✕ Cancel' : '＋ Add article'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitNewItem} className="space-y-2 border border-zinc-200 dark:border-zinc-700 rounded p-3">
          <input
            type="url"
            placeholder="URL"
            value={formUrl}
            onChange={e => setFormUrl(e.target.value)}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
          />
          <input
            type="text"
            placeholder="Headline"
            value={formHeadline}
            onChange={e => setFormHeadline(e.target.value)}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
          />
          <input
            type="text"
            placeholder="Source"
            value={formSource}
            onChange={e => setFormSource(e.target.value)}
            required
            className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formIsScandal}
              onChange={e => setFormIsScandal(e.target.checked)}
            />
            Scandal?
          </label>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <button
            type="submit"
            disabled={formLoading}
            className="px-3 py-1 text-xs bg-zinc-800 text-white rounded hover:bg-zinc-700 disabled:opacity-50"
          >
            {formLoading ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

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
