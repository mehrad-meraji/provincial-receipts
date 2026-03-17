'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Home',   href: '/' },
  { label: 'Bills',  href: '/bills' },
  { label: 'MPPs',   href: '/mpps' },
  { label: 'Budget', href: '/budget' },
] as const

export default function TabNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Site navigation" className="mt-3 flex justify-center gap-6 text-xs font-mono uppercase tracking-widest">
      {TABS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={
            isActive(href)
              ? 'text-zinc-950 dark:text-white border-b border-zinc-950 dark:border-white pb-0.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors'
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
