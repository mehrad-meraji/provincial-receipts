'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe, Pencil, Trash2, Plus, Check,
  type LucideIcon,
} from 'lucide-react'
import BulkActionBar from './BulkActionBar'

const ICON_MAP: Record<string, LucideIcon> = {
  Newspaper, AlertTriangle, Flag, Gavel, Lock, Syringe,
  Vote, Megaphone, FileText, Globe,
}

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = name ? ICON_MAP[name] : null
  if (!Icon) return <span className={className} />
  return <Icon className={className} size={14} />
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function TimelineEventsPanel({
  initialEvents,
}: {
  initialEvents: TimelineEventRow[]
}) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

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

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === events.length
        ? new Set()
        : new Set(events.map(e => e.id))
    )
  }

  async function handleBulkAction(action: 'publish' | 'unpublish' | 'delete') {
    if (selected.size === 0) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} event${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/timeline-events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Bulk action failed')
        return
      }
      if (action === 'delete') {
        setEvents(prev => prev.filter(e => !selected.has(e.id)))
      } else {
        setEvents(prev => prev.map(e =>
          selected.has(e.id) ? { ...e, published: action === 'publish' } : e
        ))
      }
      setSelected(new Set())
    } finally {
      setBulkLoading(false)
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
          onClick={() => router.push('/admin/timeline-events/new')}
          className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <Plus size={12} /> New event
        </button>
      </div>

      {/* Events table */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[28px_28px_120px_1fr_80px_60px_60px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={events.length > 0 && selected.size === events.length}
              ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < events.length }}
              onChange={toggleAll}
              className="cursor-pointer"
            />
          </div>
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
            className={`grid grid-cols-[28px_28px_120px_1fr_80px_60px_60px] px-3 py-2.5 items-center border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
              selected.has(ev.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selected.has(ev.id)}
                onChange={() => toggleSelected(ev.id)}
                disabled={bulkLoading}
                className="cursor-pointer"
              />
            </div>
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
                className={`p-1 rounded transition-colors ${ev.published
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
                onClick={() => router.push(`/admin/timeline-events/${ev.id}`)}
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
        <BulkActionBar
          count={selected.size}
          loading={bulkLoading}
          onPublish={() => handleBulkAction('publish')}
          onUnpublish={() => handleBulkAction('unpublish')}
          onDelete={() => handleBulkAction('delete')}
          onClear={() => setSelected(new Set())}
        />
      </div>
    </div>
  )
}
