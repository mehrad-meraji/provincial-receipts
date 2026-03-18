/**
 * Seed script: Highway 413 / Bradford Bypass
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-highway-413.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'highway-413-bradford-bypass'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford revived two cancelled highway megaprojects — the $8.6–12 billion Highway 413 and the $2–4 billion Bradford Bypass — despite independent studies showing negligible traffic benefits. Developers who own thousands of acres along both routes donated over $800,000 to Ford's PCs. Both projects were shielded from meaningful federal environmental review.`

  const summary = `<p>Highway 413 (the GTA West Corridor) is a 52-kilometre, 400-series highway connecting Highway 401/407 at the Halton–Peel boundary to Highway 400 north of Vaughan. The Bradford Bypass is a 16.9-kilometre highway that would slice through the Holland Marsh and connect Bradford West Gwillimbury to East Gwillimbury. Both were cancelled by previous governments over environmental and fiscal concerns. Doug Ford revived both in 2019 and has since pushed them forward against sustained expert, scientific, and public opposition.</p>
<p>Highway 413's price tag has been estimated at <a href="https://environmentaldefence.ca/2024/04/30/premier-doug-fords-claim-that-highway-413-construction-will-begin-in-2025-is-wishful-thinking-in-view-of-todays-updates-to-federal-impact-assessment/" target="_blank" rel="noopener noreferrer">$8.6 billion to $12 billion</a> — a figure Ford has refused to publicly disclose. An <a href="https://www.nationalobserver.com/2023/11/07/news/traffic-study-shows-ontario-highway-413-not-needed" target="_blank" rel="noopener noreferrer">independent traffic study found the highway would save commuters an average of 30 seconds</a> per trip. Government's own internal briefing documents, obtained by journalists, <a href="https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/internal-ontario-government-traffic-forecast-shows-crushing-gridlock-ahead-even-with-the-413-9356033" target="_blank" rel="noopener noreferrer">confirmed that only 5% of morning rush-hour drivers</a> — those who travel the full 52-kilometre length — would ever see the 30-minute savings Ford publicly touts. For the other 95%, traffic modelling shows the highway will not meaningfully improve gridlock, and may worsen it through induced demand.</p>
<p>The Bradford Bypass, originally costed at $800 million, has seen estimates balloon to <a href="https://thepointer.com/article/2024-12-15/the-bradford-bypass-will-devastate-the-holland-marsh-and-do-nothing-to-fix-congestion-but-the-pcs-don-t-want-you-to-know-that" target="_blank" rel="noopener noreferrer">$2–4 billion according to the Auditor General</a>, without the Ford government releasing an updated public figure. The environmental assessment underpinning the project was completed in 1997 — nearly 30 years ago — and Ford moved to fast-track construction before any updated review was conducted.</p>`

  const why_it_matters = `<p>The Highway 413 corridor runs through 2,000 acres of farmland, crosses 85 waterways, paves over nearly 400 acres of protected Greenbelt land, disrupts 220 wetlands, and threatens the habitat of 10 species at risk. The Bradford Bypass would cut through 27 waterways and 11 hectares of sensitive wetlands in the Holland Marsh — a region sometimes called "Ontario's vegetable garden" for its highly fertile soils and agricultural significance.</p>
<p>The developer connection is extensively documented. A 2021 investigation by <a href="https://www.nationalobserver.com/2021/04/03/investigations/developers-ties-ford-government-benefit-highway-413" target="_blank" rel="noopener noreferrer">National Observer and Torstar</a> found that 3,300 acres of land along the Highway 413 route were owned by just eight major property developers, most of them prolific PC donors. Developers with land along the corridor donated <a href="https://www.ontariondp.ca/news/ford-s-pcs-took-753000-donations-developers-413-won-t-say-what-it-ll-cost" target="_blank" rel="noopener noreferrer">at least $753,000 to Ford's Progressive Conservatives</a>. The DeGasperis family and their company TACC Construction alone donated over $55,000, while employing former Conservative MP Peter Van Loan as a lobbyist registered specifically to influence "the impact of the proposed highway on client's lands."</p>
<p>Along the Bradford Bypass corridor, the pattern repeated: <a href="https://www.nationalobserver.com/2021/10/31/news/how-bradford-bypass-became-pork-barrel-doug-fords-rich-developer-donors" target="_blank" rel="noopener noreferrer">property records showed members of the DeGasperis family began buying up lands near Bradford</a> shortly after Ford revived the project in 2019. January Properties — with three DeGasperis family members listed as directors — paid $20.5 million for 94 acres near Holland Landing just four months after the highway was announced.</p>
<p>The Ford government also sought to shield both projects from federal environmental oversight. After Canada's Impact Assessment Agency initially designated Highway 413 for review, the federal and provincial governments struck a deal in March 2024 to <a href="https://www.nationalobserver.com/2024/03/22/news/feds-drop-greenbelt-impact-assessment-doug-ford-highway-413" target="_blank" rel="noopener noreferrer">drop the federal assessment</a>. In December 2024, the Impact Assessment Agency formally <a href="https://www.nationalobserver.com/2024/12/23/news/federal-impact-assessment-Ontario-Ford-Highway-413" target="_blank" rel="noopener noreferrer">rejected requests from environmental groups and First Nations for a renewed review</a>. For the Bradford Bypass, a federal court judge ruled in April 2023 that the federal government had acted <a href="https://thenarwhal.ca/bradford-bypass-federal-review-rejected/" target="_blank" rel="noopener noreferrer">"unreasonably" in denying an environmental assessment</a> — but ultimately no meaningful review has been conducted.</p>`

  const rippling_effects = `<p>In August 2025, Ford awarded the first construction contracts for Highway 413 — an embankment at the Highway 401/407 interchange and road resurfacing on Highway 10 in Caledon — <a href="https://www.cbc.ca/news/canada/toronto/highway-413-construction-begins-ontario-doug-ford-1.7618852" target="_blank" rel="noopener noreferrer">formally beginning construction</a> despite no completed independent cost-benefit analysis and unresolved concerns from environmental groups, First Nations, and scientists. A January 2026 internal government report obtained by journalists <a href="https://thepointer.com/article/2026-01-24/a-highway-to-hell-developer-driven-413-will-have-devastating-environmental-impacts-internal-report-admits" target="_blank" rel="noopener noreferrer">admitted the highway would have devastating environmental impacts</a>, contradicting the government's own public messaging.</p>
<p>Transportation experts consistently warn that building new highways to relieve congestion triggers "induced demand" — the well-documented phenomenon in which new road capacity generates new car trips, filling the new lanes within five to ten years and returning congestion to pre-highway levels. The government's own internal traffic forecasts <a href="https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/internal-ontario-government-traffic-forecast-shows-crushing-gridlock-ahead-even-with-the-413-9356033" target="_blank" rel="noopener noreferrer">project "crushing gridlock" ahead even with Highway 413 built</a>.</p>
<p>Both highways serve a secondary function beyond moving cars: they enable and accelerate low-density sprawl development on the urban fringe. The corridors open up Greenbelt-adjacent land for subdivision development, converting farmland and wetlands into subdivisions, and generating enormous profits for the developers who own land along the routes — many of whom, as documented, are major PC donors. This connects Highway 413 and the Bradford Bypass directly to the broader Greenbelt scandal as instruments of the same developer-first land-use agenda.</p>
<p>The combined cost of both projects — potentially $10–16 billion of public funds — crowds out spending on transit, healthcare, and education at a time of severe provincial fiscal pressure. Ontario's <a href="https://thepointer.com/article/2024-05-18/bradford-bypass-is-a-blatant-misuse-of-public-funds" target="_blank" rel="noopener noreferrer">Auditor General and independent analysts have called both projects a misuse of public funds</a>, noting the money could fund transformative transit expansions that would benefit far more commuters across a far greater area. Ford has committed tens of billions to roads, while repeatedly delaying, cancelling, or downloading costs for transit expansion across the region.</p>`

  console.log('Inserting Highway 413 / Bradford Bypass scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Highway 413 / Bradford Bypass'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2021-04-03'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  // Legal Actions
  const legalActions = [
    {
      title: 'Federal Court Rules Bradford Bypass EA Refusal Unreasonable',
      status: 'Completed',
      description: `<p>In April 2023, Federal Court Justice Angela Furlanetto ruled that Environment Minister Steven Guilbeault had acted "unreasonably" under the Impact Assessment Act when he declined to designate the Bradford Bypass for a federal environmental review. The court found the decision failed to properly account for the project's potential impacts on federal jurisdiction areas including fisheries and migratory birds. Despite the ruling, the project has continued to advance without a comprehensive updated environmental assessment — the existing EA dates to 1997.</p>`,
      url: 'https://thenarwhal.ca/bradford-bypass-federal-review-rejected/',
    },
    {
      title: 'Impact Assessment Agency Rejects Highway 413 Federal Review Requests',
      status: 'Completed',
      description: `<p>In December 2024, Canada's Impact Assessment Agency formally rejected calls from environmental groups, First Nations communities, and hundreds of scientists for a federal environmental review of Highway 413. This came after the federal government struck a deal with Ontario in March 2024 to drop an earlier designation, agreeing instead to a weaker "collaboration" framework. Critics argued the federal government effectively abdicated its environmental oversight responsibilities under political pressure from the Ford government.</p>`,
      url: 'https://www.nationalobserver.com/2024/12/23/news/federal-impact-assessment-Ontario-Ford-Highway-413',
    },
    {
      title: 'Bill 5 — Cutting Red Tape to Build Ontario Act',
      status: 'In Progress',
      description: `<p>Ford's government passed Bill 5 in 2025, which critics described as designed to fast-track Highway 413 construction while further limiting environmental oversight and public challenge mechanisms. The legislation stripped away additional procedural protections and shortened timelines for reviews, enabling construction to commence before environmental and Indigenous consultation processes were fully resolved. Environmental groups challenged the law's compatibility with federal environmental obligations.</p>`,
      url: 'https://thenarwhal.ca/ontario-highway-413-bill-5/',
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
      title: 'National Observer — Developers with ties to Ford government stand to cash in on Hwy. 413',
      url: 'https://www.nationalobserver.com/2021/04/03/investigations/developers-ties-ford-government-benefit-highway-413',
    },
    {
      title: 'National Observer — Feds drop Greenbelt impact assessment for Ford\'s Highway 413',
      url: 'https://www.nationalobserver.com/2024/03/22/news/feds-drop-greenbelt-impact-assessment-doug-ford-highway-413',
    },
    {
      title: 'National Observer — Feds rule out environmental assessment on Ford\'s Highway 413 — for good',
      url: 'https://www.nationalobserver.com/2024/12/23/news/federal-impact-assessment-Ontario-Ford-Highway-413',
    },
    {
      title: 'National Observer — How Bradford Bypass became a pork barrel for Ford\'s rich developer donors',
      url: 'https://www.nationalobserver.com/2021/10/31/news/how-bradford-bypass-became-pork-barrel-doug-fords-rich-developer-donors',
    },
    {
      title: 'The Narwhal — Highway 413 and Bradford Bypass: a guide to Ford\'s controversial plans',
      url: 'https://thenarwhal.ca/highway-413-bradford-bypass-explainer/',
    },
    {
      title: 'The Narwhal — Construction starting on Highway 413: what you need to know',
      url: 'https://thenarwhal.ca/ontario-highway-413-bill-5/',
    },
    {
      title: 'The Narwhal — Bradford Bypass federal review rejected',
      url: 'https://thenarwhal.ca/bradford-bypass-federal-review-rejected/',
    },
    {
      title: 'The Trillium — Internal Ontario government traffic forecast shows crushing gridlock ahead — even with the 413',
      url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/internal-ontario-government-traffic-forecast-shows-crushing-gridlock-ahead-even-with-the-413-9356033',
    },
    {
      title: 'The Pointer — Highway 413 & Doug Ford\'s developer-driven transportation planning',
      url: 'https://thepointer.com/article/2025-02-21/highway-413-doug-ford-s-developer-driven-transportation-planning',
    },
    {
      title: 'The Pointer — Bradford Bypass will devastate the Holland Marsh and do nothing to fix congestion',
      url: 'https://thepointer.com/article/2024-12-15/the-bradford-bypass-will-devastate-the-holland-marsh-and-do-nothing-to-fix-congestion-but-the-pcs-don-t-want-you-to-know-that',
    },
    {
      title: 'Ontario NDP — Ford\'s PCs took $753,000 in donations from developers for the 413',
      url: 'https://www.ontariondp.ca/news/ford-s-pcs-took-753000-donations-developers-413-won-t-say-what-it-ll-cost',
    },
    {
      title: 'CBC News — Construction starts on Highway 413',
      url: 'https://www.cbc.ca/news/canada/toronto/highway-413-construction-begins-ontario-doug-ford-1.7618852',
    },
    {
      title: 'Environmental Defence — Highway 413 Environmental Impacts',
      url: 'https://environmentaldefence.ca/2024/04/30/premier-doug-fords-claim-that-highway-413-construction-will-begin-in-2025-is-wishful-thinking-in-view-of-todays-updates-to-federal-impact-assessment/',
    },
    {
      title: 'National Observer — New traffic study shows Ontario\'s Highway 413 not needed',
      url: 'https://www.nationalobserver.com/2023/11/07/news/traffic-study-shows-ontario-highway-413-not-needed',
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

  console.log('\n🎉 Highway 413 / Bradford Bypass scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
