'use client'

import { useState } from 'react'
import ResolveModal from './ResolveModal'

export interface ReportItem {
  id: string
  type: string
  targetId: string
  targetTitle: string
  categories: string[]
  comment: string | null
  status: string
  createdAt: string
}

interface Props {
  initialReports: ReportItem[]
}

export default function ReportsPanel({ initialReports }: Props) {
  const [reports, setReports] = useState(initialReports)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [resolveTarget, setResolveTarget] = useState<ReportItem | null>(null)

  function removeReport(id: string) {
    setReports(prev => prev.filter(r => r.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function selectAll() {
    if (selected.size === reports.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(reports.map(r => r.id)))
    }
  }

  async function handleDismiss(id: string) {
    setLoading(id)
    try {
      await fetch(`/api/admin/reports/${id}/dismiss`, { method: 'POST' })
      removeReport(id)
    } finally {
      setLoading(null)
    }
  }

  async function handleBulk(action: 'dismiss' | 'resolve') {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    setLoading('bulk')
    try {
      await fetch('/api/admin/reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      })
      ids.forEach(id => removeReport(id))
    } finally {
      setLoading(null)
    }
  }

  if (reports.length === 0) {
    return <p className="text-sm text-zinc-400 font-mono">No pending reports.</p>
  }

  return (
    <>
      {resolveTarget && (
        <ResolveModal
          report={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={id => { removeReport(id); setResolveTarget(null) }}
        />
      )}

      {/* Bulk action bar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={selected.size === reports.length && reports.length > 0}
          onChange={selectAll}
          className="rounded"
          aria-label="Select all"
        />
        <span className="text-xs text-zinc-400 font-mono">{selected.size} selected</span>
        <button
          onClick={() => handleBulk('dismiss')}
          disabled={selected.size === 0 || loading === 'bulk'}
          className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
        >
          dismiss selected
        </button>
        <button
          onClick={() => handleBulk('resolve')}
          disabled={selected.size === 0 || loading === 'bulk'}
          className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
        >
          mark resolved
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div
            key={report.id}
            className={`border border-zinc-200 dark:border-zinc-700 rounded p-4 space-y-2 transition-opacity ${loading === report.id ? 'opacity-40' : ''}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(report.id)}
                onChange={() => toggleSelect(report.id)}
                className="rounded mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${report.type === 'news' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
                    {report.type}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {new Date(report.createdAt).toLocaleDateString('en-CA')}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {report.targetTitle}
                </p>
                <div className="flex flex-wrap gap-1">
                  {report.categories.map(cat => (
                    <span key={cat} className="text-xs font-mono px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
                {report.comment && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{report.comment}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDismiss(report.id)}
                disabled={loading === report.id}
                className="px-3 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                dismiss
              </button>
              <button
                onClick={() => setResolveTarget(report)}
                disabled={loading === report.id}
                className="px-3 py-1 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50"
              >
                resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
