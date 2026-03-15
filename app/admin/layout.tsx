import type { ReactNode } from 'react'
import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Middleware also protects /admin at the edge; this is a secondary server-side guard.
  await auth.protect()

  return (
    <>
      <header className="flex justify-end items-center px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <UserButton />
      </header>
      {children}
    </>
  )
}
