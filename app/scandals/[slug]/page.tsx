import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const scandal = await prisma.scandal.findUnique({
    where: { slug },
    select: { title: true, summary: true },
  })
  if (!scandal) return {}
  return {
    title: scandal.title,
    description: scandal.summary,
  }
}

export default async function ScandalDetailPage({ params }: PageProps) {
  const { slug } = await params

  const scandal = await prisma.scandal.findUnique({
    where: { slug },
    include: {
      legal_actions: true,
      sources: true,
      news_links: {
        include: {
          news_event: {
            select: {
              headline: true,
              url: true,
              source: true,
              published_at: true,
            },
          },
        },
      },
      bills: {
        select: { id: true, bill_number: true, title: true },
      },
      mpps: {
        select: { id: true, name: true, party: true, riding: true },
      },
    },
  })

  if (!scandal || !scandal.published) notFound()

  const dateLabel = new Date(scandal.date_reported).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-mono text-zinc-400 mb-6">
          <Link href="/" className="hover:underline">Dashboard</Link>
          <span className="mx-2">→</span>
          <span>{scandal.title}</span>
        </nav>

        {/* Header */}
        <div className="border-b-4 border-zinc-950 dark:border-white pb-4 mb-8">
          <h1 className="font-serif text-2xl font-bold text-zinc-950 dark:text-white">
            {scandal.title}
          </h1>
          <p className="font-mono text-sm text-zinc-500 mt-2">{dateLabel}</p>
        </div>

        {/* TLDR */}
        {scandal.tldr && (
          <div className="mb-10 border-l-4 border-zinc-950 dark:border-white pl-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">
              TL;DR
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
              {scandal.tldr}
            </p>
          </div>
        )}

        {/* Why It Matters */}
        <div className="mb-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
            Why It Matters
          </h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: scandal.why_it_matters }}
          />
        </div>

        {/* Legal Actions */}
        {scandal.legal_actions.length > 0 && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Legal Actions
            </h2>
            {scandal.legal_actions.map((action) => (
              <div
                key={action.id}
                className="border border-zinc-200 dark:border-zinc-800 p-3 mb-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-950 dark:text-white">
                    {action.url ? (
                      <a href={action.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {action.title} ↗
                      </a>
                    ) : action.title}
                  </span>
                  <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5">
                    {action.status}
                  </span>
                </div>
                {action.description && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none mt-1 text-zinc-500"
                    dangerouslySetInnerHTML={{ __html: action.description }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rippling Effects */}
        {scandal.rippling_effects && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Rippling Effects
            </h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: scandal.rippling_effects }}
            />
          </div>
        )}

        {/* Linked Bills */}
        {scandal.bills.length > 0 && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Linked Bills
            </h2>
            {scandal.bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-3 mb-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="font-mono text-xs text-zinc-500">{bill.bill_number}</span>
                  <span className="text-sm text-zinc-950 dark:text-white ml-2">{bill.title}</span>
                </div>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Involved MPPs */}
        {scandal.mpps.length > 0 && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Involved MPPs
            </h2>
            {scandal.mpps.map((mpp) => (
              <Link
                key={mpp.id}
                href={`/mpps/${mpp.id}`}
                className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 p-3 mb-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-sm text-zinc-950 dark:text-white">{mpp.name}</span>
                  <span className="font-mono text-xs text-zinc-500 ml-2">
                    {mpp.party} · {mpp.riding}
                  </span>
                </div>
                <span className="text-zinc-400">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* News Coverage */}
        {scandal.news_links.length > 0 && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              News Coverage
            </h2>
            {scandal.news_links.map((link) => {
              const href = link.news_event?.url ?? link.external_url ?? '#'
              const title = link.news_event?.headline ?? link.external_title ?? 'Untitled'
              const source = link.news_event?.source ?? link.external_source ?? ''
              const publishedAt = link.news_event?.published_at ?? link.external_date
              const dateStr = publishedAt
                ? new Date(publishedAt).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : null

              return (
                <a
                  key={link.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-zinc-200 dark:border-zinc-800 p-3 mb-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <p className="text-sm text-zinc-950 dark:text-white">{title}</p>
                  {(source || dateStr) && (
                    <p className="font-mono text-[10px] text-zinc-500 mt-1">
                      {[source, dateStr].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </a>
              )
            })}
          </div>
        )}

        {/* Sources */}
        {scandal.sources.length > 0 && (
          <div className="mb-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Sources
            </h2>
            <div className="flex flex-col gap-1">
              {scandal.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white underline"
                >
                  {source.title} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
