'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import BulkActionBar from './BulkActionBar'

interface Bill {
  id: string
  bill_number: string
  title: string
  tags: string[]
  toronto_flagged: boolean
  published: boolean
  date_introduced: string | null
}

interface BillsResponse {
  bills: Bill[]
  total: number
  page: number
  pageSize: number
}

type Filter = 'all' | 'published' | 'toronto' | 'unpublished'

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Toronto-flagged', value: 'toronto' },
  { label: 'Unpublished', value: 'unpublished' },
]

export default function BillsPanel() {
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchBills = useCallback(async (p: number, f: Filter, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), filter: f })
      if (q.trim()) params.set('q', q)
      const res = await fetch(`/api/admin/bills?${params}`)
      if (!res.ok) return
      const data: BillsResponse = await res.json()
      setBills(data.bills)
      setTotal(data.total)
      setPage(data.page)
      setPageSize(data.pageSize)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBills(page, filter, query)
  }, [fetchBills, page, filter, query])

  function handleFilterChange(f: Filter) { setFilter(f); setPage(1); setSelected(new Set()) }
  function handleQueryChange(q: string) { setQuery(q); setPage(1); setSelected(new Set()) }
  function handlePageChange(p: number) { setPage(p); setSelected(new Set()) }
  function handleRowClick(bill: Bill) { router.push(`/admin/bills/${bill.id}`) }

  function toggleSelected(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === bills.length
        ? new Set()
        : new Set(bills.map(b => b.id))
    )
  }

  async function handleBulkAction(action: 'publish' | 'unpublish') {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/bills/bulk', {
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
      fetchBills(page, filter, query)
    } finally {
      setBulkLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const allSelected = bills.length > 0 && selected.size === bills.length
  const someSelected = selected.size > 0 && selected.size < bills.length

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden flex flex-col h-[600px]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search bills…"
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
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[32px_80px_1fr_160px_40px_40px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
              className="cursor-pointer"
            />
          </div>
          <span>Bill</span>
          <span>Title</span>
          <span>Tags</span>
          <span className="text-center">
            <Building2 size={10} />
          </span>
          <span className="text-center">
            <Globe size={10} />
          </span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-xs text-zinc-400 font-mono p-4">Loading…</p>
          )}
          {!loading && bills.length === 0 && (
            <p className="text-xs text-zinc-400 font-mono p-4">No bills found.</p>
          )}
          {!loading && bills.map(bill => (
            <button
              key={bill.id}
              onClick={() => handleRowClick(bill)}
              className={`w-full grid grid-cols-[32px_80px_1fr_160px_40px_40px] px-3 py-2.5 text-left text-sm border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                selected.has(bill.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''
              }`}
            >
              <span
                className="flex items-center justify-center"
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selected.has(bill.id)}
                  onChange={() => toggleSelected(bill.id)}
                  onClick={e => e.stopPropagation()}
                  disabled={bulkLoading}
                  className="cursor-pointer"
                />
              </span>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {bill.bill_number}
              </span>
              <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate pr-2">
                {bill.title}
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {bill.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {bill.tags.length > 2 && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    +{bill.tags.length - 2}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Building2
                  size={14}
                  className={bill.toronto_flagged ? 'text-orange-500' : 'text-zinc-300 dark:text-zinc-600'}
                />
              </div>
              <div className="flex items-center justify-center">
                <Globe
                  size={14}
                  className={bill.published ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600'}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        <BulkActionBar
          count={selected.size}
          loading={bulkLoading}
          onPublish={() => handleBulkAction('publish')}
          onUnpublish={() => handleBulkAction('unpublish')}
          onClear={() => setSelected(new Set())}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-mono text-zinc-500">
          <span>{total} bills</span>
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
    </div>
  )
}
