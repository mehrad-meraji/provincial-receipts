/**
 * Seed script: All scandal timeline events
 * Adds dated markers for key moments in every scandal so they appear
 * at the right point in the homepage timeline, linking to the scandal page.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-all-timeline-events.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

const events = [

  // ─── GREENBELT ────────────────────────────────────────────────────────────
  {
    date: '2018-11-15', icon: 'Flag',
    label: 'Ford promises "not to touch" the Greenbelt',
    url: '/scandals/the-greenbelt-scandal',
  },
  {
    date: '2022-11-04', icon: 'AlertTriangle',
    label: 'Secret 3-week Greenbelt land removal process begins under Ryan Amato',
    url: '/scandals/the-greenbelt-scandal',
  },
  {
    date: '2023-08-09', icon: 'FileText',
    label: 'Auditor General: Greenbelt changes to benefit PC donors worth $8.3B',
    url: '/scandals/the-greenbelt-scandal',
  },
  {
    date: '2023-09-01', icon: 'AlertTriangle',
    label: 'Housing Minister Steve Clark resigns amid Greenbelt scandal',
    url: '/scandals/the-greenbelt-scandal',
  },
  {
    date: '2023-10-05', icon: 'Gavel',
    label: 'RCMP opens criminal investigation into Greenbelt land changes',
    url: '/scandals/the-greenbelt-scandal',
  },
  {
    date: '2024-05-01', icon: 'Flag',
    label: 'Ford reverses Greenbelt removals — developers keep billions in land value gains',
    url: '/scandals/the-greenbelt-scandal',
  },

  // ─── ONTARIO PLACE / THERME ───────────────────────────────────────────────
  {
    date: '2022-06-01', icon: 'AlertTriangle',
    label: 'Therme Group awarded 95-year lease on Ontario Place for $1/year',
    url: '/scandals/ontario-place-therme-spa',
  },
  {
    date: '2024-12-10', icon: 'FileText',
    label: 'Auditor General: Ontario Place deal costs $2.24B; Therme credentials fabricated',
    url: '/scandals/ontario-place-therme-spa',
  },

  // ─── RON TAVERNER ─────────────────────────────────────────────────────────
  {
    date: '2018-12-11', icon: 'AlertTriangle',
    label: 'Ford appoints personal friend Ron Taverner as OPP Commissioner',
    url: '/scandals/ron-taverner-opp-appointment',
  },
  {
    date: '2019-02-01', icon: 'Gavel',
    label: 'Integrity Commissioner opens investigation into Taverner appointment',
    url: '/scandals/ron-taverner-opp-appointment',
  },
  {
    date: '2019-03-20', icon: 'Flag',
    label: 'Taverner withdraws from OPP Commissioner role amid ongoing scrutiny',
    url: '/scandals/ron-taverner-opp-appointment',
  },

  // ─── LONG-TERM CARE COVID ─────────────────────────────────────────────────
  {
    date: '2020-04-14', icon: 'AlertTriangle',
    label: 'Military deployed to LTC homes; documents "horrific" conditions under Ford\'s watch',
    url: '/scandals/long-term-care-covid-deaths',
  },
  {
    date: '2021-04-30', icon: 'FileText',
    label: 'Long-Term Care Commission final report: government failures contributed to deaths',
    url: '/scandals/long-term-care-covid-deaths',
  },

  // ─── BEER STORE ───────────────────────────────────────────────────────────
  {
    date: '2023-03-23', icon: 'AlertTriangle',
    label: 'Ford breaks legally binding Beer Store contract; $225M payout to taxpayers',
    url: '/scandals/beer-store-privatization',
  },
  {
    date: '2023-12-01', icon: 'FileText',
    label: 'FAO: Total cost of Beer Store privatization to hit $1.4B by 2030',
    url: '/scandals/beer-store-privatization',
  },

  // ─── HIGHWAY 413 / BRADFORD BYPASS ───────────────────────────────────────
  {
    date: '2019-06-01', icon: 'AlertTriangle',
    label: 'Ford revives Highway 413 and Bradford Bypass, both cancelled by Liberals',
    url: '/scandals/highway-413-bradford-bypass',
  },
  {
    date: '2021-04-03', icon: 'Newspaper',
    label: 'Investigation: Developers with $813K+ in PC donations own land along Hwy 413',
    url: '/scandals/highway-413-bradford-bypass',
  },
  {
    date: '2024-03-22', icon: 'Flag',
    label: 'Federal government drops environmental assessment for Highway 413',
    url: '/scandals/highway-413-bradford-bypass',
  },
  {
    date: '2025-08-01', icon: 'AlertTriangle',
    label: 'Construction begins on Highway 413 before environmental review completed',
    url: '/scandals/highway-413-bradford-bypass',
  },

  // ─── MZOS ─────────────────────────────────────────────────────────────────
  {
    date: '2020-12-31', icon: 'AlertTriangle',
    label: 'Ford issues 33 MZOs in 2020 alone — more than Liberals issued in 15 years',
    url: '/scandals/ministerial-zoning-orders',
  },
  {
    date: '2021-02-16', icon: 'Newspaper',
    label: 'Investigation: Half of Ford\'s MZOs benefit PC donors or party insiders',
    url: '/scandals/ministerial-zoning-orders',
  },
  {
    date: '2021-06-01', icon: 'Gavel',
    label: 'Bill 257: Ford exempts MZOs from provincial planning laws and environmental protections',
    url: '/scandals/ministerial-zoning-orders',
  },

  // ─── BILL 124 / BILL 28 ───────────────────────────────────────────────────
  {
    date: '2019-11-07', icon: 'AlertTriangle',
    label: 'Bill 124 passed — caps 780,000 public sector workers\' wages at 1% for 3 years',
    url: '/scandals/bill-124-128-wage-suppression',
  },
  {
    date: '2022-11-03', icon: 'AlertTriangle',
    label: 'Bill 28: Ford invokes notwithstanding clause to ban education worker strike',
    url: '/scandals/bill-124-128-wage-suppression',
  },
  {
    date: '2022-11-07', icon: 'Flag',
    label: 'Ford repeals Bill 28 after threat of province-wide general strike',
    url: '/scandals/bill-124-128-wage-suppression',
  },
  {
    date: '2022-11-29', icon: 'Gavel',
    label: 'Court strikes down Bill 124 as unconstitutional — Charter rights violated',
    url: '/scandals/bill-124-128-wage-suppression',
  },
  {
    date: '2024-02-12', icon: 'Gavel',
    label: 'Court of Appeal upholds ruling: Bill 124 unconstitutionally stripped worker rights',
    url: '/scandals/bill-124-128-wage-suppression',
  },

  // ─── FOI SCANDAL ──────────────────────────────────────────────────────────
  {
    date: '2023-08-09', icon: 'Newspaper',
    label: 'AG: Ford staff used code word "G*" to hide Greenbelt records from FOI',
    url: '/scandals/foi-transparency-scandal',
  },
  {
    date: '2025-10-01', icon: 'Gavel',
    label: 'IPC issues legal summons to Ford\'s former housing chief of staff Ryan Amato',
    url: '/scandals/foi-transparency-scandal',
  },
  {
    date: '2026-01-09', icon: 'Gavel',
    label: 'Court upholds: Ford must release personal cellphone records to public',
    url: '/scandals/foi-transparency-scandal',
  },
  {
    date: '2026-03-13', icon: 'AlertTriangle',
    label: 'Ford moves to exempt Premier\'s office from FOI law — retroactive to 1988',
    url: '/scandals/foi-transparency-scandal',
  },

  // ─── WATER PRIVATIZATION ──────────────────────────────────────────────────
  {
    date: '2021-07-01', icon: 'AlertTriangle',
    label: 'Ford lifts Liberal moratorium on new water bottling permits; grants BlueTriton 4.7M L/day',
    url: '/scandals/ontario-water-privatization',
  },
  {
    date: '2025-11-24', icon: 'AlertTriangle',
    label: 'Bill 60 passed — enables for-profit corporations to run municipal water systems',
    url: '/scandals/ontario-water-privatization',
  },
  {
    date: '2026-01-13', icon: 'AlertTriangle',
    label: 'Waterloo Region halts all new development — aquifer exhausted by Ford\'s industrial permits',
    url: '/scandals/ontario-water-privatization',
  },

  // ─── NIAGARA AMALGAMATION / BOB GALE ─────────────────────────────────────
  {
    date: '2024-12-15', icon: 'AlertTriangle',
    label: 'Ford appoints former PC candidate Bob Gale as Niagara Regional Chair — no election',
    url: '/scandals/niagara-amalgamation-gale',
  },
  {
    date: '2026-02-26', icon: 'AlertTriangle',
    label: 'Gale demands Niagara collapse into 1 or 4 cities; 8 of 12 mayors oppose',
    url: '/scandals/niagara-amalgamation-gale',
  },
  {
    date: '2026-03-12', icon: 'Newspaper',
    label: 'Gale resigns after anti-racism groups reveal he owns signed copy of Mein Kampf',
    url: '/scandals/niagara-amalgamation-gale',
  },
  {
    date: '2026-03-17', icon: 'AlertTriangle',
    label: 'Ford says he remains "keen" on Niagara amalgamation despite Gale resignation',
    url: '/scandals/niagara-amalgamation-gale',
  },

  // ─── PC FAR-RIGHT CONNECTIONS ─────────────────────────────────────────────
  {
    date: '2018-04-15', icon: 'AlertTriangle',
    label: 'Ford appoints Rebel Media host who defended Holocaust denial as PC candidate',
    url: '/scandals/pc-far-right-connections',
  },
  {
    date: '2018-09-22', icon: 'AlertTriangle',
    label: 'Ford photographed with white nationalist Faith Goldy; refuses to denounce her by name',
    url: '/scandals/pc-far-right-connections',
  },
  {
    date: '2022-02-15', icon: 'Newspaper',
    label: 'Former Ford PC MPP Randy Hillier photographed with Diagolon neo-fascist flag',
    url: '/scandals/pc-far-right-connections',
  },
  {
    date: '2023-11-15', icon: 'AlertTriangle',
    label: 'Muslim groups demand Ford remove MPP Ghamari over documented Islamophobia — Ford refuses',
    url: '/scandals/pc-far-right-connections',
  },
  {
    date: '2024-06-28', icon: 'Flag',
    label: 'Ford ejects MPP Ghamari after she publicizes meeting with Tommy Robinson (EDL founder)',
    url: '/scandals/pc-far-right-connections',
  },

  // ─── SKILLS DEVELOPMENT FUND ──────────────────────────────────────────────
  {
    date: '2025-10-01', icon: 'FileText',
    label: 'Auditor General: $750M in SDF grants "not fair, transparent or accountable"',
    url: '/scandals/skills-development-fund',
  },
  {
    date: '2025-10-03', icon: 'Newspaper',
    label: 'Ford\'s campaign manager Kory Teneycke\'s clients received $100M+ in SDF grants',
    url: '/scandals/skills-development-fund',
  },
  {
    date: '2025-10-15', icon: 'Gavel',
    label: 'Integrity Commissioner opens probe into Labour Minister Piccini over SDF',
    url: '/scandals/skills-development-fund',
  },

  // ─── BILL 212 / BIKE LANES ────────────────────────────────────────────────
  {
    date: '2024-11-25', icon: 'AlertTriangle',
    label: 'Bill 212: Ford orders Toronto bike lanes removed; buries immunity clause barring lawsuits',
    url: '/scandals/bill-212-bike-lanes',
  },
  {
    date: '2025-04-16', icon: 'Gavel',
    label: 'Court injunction halts bike lane removals pending Charter challenge',
    url: '/scandals/bill-212-bike-lanes',
  },
  {
    date: '2025-07-30', icon: 'Gavel',
    label: 'Ontario Superior Court: Bill 212 violates Charter right to life — immunity clause cited as proof',
    url: '/scandals/bill-212-bike-lanes',
  },
  {
    date: '2026-01-15', icon: 'Gavel',
    label: 'Court of Appeal hears Ford\'s challenge; injunction keeping bike lanes intact',
    url: '/scandals/bill-212-bike-lanes',
  },

  // ─── ONTARIO SCIENCE CENTRE ───────────────────────────────────────────────
  {
    date: '2024-06-21', icon: 'AlertTriangle',
    label: 'Ontario Science Centre abruptly closed — engineers\' own report didn\'t recommend it',
    url: '/scandals/ontario-science-centre-closure',
  },
  {
    date: '2024-12-10', icon: 'FileText',
    label: 'AG: Science Centre relocation already costs more than roof repairs would have',
    url: '/scandals/ontario-science-centre-closure',
  },
  {
    date: '2025-02-01', icon: 'Newspaper',
    label: 'Science Centre roof survives major snowstorm intact; Ford still refuses to reopen',
    url: '/scandals/ontario-science-centre-closure',
  },
  {
    date: '2025-11-15', icon: 'AlertTriangle',
    label: '$1.04B contract awarded for new Science Centre — 3× original estimate; 45% the size',
    url: '/scandals/ontario-science-centre-closure',
  },

]

async function main() {
  console.log(`Seeding ${events.length} timeline events across all scandals...\n`)

  let inserted = 0
  let skipped = 0

  for (const evt of events) {
    const existing = await sql`
      SELECT id FROM "TimelineEvent"
      WHERE date = ${evt.date}::date AND label = ${evt.label}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Skip: ${evt.date} — ${evt.label.substring(0, 55)}...`)
      skipped++
      continue
    }

    const id = cuid()
    const now = new Date().toISOString()

    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (
        ${id},
        ${evt.date}::date,
        ${evt.label},
        ${evt.url},
        ${evt.icon},
        ${'milestone'},
        ${true},
        ${now},
        ${now}
      )
    `
    console.log(`✅ ${evt.date} — ${evt.label.substring(0, 65)}`)
    inserted++
  }

  console.log(`\n🎉 Done. ${inserted} inserted, ${skipped} skipped.`)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
