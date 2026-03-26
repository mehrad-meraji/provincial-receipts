'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe, ArrowLeft,
  type LucideIcon,
} from 'lucide-react'

const ICON_OPTIONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: 'Newspaper', label: 'News', Icon: Newspaper },
  { name: 'AlertTriangle', label: 'Alert', Icon: AlertTriangle },
  { name: 'Flag', label: 'Milestone', Icon: Flag },
  { name: 'Gavel', label: 'Legal', Icon: Gavel },
  { name: 'Lock', label: 'Lockdown', Icon: Lock },
  { name: 'Syringe', label: 'Health', Icon: Syringe },
  { name: 'Vote', label: 'Election', Icon: Vote },
  { name: 'Megaphone', label: 'Protest', Icon: Megaphone },
  { name: 'FileText', label: 'Document', Icon: FileText },
  { name: 'Globe', label: 'World', Icon: Globe },
]

const TYPE_OPTIONS = ['news', 'context', 'milestone'] as const
type EventType = typeof TYPE_OPTIONS[number]

const EMPTY_FORM = {
  date: '',
  label: '',
  description: '',
  url: '',
  icon: 'Newspaper',
  type: 'news' as EventType,
  published: false,
}

export default function TimelineEventEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'new'

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/timeline-events/${id}`)
      .then(r => r.json())
      .then(ev => {
        setForm({
          date: ev.date.slice(0, 10),
          label: ev.label,
          description: ev.description ?? '',
          url: ev.url ?? '',
          icon: ev.icon ?? 'Newspaper',
          type: (TYPE_OPTIONS.includes(ev.type) ? ev.type : 'news') as EventType,
          published: ev.published,
        })
      })
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        date: new Date(form.date).toISOString(),
        label: form.label,
        description: form.description || null,
        url: form.url || null,
        icon: form.icon || null,
        type: form.type,
        published: form.published,
      }

      if (isNew) {
        const res = await fetch('/api/admin/timeline-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Create failed'); return }
      } else {
        const res = await fetch(`/api/admin/timeline-events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Save failed'); return }
      }
      router.push('/admin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {isNew ? 'New Timeline Event' : 'Edit Timeline Event'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 text-xs font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="timeline-event-form"
            disabled={saving}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {loading && <p className="font-mono text-xs text-zinc-400">Loading…</p>}

        {!loading && (
          <form id="timeline-event-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Date + Type row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Date</p>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900 w-full"
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Type</p>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))}
                  className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900"
                >
                  {TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Icon</p>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(o => (
                  <button
                    key={o.name}
                    type="button"
                    title={o.label}
                    onClick={() => setForm(f => ({ ...f, icon: o.name }))}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${form.icon === o.name
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                    }`}
                  >
                    <o.Icon size={12} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Label</p>
              <input
                type="text"
                required
                placeholder="Label (headline)"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900 w-full"
              />
            </div>

            {/* Description */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Description</p>
              <input
                type="text"
                placeholder="Short description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900 w-full"
              />
            </div>

            {/* URL */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">URL</p>
              <input
                type="text"
                placeholder="URL (optional)"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900 w-full"
              />
            </div>

            {/* Published */}
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                className="rounded"
              />
              <Globe size={13} />
              Publish to timeline
            </label>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-sm font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : isNew ? 'Create Event' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-4 py-1.5 text-sm font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
