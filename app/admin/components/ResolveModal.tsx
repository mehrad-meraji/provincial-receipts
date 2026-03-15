'use client'

import { useEffect, useState } from 'react'
import type { ReportItem } from './ReportsPanel'

const NEWS_TOPICS = ['housing', 'transit', 'ethics', 'environment', 'finance', 'other']
const BILL_STATUSES = [
  'First Reading',
  'Second Reading',
  'Committee',
  'Third Reading',
  'Royal Assent',
  'Withdrawn',
  'Defeated',
]

interface TargetNews {
  url: string
  topic: string | null
  is_scandal: boolean
  hidden: boolean
}

interface TargetBill {
  url: string
  status: string
  toronto_flagged: boolean
}

interface Props {
  report: ReportItem
  onClose: () => void
  onResolved: (id: string) => void
}

export default function ResolveModal({ report, onClose, onResolved }: Props) {
  const [fetchState, setFetchState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [newsFields, setNewsFields] = useState<TargetNews | null>(null)
  const [billFields, setBillFields] = useState<TargetBill | null>(null)
  const [saving, setSaving] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTarget() {
      try {
        const res = await fetch(`/api/admin/reports/${report.id}/target`)
        if (!res.ok) { setFetchState('error'); return }
        const data = await res.json()
        if (report.type === 'news') setNewsFields(data)
        else setBillFields(data)
        setFetchState('ready')
      } catch {
        setFetchState('error')
      }
    }
    loadTarget()
  }, [report.id, report.type])

  async function handleSave() {
    setSaving(true)
    setInlineError(null)
    const payload = report.type === 'news' ? newsFields : billFields
    try {
      const res = await fetch(`/api/admin/reports/${report.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) {
        const data = await res.json()
        setInlineError(data.error ?? 'URL conflict')
        return
      }
      onResolved(report.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 shadow-lg w-full max-w-md mx-4 p-5 space-y-4">
        <h2 className="text-sm font-semibold font-mono">Resolve: {report.targetTitle}</h2>

        {fetchState === 'loading' && (
          <p className="text-xs text-zinc-400 font-mono">Loading…</p>
        )}

        {fetchState === 'error' && (
          <p className="text-xs text-red-500 font-mono">Could not load target data.</p>
        )}

        {fetchState === 'ready' && report.type === 'news' && newsFields && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Source URL</label>
              <input
                type="url"
                value={newsFields.url}
                onChange={e => setNewsFields(f => f && ({ ...f, url: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Topic</label>
              <select
                value={newsFields.topic ?? ''}
                onChange={e => setNewsFields(f => f && ({ ...f, topic: e.target.value || null }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              >
                <option value="">— none —</option>
                {NEWS_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Scandal flag</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setNewsFields(f => f && ({ ...f, is_scandal: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${newsFields.is_scandal === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'scandal' : 'not scandal'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Hidden from feed</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setNewsFields(f => f && ({ ...f, hidden: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${newsFields.hidden === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'hidden' : 'visible'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {fetchState === 'ready' && report.type === 'bill' && billFields && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Source URL</label>
              <input
                type="url"
                value={billFields.url}
                onChange={e => setBillFields(f => f && ({ ...f, url: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Status</label>
              <select
                value={billFields.status}
                onChange={e => setBillFields(f => f && ({ ...f, status: e.target.value }))}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-800"
              >
                {BILL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">Toronto flagged</label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setBillFields(f => f && ({ ...f, toronto_flagged: v }))}
                    className={`px-3 py-1 text-xs font-mono rounded border ${billFields.toronto_flagged === v ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                  >
                    {v ? 'yes' : 'no'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {inlineError && (
          <p className="text-xs text-red-500 font-mono">{inlineError}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            disabled={fetchState !== 'ready' || saving}
            className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40"
          >
            {saving ? 'saving…' : 'save & resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}
