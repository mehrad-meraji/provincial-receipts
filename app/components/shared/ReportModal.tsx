'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

const CATEGORIES = [
  { slug: 'wrong-information', label: 'Wrong information' },
  { slug: 'broken-link',       label: 'Broken link' },
  { slug: 'misclassified',     label: 'Misclassified' },
  { slug: 'outdated',          label: 'Outdated' },
  { slug: 'spam-irrelevant',   label: 'Spam / irrelevant' },
  { slug: 'other',             label: 'Other' },
]

interface Props {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
  onClose: () => void
}

export default function ReportModal({ type, targetId, targetTitle, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const needsComment = selected.includes('other')
  const canSubmit =
    selected.length > 0 &&
    token !== null &&
    (!needsComment || comment.trim() !== '') &&
    !submitting

  function toggleCategory(slug: string) {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  async function handleSubmit() {
    if (!canSubmit || !token) return
    setSubmitting(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId,
          targetTitle,
          categories: selected,
          comment: comment.trim() || undefined,
          turnstileToken: token,
        }),
      })
      setDone(true)
      setTimeout(onClose, 1500)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 shadow-lg w-full max-w-sm mx-4 p-5 space-y-4">
        {done ? (
          <p className="text-sm font-mono text-center text-zinc-600 dark:text-zinc-300 py-4">
            Thanks for your report.
          </p>
        ) : (
          <>
            <h2 className="text-sm font-semibold font-mono">Report an error</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{targetTitle}</p>

            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <label key={cat.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="rounded"
                  />
                  {cat.label}
                </label>
              ))}
            </div>

            {needsComment && (
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Please describe the issue…"
                rows={3}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 resize-none"
              />
            )}

            {!needsComment && (
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Additional context (optional)"
                rows={2}
                className="w-full text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 bg-white dark:bg-zinc-800 resize-none"
              />
            )}

            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setToken}
              options={{ size: 'invisible' }}
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-3 py-1.5 text-xs font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40"
              >
                {submitting ? 'sending…' : 'submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
