import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPersonBySlug } from '@/lib/people'
import { getFeatureFlags } from '@/lib/feature-flags'
import PersonBadge from '@/app/components/people/PersonBadge'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import { formatBudgetAmount } from '@/lib/format'

export const dynamic = 'force-dynamic'

function safeUrl(url: string | null | undefined): string {
  if (!url) return '#'
  return /^https?:\/\//i.test(url) ? url : '#'
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, flags] = await Promise.all([params, getFeatureFlags()])
  if (!flags.named_individuals_enabled) return { title: 'Not Found' }
  const person = await getPersonBySlug(slug)
  if (!person) return { title: 'Not Found' }
  const description = person.bio ?? `${person.name}'s documented connections to Doug Ford's Ontario government, including contracts, donations, appointments, and financial benefits.`
  return {
    title: `${person.name} — Ford Government Connections`,
    description,
    openGraph: {
      title: `${person.name} | Fuck Doug Ford`,
      description,
      url: `https://fuckdougford.ca/people/${slug}`,
    },
  }
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  Registry:  'Government Registry',
  News:      'News Report',
  Corporate: 'Corporate Filing',
  Court:     'Court Filing',
  FOI:       'FOI Document',
}

export default async function PersonPage({ params }: Props) {
  const [{ slug }, flags] = await Promise.all([params, getFeatureFlags()])
  if (!flags.named_individuals_enabled) notFound()
  const person = await getPersonBySlug(slug)
  if (!person) notFound()

  const uniqueConnectionTypes = [...new Set(person.connections.map(c => c.connection_type))]

  // Sum costs of connected scandals that have a cost_to_ontario value
  const totalCostCents = person.connections.reduce<bigint>((sum, c) => {
    return c.scandal.cost_to_ontario ? sum + c.scandal.cost_to_ontario : sum
  }, 0n)
  const hasCost = totalCostCents > 0n
  // Use ">$X" prefix if any connected scandal has a ">" in its label (i.e. minimum estimate)
  const isMinimum = person.connections.some(c => c.scandal.cost_label?.startsWith('>'))
  const totalCostFormatted = hasCost
    ? `${isMinimum ? '>' : ''}${formatBudgetAmount(totalCostCents)}`
    : null

  // Group sources by type
  const sourcesByType = person.sources.reduce<Record<string, typeof person.sources>>((acc, s) => {
    const key = s.source_type
    acc[key] = acc[key] ?? []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link href="/people" className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors mb-8 inline-block">
          ← All Individuals
        </Link>

        {/* Hero */}
        <div className="flex gap-8 mb-10">
          {/* Photo */}
          <div className="border border-slate-300 overflow-hidden h-72 w-52 relative flex-none">
            <div className="person-photo-wrapper">
              {person.photo_filename ? (
                <Image
                  src={`/people/${person.photo_filename}`}
                  alt={person.name}
                  fill
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">[REDACTED]</span>
                  <span className="font-mono text-3xl font-bold text-zinc-600">
                    {person.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white mb-1">{person.name}</h1>
            {person.organization && (
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                {person.organization_url ? (
                  <a href={safeUrl(person.organization_url)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {person.organization}
                  </a>
                ) : person.organization}
              </p>
            )}
            {/* Connection type badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {uniqueConnectionTypes.map(ct => (
                <PersonBadge key={ct} connection_type={ct} />
              ))}
            </div>
            {totalCostFormatted && (
              <div className="border border-red-800/40 bg-ontario-red/10 px-3 py-2 mb-3">
                <p className="font-mono text-[9px] uppercase tracking-widest text-ontario-red mb-0.5">Estimated cost to Ontario</p>
                <p className="font-mono text-xl font-bold text-ontario-red">{totalCostFormatted}</p>
              </div>
            )}
            {person.bio && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{person.bio}</p>
            )}
          </div>
        </div>

        {/* Connected Scandals */}
        {person.connections.length > 0 && (
          <section className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Connected Scandals
            </h2>
            <div className="space-y-4">
              {person.connections.map(conn => (
                <div key={conn.id} className="border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <PersonBadge connection_type={conn.connection_type} />
                  </div>
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <Link
                      href={`/scandals/${conn.scandal.slug}`}
                      className="font-serif text-base font-bold text-zinc-950 dark:text-white hover:underline"
                    >
                      {conn.scandal.title}
                    </Link>
                    {conn.scandal.cost_label && (
                      <span className="flex-none font-mono text-sm font-bold text-red-500 whitespace-nowrap">
                        {conn.scandal.cost_label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">{conn.scandal.tldr}</p>
                  <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500">{conn.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {person.sources.length > 0 && (
          <section>
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-950 dark:text-white mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              Sources
            </h2>
            <div className="space-y-6">
              {Object.entries(sourcesByType).map(([type, sources]) => (
                <div key={type}>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-2">
                    {SOURCE_TYPE_LABELS[type] ?? type}
                  </h3>
                  <ul className="space-y-1">
                    {sources.map(s => (
                      <li key={s.id}>
                        <a
                          href={safeUrl(s.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-700 dark:text-zinc-300 hover:underline"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
