/**
 * Seed script: Ford's Toronto Waterfront Power Grab
 * Exhibition Place, Lake Ontario Convention Centre & Billy Bishop Airport
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-waterfront-power-grab.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'toronto-waterfront-power-grab'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Between November 2025 and March 2026, the Ford government announced plans to provincialize three of Toronto's major waterfront assets in rapid succession: legislative changes to seize Exhibition Place (192 acres of City of Toronto land); a proposal to fill in part of Lake Ontario to build a 2-million-square-foot convention centre (the city was not consulted); and a unilateral takeover of Billy Bishop Airport. None of these announcements were preceded by consultation with the City of Toronto or its residents. The convention centre site remains unconfirmed, unfeasibility-studied, and unfunded. The Exhibition Place moves followed years of provincial encroachment on adjacent Ontario Place — a $2.2-billion redevelopment awarded, without competition, to a company whose VP of Communications was Doug Ford's own former Chief of Staff.`

  const summary = `<p>Toronto's waterfront has been the site of sustained provincial encroachment under Doug Ford. The Ford government has awarded a 95-year lease of Ontario Place's West Island to a European spa company for a private waterpark, spent $2.2 billion in provincial funds to build the infrastructure to support it, attempted to seize Exhibition Place — 192 acres of City of Toronto land adjacent to Ontario Place — through legislation buried in a budget omnibus bill, announced a plan to fill in part of Lake Ontario to build a 2-million-square-foot convention centre with no formal site, no feasibility study, and no cost estimate beyond "a few billion dollars," and announced the provincial takeover of Billy Bishop Airport from the City of Toronto. These announcements came within months of each other in late 2025 and early 2026. The city was not meaningfully consulted on any of them.</p>
<p>The backdrop for all of it is Ontario Place. In 2021, Ford's government signed a 95-year lease agreement with Therme Group — an Austrian company that, at the time of the deal, operated a single spa in Romania — to build a private indoor waterpark on the publicly owned West Island of Ontario Place. Infrastructure Ontario later projected the province would spend $2.2 billion building the infrastructure necessary to make the Therme waterpark operational: parking, transit connections, underground utilities, and remediation. The Therme deal was not subject to competitive tender. Its award to a company with minimal operating history became the subject of ongoing controversy when the New York Times reported that Therme had misrepresented the scale of its operations. Ford said he was "very satisfied" with the deal.</p>
<p>Therme's VP of Communications and External Relations is Mark Lawson — formerly Doug Ford's Deputy Chief of Staff and Head of Policy, and subsequently Chief of Staff to Finance Minister Peter Bethlenfalvy. Therme's lobbyists included Amir Remtulla, Ford's former Executive Assistant from City Hall. These connections between the Ford government and the company receiving a $2.2-billion provincial infrastructure commitment on a 95-year lease were never publicly disclosed when the deal was announced.</p>`

  const why_it_matters = `<p><strong>The Exhibition Place Land Grab (November 2025):</strong> Exhibition Place is a 192-acre event and public space venue on the waterfront, directly adjacent to Ontario Place. It is owned and governed by the City of Toronto — a City of Toronto Act agency with a board of city councillors. In November 2025, the Ford government buried amendments to the <em>Rebuilding Ontario Place Act (ROPA)</em> inside a budget omnibus bill, Bill 68. The changes would allow Exhibition Grounds to be designated as part of the Ontario Place site, giving the province power over decisions regarding the sale and alteration of land and buildings on the Exhibition Place site — land it does not own.</p>
<p>Minister Stan Cho's office insisted: "We are not taking over Exhibition Place." Deputy Mayor and Exhibition Place Board chair Ausma Malik said the province had not shared details with the city and that if the amendment was what it looked like, it was "not acceptable." The Exhibition Place CEO said any unilateral provincial move to seize the site "must be challenged." NDP MPP Chris Glover called it "an unconscionable land grab." The legislation passed. The province has maintained it has no current plans to exercise the new powers — while retaining the legal authority to do so.</p>
<p><strong>The Lake Ontario Convention Centre (March 2026):</strong> On March 2, 2026, Ford teased a "spectacular" new convention centre announcement "coming shortly." On March 6, he confirmed he was considering filling in part of Lake Ontario — between Humber Bay Park and Ontario Place — to create new land for a 2-million-square-foot facility, nearly three times the size of the Metro Toronto Convention Centre. Ford called it a future cause of "shock and awe" and compared it favourably to Chicago's McCormick Place.</p>
<p>There is no formal site. There has been no environmental assessment. There is no cost estimate beyond Ford saying it will cost "a few billion dollars." The City of Toronto, Exhibition Place, and the office of the city councillor for the waterfront area were not consulted or alerted before the announcement. Exhibition Place CEO Dianne Young said her organization had "no knowledge" of any plans involving their site. Ford, asked whether Exhibition Place was the intended location, said "just stay tuned." The Metro Toronto Convention Centre — which the province's own Auditor General found is ranked 18th out of 21 comparable North American facilities and has caused $490 million in lost economic activity — continues to operate with no confirmed replacement plan, timeline, or funding.</p>
<p><strong>The Billy Bishop Airport Takeover (March 2026):</strong> On approximately March 10, 2026, Ford announced the province "will be taking over" the City of Toronto's stake in Billy Bishop Airport on the Toronto Island. The city receives approximately $5 million per year from the airport. Under Ontario's <em>Expropriations Act</em>, the province can take municipal land within six months of a formal objection. Ford has expressed interest in extending the runway to accommodate jets — over Mayor Olivia Chow's objection on noise grounds. The city was not consulted before the announcement. Three major waterfront assets — Exhibition Place, the Ontario Place/Lake Ontario shoreline, and Billy Bishop Airport — are now under formal provincial control or subject to announced provincial plans, across a three-month period, without a comprehensive planning process, environmental review, or public engagement with the city that contains them all.</p>`

  const rippling_effects = `<p>Councillor Paula Fletcher described the pattern directly: Ford is "using all his provincial powers in the worst way." Councillor Josh Matlow said Ford is "handing tax dollars out to his friends while blowing billions on an unnecessary convention centre on a magical island." Interim Liberal leader John Fraser called the lake infill plan a "fantasy island." NDP leader Marit Stiles said Ford is spending money on "vanity projects" while grocery prices and emergency room wait times worsen. Green Party leader Mike Schreiner called the plan "a ridiculous idea." Mayor Olivia Chow said she is "prepared to work with the province" on convention centre investment but has not seen a formal plan and does not support jets at Billy Bishop.</p>
<p>What makes the pattern notable is not that any single decision is necessarily wrong in isolation — Toronto does need a larger convention centre, and provincial investment in waterfront infrastructure can serve a public good. What is notable is the method: unilateral announcement, without consultation, without feasibility study, and without a credible accountability structure for $2-billion-plus spending decisions. The Ontario Place Therme deal — now the template for how Ford approaches waterfront redevelopment — was awarded without competition, to a company whose VP was Ford's own former senior policy adviser, at a cost of $2.2 billion in provincial infrastructure spending for a private waterpark on a 95-year lease.</p>
<p>The convention centre announcement has no tender, no environmental assessment, no confirmed site, no engineering study on the feasibility of filling in Lake Ontario, and no federal or municipal approval. Filling in Lake Ontario would require federal navigation and environmental approvals under the <em>Canadian Navigable Waters Act</em> and the <em>Impact Assessment Act</em>. None of those processes have been initiated. The announcement is, as of March 2026, a press conference with no plan behind it — coming from the same government that spent $2.2 billion in infrastructure for a European spa company on the basis of a deal signed before the company had built a single facility at the scale it described.</p>`

  console.log('Inserting Toronto Waterfront Power Grab scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Toronto Waterfront Power Grab — Exhibition Place, Convention Centre & Billy Bishop'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2026-03-02'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Bill 68 — Provincial Seizure Powers Over Exhibition Place (November 2025)',
      status: 'Active — Law in Force',
      description: `<p>In November 2025, the Ford government introduced Bill 68 — a budget omnibus bill — containing amendments to the <em>Rebuilding Ontario Place Act (ROPA)</em> that would allow Exhibition Grounds to be designated as part of the Ontario Place site, giving the province legal authority over decisions regarding the sale and alteration of land and buildings on the 192-acre City of Toronto-owned Exhibition Place. The Exhibition Place Board chair and Deputy Mayor Ausma Malik called the move "not acceptable" and said the province had not shared details with the city. The Exhibition Place CEO said any unilateral provincial seizure "must be challenged." NDP MPP Chris Glover called it "an unconscionable land grab." The amendments passed as part of the omnibus. The province maintains it has no current plans to exercise the powers — but retains the legal authority to do so.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/province-control-exhibition-place-proposed-bill-68-9.6979531',
    },
    {
      title: 'Ontario Place Expropriation — Province Expropriated City of Toronto Land (2023)',
      status: 'Resolved — Land Transferred',
      description: `<p>In 2023, the Ford government's environmental assessment for the Ontario Place redevelopment explicitly stated: "If an agreement to transfer the City of Toronto-owned water or lands to the Government of Ontario is not reached, expropriation will be required." The province subsequently expropriated adjacent City of Toronto land — including parking infrastructure on Exhibition Place grounds — compensating the city approximately $8 million. This was the first major use of provincial expropriation against the City of Toronto to advance the Ontario Place redevelopment, establishing the legal and political template for subsequent moves against Exhibition Place and Billy Bishop Airport.</p>`,
      url: 'https://globalnews.ca/news/10117315/ontario-place-expropriation-toronto-ford-government/',
    },
    {
      title: 'Billy Bishop Airport — Province Announces Unilateral Takeover (March 2026)',
      status: 'Active — Expropriation Process Initiated',
      description: `<p>On approximately March 10, 2026, Ford announced the province "will be taking over" the City of Toronto's stake in Billy Bishop Airport on the Toronto Island. The city receives approximately $5 million per year from the airport. Under Ontario's <em>Expropriations Act</em>, the province can take municipal land within six months of a formal objection. Ford has expressed intent to extend the runway to allow jets, over the objection of Mayor Olivia Chow who opposes jets at the downtown airport due to noise. The city was not consulted before the announcement. Councillors described the unilateral move as part of a broader pattern of provincial encroachment on Toronto's waterfront.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ford-province-billy-bishop-takeover-9.7122427',
    },
    {
      title: 'Therme Group Deal — $2.2B Provincial Infrastructure for Private Waterpark, No Competitive Tender (2021–present)',
      status: 'Active — Construction Underway',
      description: `<p>In 2021, Ford's government signed a 95-year lease agreement with Therme Group — an Austrian company that at the time operated a single spa in Romania — to build a private indoor waterpark on Ontario Place's West Island. Infrastructure Ontario projected the province would spend $2.2 billion building the necessary infrastructure: parking, transit connections, underground utilities, and site remediation. The Therme deal was not subject to competitive tender. Therme's VP of Communications and External Relations, Mark Lawson, was formerly Doug Ford's Deputy Chief of Staff and Head of Policy, and then Chief of Staff to Finance Minister Peter Bethlenfalvy. Therme retained lobbyists including Amir Remtulla, Ford's former Executive Assistant. A 2024 New York Times investigation reported Therme had misrepresented the scale of its operations when the deal was signed. Ford said he was "very satisfied" with the deal. Construction is ongoing; opening projected around 2029.</p>`,
      url: 'https://spacing.ca/toronto/2022/11/02/lorinc-who-is-behind-the-therme-group-the-spa-company-redeveloping-ontario-place/',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${laId}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, ${now}, ${now})
    `
    console.log(`  ✅ Legal action: ${la.title.substring(0, 70)}...`)
  }

  const sources = [
    { title: 'CBC News — Ford government could take control of Exhibition Place under Bill 68 (November 2025)', url: 'https://www.cbc.ca/news/canada/toronto/province-control-exhibition-place-proposed-bill-68-9.6979531' },
    { title: 'CTV News — NDP claims Ford government could take control of City-owned Exhibition Place', url: 'https://www.ctvnews.ca/toronto/article/ontario-ndp-claims-ford-government-could-take-control-of-city-owned-exhibition-place-under-new-legislation/' },
    { title: 'NOW Toronto — NDP MPP accuses Ford government of taking over Exhibition Place', url: 'https://nowtoronto.com/news/ndp-mpp-accuses-ford-government-of-taking-over-exhibition-place/' },
    { title: 'Global News — Ford government to expropriate land from City of Toronto for Ontario Place (2023)', url: 'https://globalnews.ca/news/10117315/ontario-place-expropriation-toronto-ford-government/' },
    { title: 'CBC News — Ford muses about filling in part of Toronto waterfront for new convention centre (March 2026)', url: 'https://www.cbc.ca/news/canada/toronto/ford-muses-about-filling-in-part-of-toronto-waterfront-convention-centre-9.7117750' },
    { title: 'Globe and Mail — Ford eyes artificial island for massive convention centre, sources say', url: 'https://www.theglobeandmail.com/canada/article-ford-eyes-artificial-island-for-massive-convention-centre-sources-say/' },
    { title: 'Globe and Mail — Ford looking to fill in part of Lake Ontario to build Toronto convention centre', url: 'https://www.theglobeandmail.com/canada/article-doug-ford-fill-in-lake-ontario-toronto-convention-centre/' },
    { title: 'CP24 — Plans in works to replace Metro Toronto Convention Centre, Ford says (March 2, 2026)', url: 'https://www.cp24.com/local/toronto/2026/03/02/spectacular-new-toronto-convention-space-to-be-announced-shortly-ford-says/' },
    { title: 'CP24 — Doug Ford eyeing filling in part of Lake Ontario for new convention centre (March 6, 2026)', url: 'https://www.cp24.com/local/toronto/2026/03/06/doug-ford-eyeing-filling-in-part-of-lake-ontario-for-new-convention-centre/' },
    { title: 'The Trillium — Ontario to build two million square foot convention centre', url: 'https://www.thetrillium.ca/municipalities-newsletter/ontario-to-build-two-million-square-foot-convention-centre-11966748' },
    { title: 'Global News — Toronto convention centre could be piece of Ontario Place puzzle, Ford hints', url: 'https://globalnews.ca/news/11714429/toronto-convention-centre-location/' },
    { title: 'CBC News — Ford says Ontario government will take over Toronto\'s Billy Bishop Airport (March 2026)', url: 'https://www.cbc.ca/news/canada/toronto/ford-province-billy-bishop-takeover-9.7122427' },
    { title: 'National Observer — Toronto councillors say Ford is overreaching again with airport takeover', url: 'https://www.nationalobserver.com/2026/03/13/news/toronto-billy-bishop-airport-doug-ford-overreach' },
    { title: 'Spacing Toronto — Who is behind the Therme Group?', url: 'https://spacing.ca/toronto/2022/11/02/lorinc-who-is-behind-the-therme-group-the-spa-company-redeveloping-ontario-place/' },
    { title: 'BlogTO — Doug Ford is taking over Toronto\'s waterfront and people are fed up (March 2026)', url: 'https://www.blogto.com/city/2026/03/doug-ford-taking-over-toronto-people-fed-up/' },
    { title: 'Toronto Life — Why does Doug Ford want to fill in part of Lake Ontario?', url: 'https://torontolife.com/city/why-does-doug-ford-want-to-fill-in-part-of-lake-ontario/' },
    { title: 'National Observer — Ford suggests building new Toronto convention centre in Lake Ontario (March 6, 2026)', url: 'https://www.nationalobserver.com/2026/03/06/news/ford-toronto-convention-centre-lake-ontario' },
    { title: 'CBC News — Expropriation an option for land needed for Ontario Place redevelopment (2023)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-place-expropriate-city-land-province-1.6898917' },
    { title: 'TorontoToday — Why does Doug Ford want to build a new convention centre?', url: 'https://www.torontotoday.ca/local/politics-government/ford-building-new-world-class-convention-centre-toronto-11957169' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 70)}...`)
  }

  const timelineEvents = [
    {
      date: '2021-06-01',
      label: 'Ford signs 95-year lease with Therme Group for private waterpark at Ontario Place — no competitive tender',
      icon: 'FileText',
      url: 'https://spacing.ca/toronto/2022/11/02/lorinc-who-is-behind-the-therme-group-the-spa-company-redeveloping-ontario-place/',
    },
    {
      date: '2023-07-01',
      label: 'Ontario Place environmental assessment: province threatens to expropriate City of Toronto waterfront land',
      icon: 'AlertTriangle',
      url: 'https://globalnews.ca/news/10117315/ontario-place-expropriation-toronto-ford-government/',
    },
    {
      date: '2025-11-01',
      label: 'Bill 68: Ford buries Exhibition Place seizure powers in budget omnibus bill',
      icon: 'Flag',
      url: 'https://www.cbc.ca/news/canada/toronto/province-control-exhibition-place-proposed-bill-68-9.6979531',
    },
    {
      date: '2026-03-02',
      label: 'Ford teases "spectacular" new convention centre announcement "coming shortly" — city not consulted',
      icon: 'Megaphone',
      url: 'https://www.cp24.com/local/toronto/2026/03/02/spectacular-new-toronto-convention-space-to-be-announced-shortly-ford-says/',
    },
    {
      date: '2026-03-06',
      label: 'Ford confirms considering filling in Lake Ontario for 2-million sq ft convention centre',
      icon: 'Megaphone',
      url: 'https://www.cbc.ca/news/canada/toronto/ford-muses-about-filling-in-part-of-toronto-waterfront-convention-centre-9.7117750',
    },
    {
      date: '2026-03-10',
      label: 'Ford announces province will take over Billy Bishop Airport from City of Toronto',
      icon: 'Flag',
      url: 'https://www.cbc.ca/news/canada/toronto/ford-province-billy-bishop-takeover-9.7122427',
    },
  ]

  for (const te of timelineEvents) {
    const teId = cuid()
    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, icon, url, published, "createdAt", "updatedAt")
      VALUES (${teId}, ${te.date}, ${te.label}, ${te.icon}, ${te.url}, ${true}, ${now}, ${now})
    `
    console.log(`  ✅ Timeline event: ${te.label.substring(0, 70)}...`)
  }

  console.log('\n🎉 Toronto Waterfront Power Grab scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
