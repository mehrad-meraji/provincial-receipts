'use client'

import { useState } from 'react'

interface Program {
  id: string
  name: string
  formattedAmount: string // pre-formatted by MinistryTable server component
}

interface MinistryRowProps {
  name: string
  amount: number       // dollars — for % calculation only
  totalExpense: number // dollars — for % calculation
  programs: Program[]
  formattedAmount: string // pre-formatted by MinistryTable server component
}

export default function MinistryRow({ name, amount, totalExpense, programs, formattedAmount }: MinistryRowProps) {
  const [open, setOpen] = useState(false)
  const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0

  return (
    <>
      <tr
        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
      >
        <td className="py-3 px-4 font-mono text-sm text-zinc-900 dark:text-white">
          <span className="mr-2 text-zinc-400">{open ? '▼' : '▶'}</span>
          {name}
        </td>
        <td className="py-3 px-4 font-mono text-sm text-right tabular-nums text-zinc-900 dark:text-white">
          {formattedAmount}
        </td>
        <td className="py-3 px-4 hidden sm:table-cell">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-sm h-2 overflow-hidden">
              <div
                className="h-2 bg-zinc-400 dark:bg-zinc-500 rounded-sm"
                style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400 w-10 text-right tabular-nums">
              {pct.toFixed(1)}%
            </span>
          </div>
        </td>
      </tr>
      {open && programs.map((p) => (
        <tr key={p.id} className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <td className="py-2 px-4 pl-10 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {p.name}
          </td>
          <td className="py-2 px-4 font-mono text-xs text-right tabular-nums text-zinc-600 dark:text-zinc-400">
            {p.formattedAmount}
          </td>
          <td className="hidden sm:table-cell" />
        </tr>
      ))}
    </>
  )
}
