import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPeople } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
import PersonCard from '@/app/components/people/PersonCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'People Connected to Ford Government Payouts',
}

const CONNECTION_TYPES = ['Lobbyist', 'Donor', 'Director', 'Beneficiary'] as const

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function PeoplePage({ searchParams }: Props) {
  const flags = await getFeatureFlags()
  if (!flags.named_individuals_enabled) notFound()

  const { type } = await searchParams
  const people = await getPeople(type ? { connection_type: type } : undefined)

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-mono text-sm uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-2">
          Connected Individuals
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
          Lobbyists, donors, directors, and beneficiaries connected to Ford government decisions.
        </p>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/people"
            className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              !type
                ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
            }`}
          >
            All
          </Link>
          {CONNECTION_TYPES.map(ct => (
            <Link
              key={ct}
              href={`/people?type=${ct}`}
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                type === ct
                  ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {ct}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {people.length === 0 ? (
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            {type ? `No ${type}s found.` : 'No individuals published yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {people.map(person => (
              <PersonCard key={person.slug} person={person} width={160} height={200} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
