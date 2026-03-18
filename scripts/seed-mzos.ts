/**
 * Seed script: MZO (Minister's Zoning Orders) Scandal
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-mzos.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ministerial-zoning-orders'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford's government issued more Minister's Zoning Orders (MZOs) in 2020 alone than the McGuinty and Wynne governments combined over 15 years — bypassing environmental reviews, municipal authority, and public consultation. Nearly half of all MZOs issued in Ford's first term benefited PC donors or party insiders. Key recipients include the DeGasperis family and Flato Developments, who received nine MZOs for thousands of homes on protected farmland.`

  const summary = `<p>A Minister's Zoning Order (MZO) is a rarely-used provincial power that allows the Housing Minister to override local zoning and bypass the normal land-use planning process — including municipal council votes, public consultations, and environmental assessments. Before the Ford government, MZOs were used sparingly: between 1969 and 2000, a span of 30 years, Ontario issued just 49. The combined McGuinty and Wynne Liberal governments issued a handful over 15 years.</p>
<p>Under Ford, MZOs became a routine instrument of developer politics. In 2020 alone, the government <a href="https://thenarwhal.ca/ministers-zoning-order-ontario-explainer/" target="_blank" rel="noopener noreferrer">issued 33 MZOs — more than twice what the Liberals issued in their entire tenure</a>. By early 2021, Ford had issued more than had been issued in the preceding three decades combined. Unlike ordinary planning approvals, MZOs are final and cannot be appealed to the Ontario Land Tribunal.</p>
<p>A 2021 investigation by <a href="https://www.nationalobserver.com/2021/02/16/investigations/ford-government-mzo-fast-tracked-developments-by-donors" target="_blank" rel="noopener noreferrer">Canada's National Observer</a> found that Ford donors directly benefited from MZO fast-tracking — with approval decisions overriding environmental concerns on properties owned by Progressive Conservative donors. The Ontario NDP documented that <a href="https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-government-mzos-developers-zoning-orders-1.5832817" target="_blank" rel="noopener noreferrer">19 of 38 MZOs benefited developers with records of donating to the PC party</a> or connections to PC insiders. In nine of those cases, developers had donated a combined $262,915 to the PCs.</p>`

  const why_it_matters = `<p>The MZO record is strikingly clear when you examine who benefited. The DeGasperis family — major PC donors whose fingerprints also appear on the Greenbelt scandal and Highway 413 corridor — received MZOs through their DG Group for a massive warehouse development in Vaughan that required destroying three protected wetlands. Flato Developments, owned by Shakir Rehmatullah, received <a href="https://environmentaldefence.ca/2022/04/05/three-shady-ministers-zoning-orders-in-ontario/" target="_blank" rel="noopener noreferrer">nine MZOs — more than any other developer in Ontario</a> — enabling over 8,000 new homes on farmland, floodplains, and rural land, overriding municipal planning decisions and conservation authority recommendations in multiple cases.</p>
<p>The MZO for a Pickering wetlands warehouse project became symbolic when <a href="https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzos-land-zoning-orders-greenbelt-1.7010332" target="_blank" rel="noopener noreferrer">CBC News revealed Amazon Canada was the intended tenant</a> — days before the wetland was about to be bulldozed. Amazon withdrew, and the government eventually reversed the MZO, but only after public outcry. In Caledon, an MZO fast-tracked a new neighbourhood for a consortium of developers including Fieldgate Developments, Mattamy Homes, and Paradise Developments, all of them consistent PC donors.</p>
<p>Ford's government also passed <a href="https://ecojustice.ca/pressrelease/environmental-defence-ontario-nature-and-ecojustice-on-bill-257-regarding-legislation-to-exempt-mzos-from-planning-laws-and-policy/" target="_blank" rel="noopener noreferrer">Bill 257, which explicitly exempted MZOs from provincial planning laws and policies</a> — including the Provincial Policy Statement protecting agricultural land and natural heritage. This meant MZOs could now override protections that even the Ford government's own planning rules were supposed to guarantee. Environmental Defence, Ontario Nature, and Ecojustice condemned the legislation as effectively removing any remaining constraints on the minister's power to approve whatever developers requested.</p>
<p>As the Greenbelt scandal unfolded in 2023, the connections between MZOs, Greenbelt land removal, and developer donor networks became increasingly clear. Many of the same developers who received MZOs had also lobbied for and benefited from Greenbelt boundary changes. The <a href="https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzos-land-zoning-orders-greenbelt-1.7010332" target="_blank" rel="noopener noreferrer">Auditor General's report on the Greenbelt scandal called out MZOs</a> as part of the same pattern of using provincial instruments to deliver value to politically connected developers.</p>`

  const rippling_effects = `<p>The MZO spree has had lasting land-use consequences. Dozens of projects that would have been rejected through normal planning processes — or that would have undergone extensive environmental review and public consultation — have been locked in by MZOs that cannot be appealed. Conservation authorities that raised objections were, in several cases, subsequently stripped of their powers through separate Ford government legislation (the More Homes Built Faster Act, 2022), further weakening the institutional checks that MZOs were already bypassing.</p>
<p>The pattern also demonstrated how political access translates into planning decisions in Ontario. Developers with lobbyists connected to the PC party, or with records of large donations, received MZOs quickly and with minimal public process. Developers without those connections — or projects that lacked political sponsorship — navigated the standard multi-year planning process. The result was a two-tier planning system where access to the Housing Minister's office determined outcomes.</p>
<p>Post-Greenbelt scandal, Ford promised reforms and review, but <a href="https://thepointer.com/article/2025-10-05/after-secretly-working-to-destroy-it-ford-government-silent-on-long-overdue-review-of-ontario-s-greenbelt" target="_blank" rel="noopener noreferrer">environmental groups and opposition parties documented continued use of MZOs</a> to benefit connected developers, with limited transparency about how decisions were being made. The underlying power remains intact and can be revived whenever a politically convenient project needs expedited approval.</p>`

  console.log('Inserting MZO scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Minister\'s Zoning Orders (MZOs)'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2021-02-16'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  // Legal Actions
  const legalActions = [
    {
      title: 'Bill 257 — Exempts MZOs from Provincial Planning Protections',
      status: 'Completed',
      description: `<p>Ford's government passed Bill 257 in 2021, which explicitly exempted MZOs from the Provincial Policy Statement and other provincial planning policies — including protections for agricultural land, natural heritage, and floodplains. Environmental Defence, Ontario Nature, and Ecojustice issued a joint statement condemning the legislation as effectively eliminating the last remaining constraints on the minister's ability to approve development anywhere in Ontario, regardless of environmental consequences.</p>`,
      url: 'https://ecojustice.ca/pressrelease/environmental-defence-ontario-nature-and-ecojustice-on-bill-257-regarding-legislation-to-exempt-mzos-from-planning-laws-and-policy/',
    },
    {
      title: 'Ecojustice Legal Challenge — MZO Wetlands',
      status: 'Completed',
      description: `<p>Environmental law charity Ecojustice launched legal challenges against specific MZOs that approved development on protected wetlands, arguing the government had violated federal Fisheries Act protections and provincial environmental laws. Several challenges focused on projects where conservation authorities had explicitly rejected development applications, only to have the minister override those decisions via MZO. The cases highlighted the legal grey zone created when MZO powers were used to circumvent environmental protection statutes.</p>`,
      url: 'https://ecojustice.ca/pressrelease/environmental-defence-ontario-nature-and-ecojustice-on-bill-257-regarding-legislation-to-exempt-mzos-from-planning-laws-and-policy/',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (
        ${laId}, ${scandalId}, ${la.title}, ${la.status},
        ${la.description}, ${la.url}, ${now}, ${now}
      )
    `
    console.log(`  ✅ Legal action: ${la.title}`)
  }

  // Sources
  const sources = [
    {
      title: 'National Observer — Ford donors benefit from MZO fast-tracked developments',
      url: 'https://www.nationalobserver.com/2021/02/16/investigations/ford-government-mzo-fast-tracked-developments-by-donors',
    },
    {
      title: 'The Narwhal — What\'s an MZO? Ontario\'s zoning power move, explained',
      url: 'https://thenarwhal.ca/ministers-zoning-order-ontario-explainer/',
    },
    {
      title: 'CBC News — Ford government using special provincial powers to help developer friends',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-government-mzos-developers-zoning-orders-1.5832817',
    },
    {
      title: 'CBC News — Ford government\'s fast-track zoning approvals under fresh scrutiny after Greenbelt scandal',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzos-land-zoning-orders-greenbelt-1.7010332',
    },
    {
      title: 'Environmental Defence — Three Shady Minister\'s Zoning Orders in Ontario',
      url: 'https://environmentaldefence.ca/2022/04/05/three-shady-ministers-zoning-orders-in-ontario/',
    },
    {
      title: 'Environmental Defence — What You Need to Know About MZOs',
      url: 'https://environmentaldefence.ca/2020/08/28/may-never-heard-ministers-zoning-order-used-ok-not-anymore/',
    },
    {
      title: 'Ecojustice — Statement on Bill 257 exempting MZOs from planning laws',
      url: 'https://ecojustice.ca/pressrelease/environmental-defence-ontario-nature-and-ecojustice-on-bill-257-regarding-legislation-to-exempt-mzos-from-planning-laws-and-policy/',
    },
    {
      title: 'Wikipedia — Ontario Minister\'s Zoning Orders Controversy',
      url: 'https://en.wikipedia.org/wiki/Ontario_minister%27s_zoning_orders_controversy',
    },
    {
      title: 'Globe and Mail — Ontario issues special orders to approve developers\' plans and quash opposition',
      url: 'https://www.theglobeandmail.com/canada/toronto/article-ontario-issues-special-orders-to-approve-developers-plans-and-quash/',
    },
    {
      title: 'The Pointer — Ontario Auditor General unwraps Doug Ford\'s multi-billion dollar Greenbelt gift to developers',
      url: 'https://thepointer.com/article/2023-08-11/ontario-auditor-general-unwraps-doug-ford-s-multi-billion-dollar-greenbelt-gift-to-developers',
    },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 60)}...`)
  }

  console.log('\n🎉 MZO scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
