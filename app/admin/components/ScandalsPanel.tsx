'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import ScandalForm from './ScandalForm'

interface ScandalRow {
  id: string
  title: string
  slug: string
  date_reported: string
  published: boolean
  _count: {
    legal_actions: number
    sources: number
    news_links: number
    bills: number
    mpps: number
  }
}

interface ScandalsResponse {
  scandals: ScandalRow[]
  total: number
  page: number
  pageSize: number
}

type Filter = 'all' | 'published' | 'draft'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
]

export default function ScandalsPanel() {
  const [scandals, setScandals] = useState<ScandalRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Form overlay state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchScandals = useCallback(async (p: number, f: Filter, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), filter: f })
      if (q.trim()) params.set('q', q)
      const res = await fetch(`/api/admin/scandals?${params}`)
      if (!res.ok) return
      const data: ScandalsResponse = await res.json()
      setScandals(data.scandals)
      setTotal(data.total)
      setPage(data.page)
      setPageSize(data.pageSize)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScandals(page, filter, query)
  }, [fetchScandals, page, filter, query])

  function handleFilterChange(f: Filter) {
    setFilter(f)
    setPage(1)
  }

  function handleQueryChange(q: string) {
    setQuery(q)
    setPage(1)
  }

  function handlePageChange(p: number) {
    setPage(p)
  }

  function handleNewScandal() {
    setEditingId(null)
    setFormOpen(true)
  }

  function handleRowClick(scandal: ScandalRow) {
    setEditingId(scandal.id)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingId(null)
  }

  function handleFormSaved() {
    setFormOpen(false)
    setEditingId(null)
    fetchScandals(page, filter, query)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="relative">
      <div className="flex flex-col border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search scandals…"
            className="flex-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900"
          />
          <div className="flex gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-2.5 py-1 text-xs rounded-full font-mono transition-colors ${
                  filter === f.value
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleNewScandal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            <Plus size={12} />
            New Scandal
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_140px_60px_60px_60px_60px_40px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <span>Title</span>
          <span>Date Reported</span>
          <span className="text-center">Bills</span>
          <span className="text-center">MPPs</span>
          <span className="text-center">Legal</span>
          <span className="text-center">News</span>
          <span className="text-center">
            <Globe size={10} />
          </span>
        </div>

        {/* Rows */}
        <div className="min-h-[400px]">
          {loading && (
            <p className="text-xs text-zinc-400 font-mono p-4">Loading…</p>
          )}
          {!loading && scandals.length === 0 && (
            <p className="text-xs text-zinc-400 font-mono p-4">No scandals found.</p>
          )}
          {!loading && scandals.map(scandal => (
            <button
              key={scandal.id}
              onClick={() => handleRowClick(scandal)}
              className="w-full grid grid-cols-[1fr_140px_60px_60px_60px_60px_40px] px-3 py-2.5 text-left text-sm border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate pr-2">
                {scandal.title}
              </span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {formatDate(scandal.date_reported)}
              </span>
              <span className="text-xs font-mono text-center text-zinc-500">
                {scandal._count.bills > 0 ? scandal._count.bills : '—'}
              </span>
              <span className="text-xs font-mono text-center text-zinc-500">
                {scandal._count.mpps > 0 ? scandal._count.mpps : '—'}
              </span>
              <span className="text-xs font-mono text-center text-zinc-500">
                {scandal._count.legal_actions > 0 ? scandal._count.legal_actions : '—'}
              </span>
              <span className="text-xs font-mono text-center text-zinc-500">
                {scandal._count.news_links > 0 ? scandal._count.news_links : '—'}
              </span>
              <div className="flex items-center justify-center">
                <Globe
                  size={14}
                  className={scandal.published ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-mono text-zinc-500">
          <span>{total} scandal{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen form overlay */}
      {formOpen && (
        <ScandalForm
          scandalId={editingId}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  )
}
