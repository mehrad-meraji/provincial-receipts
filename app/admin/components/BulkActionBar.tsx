'use client'

import { Globe, Trash2, X } from 'lucide-react'

interface BulkActionBarProps {
  count: number
  loading: boolean
  onPublish: () => void
  onUnpublish: () => void
  onDelete?: () => void
  onClear: () => void
}

export default function BulkActionBar({
  count,
  loading,
  onPublish,
  onUnpublish,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-mono">
      <span className="tabular-nums">{count} selected</span>
      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={onPublish}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 dark:bg-zinc-900/10 hover:bg-white/20 dark:hover:bg-zinc-900/20 disabled:opacity-40 transition-colors"
        >
          <Globe size={11} />
          Publish
        </button>
        <button
          onClick={onUnpublish}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 dark:bg-zinc-900/10 hover:bg-white/20 dark:hover:bg-zinc-900/20 disabled:opacity-40 transition-colors"
        >
          <Globe size={11} className="opacity-40" />
          Unpublish
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 dark:text-red-600 disabled:opacity-40 transition-colors"
          >
            <Trash2 size={11} />
            Delete
          </button>
        )}
      </div>
      <button
        onClick={onClear}
        disabled={loading}
        className="ml-auto p-1 rounded hover:bg-white/10 dark:hover:bg-zinc-900/10 disabled:opacity-40 transition-colors text-white/60 dark:text-zinc-900/60 hover:text-white dark:hover:text-zinc-900"
      >
        <X size={13} />
      </button>
    </div>
  )
}
