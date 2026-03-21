'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Building2, Globe, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Switch } from '@/app/components/shared/Switch'

const PREDEFINED_TAGS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other'] as const

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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function BillsPanel() {
  const [bills, setBills] = useState<Bill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [tagLoading, setTagLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const drawerOpen = useRef(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

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

  function closeDrawer() {
    setSelectedBill(null)
    drawerOpen.current = false
  }

  function handleFilterChange(f: Filter) {
    setFilter(f)
    setPage(1)
    closeDrawer()
  }

  function handleQueryChange(q: string) {
    setQuery(q)
    setPage(1)
    closeDrawer()
  }

  function handlePageChange(p: number) {
    setPage(p)
    closeDrawer()
  }

  function handleRowClick(bill: Bill) {
    setSelectedBill(bill)
    drawerOpen.current = true
  }

  async function handleTagAction(tag: string, action: 'add' | 'remove') {
    if (!selectedBill || tagLoading) return
    const prevTags = selectedBill.tags
    setTagLoading(true)
    try {
      const res = await fetch('/api/admin/bill-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBill.id, tag, action }),
      })
      if (!drawerOpen.current) return // drawer closed mid-flight — ignore
      if (!res.ok) {
        showToast('Failed to update tags')
        setSelectedBill(b => b ? { ...b, tags: prevTags } : null)
        return
      }
      const data = await res.json()
      setSelectedBill(b => b ? { ...b, tags: data.tags } : null)
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, tags: data.tags } : b))
    } finally {
      setTagLoading(false)
    }
  }

  async function handlePublishToggle() {
    if (!selectedBill || publishLoading) return
    const prevPublished = selectedBill.published
    const nextPublished = !prevPublished
    setSelectedBill(b => b ? { ...b, published: nextPublished } : null)
    setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: nextPublished } : b))
    setPublishLoading(true)
    try {
      const res = await fetch('/api/admin/bill-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBill.id, published: nextPublished }),
      })
      if (!res.ok) {
        setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: prevPublished } : b))
        if (drawerOpen.current) {
          showToast('Failed to update visibility')
          setSelectedBill(b => b ? { ...b, published: prevPublished } : null)
        }
        return
      }
      if (!drawerOpen.current) return
      const data = await res.json()
      setSelectedBill(b => b ? { ...b, published: data.published } : null)
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: data.published } : b))
    } catch {
      setBills(bs => bs.map(b => b.id === selectedBill.id ? { ...b, published: prevPublished } : b))
      if (drawerOpen.current) {
        showToast('Failed to update visibility')
        setSelectedBill(b => b ? { ...b, published: prevPublished } : null)
      }
    } finally {
      setPublishLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Toronto-flagged', value: 'toronto' },
    { label: 'Unpublished', value: 'unpublished' },
  ]

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white text-sm px-4 py-2 rounded shadow-lg font-mono">
          {toast}
        </div>
      )}

      <div className="flex gap-4 h-[600px] border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        {/* Left: table */}
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
          <div className="grid grid-cols-[80px_1fr_160px_40px_40px] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
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
                className={`w-full grid grid-cols-[80px_1fr_160px_40px_40px] px-3 py-2.5 text-left text-sm border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  selectedBill?.id === bill.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                }`}
              >
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

        {/* Right: Drawer */}
        {selectedBill && (
          <div className="w-72 border-l border-zinc-200 dark:border-zinc-700 flex flex-col">
            {/* Drawer header */}
            <div className="flex items-start justify-between p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="text-sm font-semibold font-mono text-blue-600 dark:text-blue-400">
                  {selectedBill.bill_number}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                  {selectedBill.title}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Meta */}
              <div className="flex gap-3 text-xs font-mono">
                <span className={`flex items-center gap-1 ${selectedBill.toronto_flagged ? 'text-orange-500' : 'text-zinc-400'}`}>
                  <Building2 size={11} />
                  {selectedBill.toronto_flagged ? 'Toronto-flagged' : 'Not flagged'}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock size={11} />
                  {formatDate(selectedBill.date_introduced)}
                </span>
              </div>

              {/* Tags */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedBill.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[11px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagAction(tag, 'remove')}
                        disabled={tagLoading}
                        className="hover:text-red-500 disabled:opacity-40"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {selectedBill.tags.length === 0 && (
                    <span className="text-xs text-zinc-400 font-mono italic">no tags</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.filter(t => !selectedBill.tags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagAction(tag, 'add')}
                      disabled={tagLoading}
                      className="text-[11px] font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <hr className="border-zinc-200 dark:border-zinc-700" />

              {/* Visibility */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Visibility</p>
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded p-3">
                  <div>
                    <p className={`text-sm font-mono flex items-center gap-1.5 ${selectedBill.published ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                      <Globe size={13} />
                      {selectedBill.published ? 'Published' : 'Unpublished'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedBill.published ? 'Visible on public feed' : 'Hidden from public feed'}
                    </p>
                  </div>
                  <Switch
                    checked={selectedBill.published}
                    onCheckedChange={() => handlePublishToggle()}
                    disabled={publishLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
