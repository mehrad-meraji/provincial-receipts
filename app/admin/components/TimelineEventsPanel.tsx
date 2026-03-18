'use client'

import { useState, type FormEvent } from 'react'
import {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe, Pencil, Trash2, Plus, X, Check,
  type LucideIcon,
} from 'lucide-react'

// Curated icon options admins can pick from
const ICON_OPTIONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: 'Newspaper',      label: 'News',       Icon: Newspaper },
  { name: 'AlertTriangle',  label: 'Alert',      Icon: AlertTriangle },
  { name: 'Flag',           label: 'Milestone',  Icon: Flag },
  { name: 'Gavel',          label: 'Legal',      Icon: Gavel },
  { name: 'Lock',           label: 'Lockdown',   Icon: Lock },
  { name: 'Syringe',        label: 'Health',     Icon: Syringe },
  { name: 'Vote',           label: 'Election',   Icon: Vote },
  { name: 'Megaphone',      label: 'Protest',    Icon: Megaphone },
  { name: 'FileText',       label: 'Document',   Icon: FileText },
  { name: 'Globe',          label: 'World',      Icon: Globe },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map(o => [o.name, o.Icon])
)

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = name ? ICON_MAP[name] : null
  if (!Icon) return <span className={className} />
  return <Icon className={className} size={14} />
}

const TYPE_OPTIONS = ['news', 'context', 'milestone'] as const
type EventType = typeof TYPE_OPTIONS[number]

interface TimelineEventRow {
  id: string
  date: string
  label: string
  description: string | null
  url: string | null
  icon: string | null
  type: string
  published: boolean
}

const EMPTY_FORM = {
  date: '',
  label: '',
  description: '',
  url: '',
  icon: 'Newspaper',
  type: 'news' as EventType,
  published: false,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function TimelineEventsPanel({
  initialEvents,
}: {
  initialEvents: TimelineEventRow[]
}) {
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEdit(ev: TimelineEventRow) {
    setEditingId(ev.id)
    setForm({
      date: ev.date.slice(0, 10),
      label: ev.label,
      description: ev.description ?? '',
      url: ev.url ?? '',
      icon: ev.icon ?? 'Newspaper',
      type: (TYPE_OPTIONS.includes(ev.type as EventType) ? ev.type : 'news') as EventType,
      published: ev.published,
    })
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
  }

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

      if (editingId) {
        const res = await fetch(`/api/admin/timeline-events/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Save failed'); return }
        const updated: TimelineEventRow = await res.json()
        setEvents(prev => prev.map(ev => ev.id === editingId ? updated : ev))
      } else {
        const res = await fetch('/api/admin/timeline-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) { setError((await res.json()).error ?? 'Create failed'); return }
        const created: TimelineEventRow = await res.json()
        setEvents(prev => [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this timeline event?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/timeline-events/${id}`, { method: 'DELETE' })
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function togglePublished(ev: TimelineEventRow) {
    const res = await fetch(`/api/admin/timeline-events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !ev.published }),
    })
    if (!res.ok) return
    const updated: TimelineEventRow = await res.json()
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={showForm ? closeForm : openCreate}
          className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          {showForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> New event</>}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-3 bg-zinc-50 dark:bg-zinc-800/40"
        >
          <p className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            {editingId ? 'Edit event' : 'New event'}
          </p>

          {/* Date + Type row */}
          <div className="flex gap-3">
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="flex-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1.5 bg-white dark:bg-zinc-900"
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as EventType }))}
              className="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1.5 bg-white dark:bg-zinc-900"
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Icon picker */}
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(o => (
              <button
                key={o.name}
                type="button"
                title={o.label}
                onClick={() => setForm(f => ({ ...f, icon: o.name }))}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
                  form.icon === o.name
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <o.Icon size={12} />
                {o.label}
              </button>
            ))}
          </div>

          {/* Label */}
          <input
            type="text"
            required
            placeholder="Label (headline)"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1.5 bg-white dark:bg-zinc-900"
          />

          {/* Description */}
          <input
            type="text"
            placeholder="Short description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1.5 bg-white dark:bg-zinc-900"
          />

          {/* URL */}
          <input
            type="url"
            placeholder="URL (optional)"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1.5 bg-white dark:bg-zinc-900"
          />

          {/* Published */}
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
              className="rounded"
            />
            Publish to timeline
          </label>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
          </button>
        </form>
      )}

      {/* Events table */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[28px_120px_1fr_80px_60px_60px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <span />
          <span>Date</span>
          <span>Label</span>
          <span>Type</span>
          <span className="text-center">Live</span>
          <span />
        </div>

        {events.length === 0 && (
          <p className="text-xs text-zinc-400 font-mono p-4">No timeline events yet.</p>
        )}

        {events.map(ev => (
          <div
            key={ev.id}
            className="grid grid-cols-[28px_120px_1fr_80px_60px_60px] px-3 py-2.5 items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            {/* Icon */}
            <div className="text-amber-500">
              <DynamicIcon name={ev.icon} />
            </div>

            {/* Date */}
            <span className="text-xs font-mono text-zinc-500">{formatDate(ev.date)}</span>

            {/* Label + description */}
            <div className="min-w-0 pr-2">
              <p className="text-xs text-zinc-800 dark:text-zinc-200 truncate">{ev.label}</p>
              {ev.description && (
                <p className="text-[10px] text-zinc-400 truncate">{ev.description}</p>
              )}
            </div>

            {/* Type badge */}
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded w-fit">
              {ev.type}
            </span>

            {/* Published toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => togglePublished(ev)}
                title={ev.published ? 'Published — click to unpublish' : 'Draft — click to publish'}
                className={`p-1 rounded transition-colors ${
                  ev.published
                    ? 'text-green-500 hover:text-green-700'
                    : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500'
                }`}
              >
                {ev.published ? <Check size={14} /> : <Globe size={14} />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => openEdit(ev)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(ev.id)}
                disabled={deletingId === ev.id}
                className="p-1 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
