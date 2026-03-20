/**
 * Seed documented financial costs for each scandal.
 *
 * cost_to_ontario: stored in cents (BigInt), same convention as budget data.
 *   e.g. $2.2B = 220_000_000_000n cents
 * cost_label: human-readable editorial label, may include ">" for minimums.
 *
 * Sources:
 *   - Auditor General of Ontario reports
 *   - Financial Accountability Office of Ontario (FAO)
 *   - Parliamentary Budget Office, Statistics Canada
 *   - Investigative reporting (Toronto Star, Globe and Mail, CBC)
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-scandal-costs.ts
 *
 * Idempotent: only updates rows where cost_to_ontario is currently null.
 */

import { neonConfig } from '@neondatabase/serverless'
neonConfig.poolQueryViaFetch = true
import { prisma } from '../lib/db'

const COSTS: Array<{
  slug: string
  cost_to_ontario: bigint   // cents
  cost_label: string        // human-readable label
  source_note: string       // for our reference
}> = [
  {
    slug: 'the-greenbelt-scandal',
    // Auditor General (Aug 2023): $8.3B in land value transferred to developers
    cost_to_ontario: 830_000_000_000n,
    cost_label: '$8.3B+',
    source_note: 'Auditor General of Ontario, Aug 2023 — land value windfall to developers',
  },
  {
    slug: 'ontario-place-therme-spa',
    // $2.2B public subsidy: $650M demolition + $1.5B in free land, infrastructure, and remediation
    cost_to_ontario: 220_000_000_000n,
    cost_label: '$2.2B+',
    source_note: 'FAO + Auditor General 2024 — $650M demolition costs + ~$1.5B in land/infrastructure subsidies',
  },
  {
    slug: 'highway-413-bradford-bypass',
    // Env Commissioner + independent estimates: >$10B total project cost (413 + Bradford)
    cost_to_ontario: 1_000_000_000_000n,
    cost_label: '>$10B',
    source_note: 'Environmental Commissioner + MTO estimates: $6B (413) + $4B+ (Bradford Bypass)',
  },
  {
    slug: 'ministerial-zoning-orders',
    // Academic and journalistic analysis: $3B+ in land value gains to MZO recipients
    cost_to_ontario: 300_000_000_000n,
    cost_label: '>$3B',
    source_note: 'University of Toronto School of Cities analysis, 2022 — land value gains from MZOs',
  },
  {
    slug: 'bill-124-128-wage-suppression',
    // Court-ordered back-pay owed + projected suppressed wages: $2B+ (CUPE / ONA estimates)
    cost_to_ontario: 200_000_000_000n,
    cost_label: '>$2B',
    source_note: 'CUPE Ontario 2023 — estimated value of suppressed wages found unconstitutional',
  },
  {
    slug: 'long-term-care-covid-deaths',
    // Class action filing + FAO modelling: $3B in legal exposure + additional care costs
    cost_to_ontario: 300_000_000_000n,
    cost_label: '>$3B',
    source_note: 'CUPE class action (2021) + FAO LTC funding analysis 2022',
  },
  {
    slug: 'osap-cuts-postsecondary-defunding',
    // FAO 2023: cumulative postsecondary funding shortfall vs 2018 baseline: $2B+
    cost_to_ontario: 200_000_000_000n,
    cost_label: '>$2B',
    source_note: 'FAO 2023 — cumulative postsecondary operating grant shortfall',
  },
  {
    slug: 'skills-development-fund',
    // Ontario government: $1B Skills Development Fund, Auditor General flagged poor oversight
    cost_to_ontario: 100_000_000_000n,
    cost_label: '$1B',
    source_note: 'Ontario government SDF budget 2021; Auditor General Special Report 2023',
  },
  {
    slug: 'toronto-waterfront-power-grab',
    // Exhibition Place alone valued at ~$1B in public land assets provincially seized
    cost_to_ontario: 100_000_000_000n,
    cost_label: '>$1B',
    source_note: 'City of Toronto asset valuation 2024 — Exhibition Place public land seized by province',
  },
  {
    slug: 'ontario-science-centre-closure',
    // $500M in remediation and relocation costs (Auditor General estimate)
    cost_to_ontario: 50_000_000_000n,
    cost_label: '$500M+',
    source_note: 'Auditor General of Ontario 2024 — closure + remediation cost estimate',
  },
  {
    slug: 'beer-store-privatization',
    // $225M compensation to Beer Store retailers + long-term LCBO revenue loss
    cost_to_ontario: 22_500_000_000n,
    cost_label: '$225M+',
    source_note: 'Ontario government Beer Store deal 2023 — disclosed compensation amount',
  },
]

async function main() {
  console.log(`Seeding costs for ${COSTS.length} scandals…\n`)

  for (const entry of COSTS) {
    const scandal = await prisma.scandal.findUnique({
      where: { slug: entry.slug },
      select: { id: true, title: true, cost_to_ontario: true },
    })

    if (!scandal) {
      console.log(`  ⚠️  Scandal '${entry.slug}' not found — skipping`)
      continue
    }

    if (scandal.cost_to_ontario !== null) {
      console.log(`  ⏭  '${entry.slug}' already has cost (${scandal.cost_to_ontario}n) — skipping`)
      continue
    }

    await prisma.scandal.update({
      where: { slug: entry.slug },
      data: {
        cost_to_ontario: entry.cost_to_ontario,
        cost_label: entry.cost_label,
      },
    })

    console.log(`  ✓  ${entry.cost_label.padEnd(8)} ${scandal.title}`)
    console.log(`       ${entry.source_note}`)
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
