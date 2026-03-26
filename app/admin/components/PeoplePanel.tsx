'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import BulkActionBar from './BulkActionBar'

interface PersonRow {
  id: string
  name: string
  organization: string | null
  confidence: string
  published: boolean
  _count: { connections: number; sources: number }
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
}

export default function PeoplePanel() {
  const router = useRouter()
  const [people, setPeople] = useState<PersonRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchPeople = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/people')
      if (!res.ok) return
      setPeople(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPeople() }, [fetchPeople])

  function handleAdd() { router.push('/admin/people/new') }
  function handleEdit(id: string) { router.push(`/admin/people/${id}`) }

  async function handleTogglePublished(id: string, current: boolean) {
    await fetch(`/api/admin/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    })
    fetchPeople()
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
      prev.size === people.length
        ? new Set()
        : new Set(people.map(p => p.id))
    )
  }

  async function handleBulkAction(action: 'publish' | 'unpublish' | 'delete') {
    if (selected.size === 0) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} person${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/people/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Bulk action failed')
        return
      }
      setSelected(new Set())
      fetchPeople()
    } finally {
      setBulkLoading(false)
    }
  }

  const allSelected = people.length > 0 && selected.size === people.length
  const someSelected = selected.size > 0 && selected.size < people.length

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm uppercase tracking-widest font-bold text-zinc-950 dark:text-white">
          People ({people.length})
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-widest bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
        >
          <Plus size={12} /> Add Person
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : people.length === 0 ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">No people yet.</p>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="pb-2 pt-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected }}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="pb-2 pt-2 pr-4">Name</th>
                  <th className="pb-2 pt-2 pr-4">Organization</th>
                  <th className="pb-2 pt-2 pr-4">Confidence</th>
                  <th className="pb-2 pt-2 pr-4">Links</th>
                  <th className="pb-2 pt-2 pr-4">Published</th>
                  <th className="pb-2 pt-2" />
                </tr>
              </thead>
              <tbody>
                {people.map(p => (
                  <tr
                    key={p.id}
                    className={`border-b border-zinc-100 dark:border-zinc-800/50 ${selected.has(p.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelected(p.id)}
                        disabled={bulkLoading}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-2 pr-4 text-zinc-950 dark:text-white font-semibold">{p.name}</td>
                    <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">{p.organization ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 uppercase text-[10px] tracking-widest ${CONFIDENCE_STYLES[p.confidence] ?? ''}`}>
                        {p.confidence}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                      {p._count.connections}c / {p._count.sources}s
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => handleTogglePublished(p.id, p.published)}
                        className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 ${
                          p.published
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {p.published ? 'Live' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleEdit(p.id)}
                        className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white text-[10px] font-mono uppercase tracking-widest"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <BulkActionBar
            count={selected.size}
            loading={bulkLoading}
            onPublish={() => handleBulkAction('publish')}
            onUnpublish={() => handleBulkAction('unpublish')}
            onDelete={() => handleBulkAction('delete')}
            onClear={() => setSelected(new Set())}
          />
        </div>
      )}
    </section>
  )
}
