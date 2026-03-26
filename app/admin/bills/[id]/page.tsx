'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Clock, Globe, X, ArrowLeft } from 'lucide-react'
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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function BillEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [tagLoading, setTagLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/bills/${id}`)
      .then(r => r.json())
      .then(setBill)
      .catch(() => setError('Failed to load bill'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleTagAction(tag: string, action: 'add' | 'remove') {
    if (!bill || tagLoading) return
    const prevTags = bill.tags
    setTagLoading(true)
    try {
      const res = await fetch('/api/admin/bill-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bill.id, tag, action }),
      })
      if (!res.ok) { setError('Failed to update tags'); setBill(b => b ? { ...b, tags: prevTags } : null); return }
      const data = await res.json()
      setBill(b => b ? { ...b, tags: data.tags } : null)
    } finally {
      setTagLoading(false)
    }
  }

  async function handlePublishToggle() {
    if (!bill || publishLoading) return
    const prev = bill.published
    setBill(b => b ? { ...b, published: !prev } : null)
    setPublishLoading(true)
    try {
      const res = await fetch('/api/admin/bill-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bill.id, published: !prev }),
      })
      if (!res.ok) { setError('Failed to update visibility'); setBill(b => b ? { ...b, published: prev } : null); return }
      const data = await res.json()
      setBill(b => b ? { ...b, published: data.published } : null)
    } catch {
      setBill(b => b ? { ...b, published: prev } : null)
      setError('Failed to update visibility')
    } finally {
      setPublishLoading(false)
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
            {bill ? bill.bill_number : 'Bill'}
          </h2>
        </div>
        <button
          onClick={() => router.push('/admin')}
          className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Done
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {loading && <p className="font-mono text-xs text-zinc-400">Loading…</p>}
        {error && <p className="font-mono text-xs text-red-500">{error}</p>}

        {bill && (
          <div className="space-y-6">
            {/* Bill info */}
            <div>
              <p className="text-lg font-semibold font-mono text-blue-600 dark:text-blue-400">{bill.bill_number}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{bill.title}</p>
              <div className="flex gap-4 mt-3 text-xs font-mono">
                <span className={`flex items-center gap-1 ${bill.toronto_flagged ? 'text-orange-500' : 'text-zinc-400'}`}>
                  <Building2 size={12} />
                  {bill.toronto_flagged ? 'Toronto-flagged' : 'Not flagged'}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock size={12} />
                  {formatDate(bill.date_introduced)}
                </span>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-700" />

            {/* Tags */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">Tags</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {bill.tags.map(tag => (
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
                {bill.tags.length === 0 && (
                  <span className="text-xs text-zinc-400 font-mono italic">no tags</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PREDEFINED_TAGS.filter(t => !bill.tags.includes(t)).map(tag => (
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

            <hr className="border-zinc-200 dark:border-zinc-700" />

            {/* Visibility */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-3">Visibility</p>
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded p-4">
                <div>
                  <p className={`text-sm font-mono flex items-center gap-1.5 ${bill.published ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                    <Globe size={13} />
                    {bill.published ? 'Published' : 'Unpublished'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {bill.published ? 'Visible on public feed' : 'Hidden from public feed'}
                  </p>
                </div>
                <Switch
                  checked={bill.published}
                  onCheckedChange={handlePublishToggle}
                  disabled={publishLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
