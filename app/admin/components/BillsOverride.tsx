'use client'

import { useState } from 'react'

interface BillItem {
  id: string
  bill_number: string
  title: string
  sponsor: string
  status: string
}

export default function BillsOverride({ flaggedBills }: { flaggedBills: BillItem[] }) {
  const [bills, setBills] = useState(flaggedBills)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BillItem[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function search(q: string) {
    setQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/bills-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.filter((b: BillItem) => !bills.some(fb => fb.id === b.id)))
    } finally {
      setSearching(false)
    }
  }

  async function flagBill(bill: BillItem, action: 'add' | 'remove') {
    setLoading(bill.id)
    try {
      await fetch('/api/admin/bill-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bill.id, action }),
      })
      if (action === 'remove') {
        setBills(prev => prev.filter(b => b.id !== bill.id))
      } else {
        setBills(prev => [...prev, bill])
        setSearchResults(prev => prev.filter(b => b.id !== bill.id))
      }
    } finally {
      setLoading(null)
    }
  }

  function renderBill(bill: BillItem, action: 'add' | 'remove') {
    return (
      <div key={bill.id} className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{bill.bill_number} — {bill.title}</p>
          <p className="text-xs text-zinc-400 font-mono">{bill.sponsor} · {bill.status}</p>
        </div>
        <button
          onClick={() => flagBill(bill, action)}
          disabled={loading === bill.id}
          className={`px-3 py-1 text-xs shrink-0 rounded disabled:opacity-50 ${
            action === 'remove'
              ? 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {action === 'remove' ? 'Remove' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Currently flagged ({bills.length})</h3>
        {bills.length === 0
          ? <p className="text-sm text-zinc-400 font-mono">No bills currently flagged.</p>
          : <div>{bills.map(b => renderBill(b, 'remove'))}</div>
        }
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Search unflagged bills</h3>
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search by title or sponsor…"
          className="w-full border border-zinc-300 dark:border-zinc-600 rounded px-3 py-2 text-sm bg-transparent mb-2"
        />
        {searching && <p className="text-xs text-zinc-400 font-mono">Searching…</p>}
        {searchResults.length > 0 && (
          <div>{searchResults.map(b => renderBill(b, 'add'))}</div>
        )}
      </div>
    </div>
  )
}
