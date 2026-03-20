'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BASE_TABS = [
  { label: 'Home',   href: '/' },
  { label: 'Budget', href: '/budget' },
] as const

const PEOPLE_TAB = { label: 'People', href: '/people' } as const

interface TabNavProps {
  showPeople?: boolean
}

export default function TabNav({ showPeople = false }: TabNavProps) {
  const pathname = usePathname()

  const tabs = showPeople
    ? [BASE_TABS[0], PEOPLE_TAB, ...BASE_TABS.slice(1)]
    : [...BASE_TABS]

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Site navigation" className="mt-3 flex justify-center gap-6 text-xs font-mono uppercase tracking-widest">
      {tabs.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
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
