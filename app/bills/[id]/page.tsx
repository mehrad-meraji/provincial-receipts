import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import ReportButton from '@/app/components/shared/ReportButton'
import { prisma } from '@/lib/db'
import Masthead from '@/app/components/layout/Masthead'
import DatelineBar from '@/app/components/layout/DatelineBar'
import SectionDivider from '@/app/components/layout/SectionDivider'
import StatusBadge from '@/app/components/bills/StatusBadge'
import ImpactScore from '@/app/components/bills/ImpactScore'
import VoteBreakdown from '@/app/components/mpps/VoteBreakdown'
import LinkedNews from '@/app/components/mpps/LinkedNews'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const bill = await prisma.bill.findUnique({
    where: { id },
    select: { bill_number: true, title: true, status: true, sponsor: true },
  })
  if (!bill) return {}
  const description = `Ontario ${bill.bill_number}: ${bill.title}. Status: ${bill.status}. Sponsored by ${bill.sponsor}. Track this bill's progress and impact on Ontarians.`
  return {
    title: `${bill.bill_number} — ${bill.title}`,
    description,
    openGraph: {
      title: `${bill.bill_number}: ${bill.title} | Fuck Doug Ford`,
      description,
      url: `https://fuckdougford.ca/bills/${id}`,
    },
  }
}

export default async function BillPage({ params }: PageProps) {
  const { id } = await params

  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      sponsor_mpp: true,
      newsEvents: { orderBy: { published_at: 'desc' }, take: 10 },
      scandals: {
        where: { published: true },
        select: { id: true, title: true, slug: true },
      },
    },
  })

  if (!bill) notFound()

  const dateStr = bill.date_introduced
    ? new Date(bill.date_introduced).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date unknown'

  return (
    <main className="min-h-screen">
      <DatelineBar />
      <Masthead />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-mono text-zinc-400 mb-6">
          <Link href="/bills" className="hover:underline">Bills</Link>
          <span className="mx-2">→</span>
          <span>{bill.bill_number}</span>
        </nav>

        {/* Bill header */}
        <div className="border-b-4 border-zinc-950 dark:border-white pb-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-zinc-500">{bill.bill_number}</span>
            <StatusBadge status={bill.status} />
            <ImpactScore score={bill.impact_score} flagged={bill.toronto_flagged} />
          </div>
          <div className="flex items-start justify-between gap-3 mt-2">
            <h1 className="text-2xl font-serif font-bold text-zinc-950 dark:text-white leading-tight flex-1">
              {bill.title}
            </h1>
            <div className="flex items-center gap-3 shrink-0 mt-1">
              <a
                href={bill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                full text <ExternalLink size={12} />
              </a>
              <ReportButton
                type="bill"
                targetId={bill.id}
                targetTitle={`${bill.bill_number}: ${bill.title}`}
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-mono">
            Sponsored by {bill.sponsor} · Introduced {dateStr}
            {bill.reading_stage && ` · ${bill.reading_stage}`}
          </p>
        </div>

        {/* Sponsor MPP link */}
        {bill.sponsor_mpp && (
          <div className="mb-6">
            <SectionDivider label="Sponsor" />
            <Link href={`/mpps/${bill.sponsor_mpp.id}`} className="inline-block hover:underline font-medium text-zinc-950 dark:text-white">
              {bill.sponsor_mpp.name}
            </Link>
            <span className="ml-2 text-sm text-zinc-500">{bill.sponsor_mpp.party} · {bill.sponsor_mpp.riding}</span>
          </div>
        )}

        {/* Vote breakdown */}
        <div className="mb-6">
          <SectionDivider label="Vote Results" />
          <VoteBreakdown
            voteResults={bill.vote_results as { yes: number; no: number; abstain: number } | null}
            voteByParty={bill.vote_by_party as Record<string, number> | null}
          />
        </div>

        {/* Tags */}
        {bill.tags.length > 0 && (
          <div className="mb-6">
            <SectionDivider label="Tags" />
            <div className="flex flex-wrap gap-2">
              {bill.tags.map((tag: string) => (
                <span key={tag} className="text-xs font-mono px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linked news */}
        {bill.newsEvents.length > 0 && (
          <div className="mb-6">
            <SectionDivider label="Related News" />
            <LinkedNews items={bill.newsEvents} />
          </div>
        )}

        {/* Related scandals */}
        {bill.scandals.length > 0 && (
          <div className="mb-6">
            <SectionDivider label="Related Scandals" />
            <div className="space-y-2">
              {bill.scandals.map((scandal: { id: string; title: string; slug: string }) => (
                <Link
                  key={scandal.id}
                  href={`/scandals/${scandal.slug}`}
                  className="block border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-sm text-zinc-950 dark:text-white">{scandal.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
