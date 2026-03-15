'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import ReportModal from './ReportModal'

interface ReportButtonProps {
  type: 'news' | 'bill'
  targetId: string
  targetTitle: string
}

export default function ReportButton({ type, targetId, targetTitle }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        aria-label="Report an error"
      >
        <Flag size={12} />
        report
      </button>

      {isOpen && (
        <ReportModal
          type={type}
          targetId={targetId}
          targetTitle={targetTitle}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
