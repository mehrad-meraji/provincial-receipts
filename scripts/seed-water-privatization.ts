/**
 * Seed script: Ontario Water Privatization Scandal
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-water-privatization.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  // Simple cuid-like ID for seeding
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ontario-water-privatization'

  // Check if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `The Ford government has pursued a multi-front assault on Ontario's public water systems: passing legislation that enables privatization of $175.8 billion in municipal water infrastructure, dismantling the province's Clean Water Act protections, deregulating the water-taking permit system that allows aquifer overuse, and refusing to require mining companies to obtain permits before taking groundwater — all while Waterloo Region hit a water capacity crisis severe enough to halt development.`

  const summary = `Between 2021 and 2026, the Ford government systematically weakened Ontario's public water protections through a series of overlapping legislative and regulatory changes. The centrepiece is Bill 60 (the Fighting Delays, Building Faster Act, 2025), passed in November 2025, which created the Water and Wastewater Public Corporations Act — legislation that allows the Minister of Municipal Affairs and Housing to designate for-profit corporations incorporated under the Business Corporations Act to take over water and sewage services from municipalities. A legal opinion commissioned by CUPE Ontario in March 2026 confirmed that the word "public" in the legislation has no legal force and that nothing in the Act requires these corporations to remain publicly owned. The first target for this model is Peel Region, whose government is already being broken up by the province. In parallel, the Ford government amended the Ontario Water Resources Act to allow water-taking permits to be transferred between companies — and even reinstated for cancelled or revoked permits — without public review, environmental assessment, or First Nations consultation. In December 2025, the province proposed exempting mineral exploration companies from needing any permit at all to take water for early-stage work. Meanwhile, Waterloo Region — whose 600,000+ residents depend on the Waterloo Moraine for 80 per cent of their drinking water — was forced to halt all new development in early 2026 after the Ford government approved more than 100 industrial water-taking permits over five years, some carrying the province's own highest-risk environmental rating. Bill 56 (2025) further weakened the Clean Water Act by centralizing ministerial control over source water protection plans and reducing local input. Bill 68 (2025) proposed collapsing Ontario's 36 Conservation Authorities into just seven, gutting the watershed monitoring and source protection work that underpins safe drinking water province-wide.`

  const why_it_matters = `<p>Ontario's drinking water systems represent one of the largest public assets in the province — valued at <strong>$175.8 billion</strong> in infrastructure. The Ford government has pursued what critics call a three-pronged privatization agenda:</p>

<ol>
  <li><strong>Privatizing water delivery infrastructure</strong> through Bill 60's Water and Wastewater Public Corporations Act (November 2025)</li>
  <li><strong>Deregulating groundwater extraction</strong> through changes to the Ontario Water Resources Act (2025) and the proposed exemption of mining companies from Permit to Take Water requirements (December 2025)</li>
  <li><strong>Dismantling the oversight system</strong> through Bill 56's Clean Water Act amendments and Bill 68's Conservation Authority amalgamations</li>
</ol>

<h3>Bill 60 and the Privatization of Water Delivery</h3>
<p>Buried in the omnibus <a href="https://www.ola.org/en/legislative-business/bills/parliament-44/session-1/bill-60">Fighting Delays, Building Faster Act, 2025</a> is the Water and Wastewater Public Corporations Act, which empowers the Minister of Municipal Affairs and Housing to designate corporations to deliver water and wastewater services for municipalities. The bill was <strong>time-allocated</strong> — giving the government control to bypass committee comment and limit debate to less than 10 hours in total for a bill determining the future of Ontario's water systems.</p>

<p>A legal opinion by <strong>Simon Archer of Goldblatt LLP</strong>, commissioned by <a href="https://cupe.on.ca/damning-legal-opinion-challenges-ford-conservatives-claims-about-water-privatization/">CUPE Ontario</a> and released March 13, 2026, found that: the term "public" in the legislation's title "does not have any real legal effect"; the government's repeated use of "municipal service corporations" to describe these entities is "incorrect and misleading" because that language appears nowhere in the Act; and the Minister has unfettered discretion to determine ownership, meaning corporations could be privately owned without any further legislative debate. Archer drew a direct parallel to Ontario's privatization of local electricity distribution companies in the early 2000s, which began as public entities and were gradually opened to private investors.</p>

<p>The government's own <a href="https://ero.ontario.ca/notice/025-1098">Environmental Registry proposal</a> confirmed the first application of the legislation is Peel Region — whose regional government the province is simultaneously dissolving. Critics warned the Peel Transition Board's draft recommendation that water and wastewater services transition to a "provincially regulated utility" was a roadmap to privatization.</p>

<h3>Groundwater Deregulation</h3>
<p>Separately, the Ford government proposed changes to <a href="https://www.nationalobserver.com/2025/08/05/news/ford-ontario-water-resources-act-changes">Ontario Regulation 387/04 under the Ontario Water Resources Act</a> (public consultation: July 2–August 1, 2025) that would allow Permits to Take Water to be transferred between companies — and even reinstated after they had been cancelled, revoked or expired — without any new public review, environmental assessment, or Indigenous consultation. Under existing law, a cancelled or revoked permit had previously required the full application process, precisely because permits are most often cancelled due to overuse, contamination, or violation of permit conditions. Ontario law requires a permit for any taking exceeding <strong>50,000 litres per day</strong> from lakes, rivers, streams, or groundwater.</p>

<p>In December 2025, the government went further: proposing to <a href="https://www.nationalobserver.com/2025/12/09/news/ford-water-permits-mining-ontario">exempt hundreds of mineral exploration companies</a> from needing any permit to take water for early-stage work, framing it as support for the province's Critical Mineral Strategy.</p>

<h3>The Waterloo Crisis</h3>
<p>The real-world consequences became visible in early 2026. A <a href="https://www.nationalobserver.com/2026/01/13/analysis/ford-waterloo-water-taking-environmental-impact">Canada's National Observer investigation (January 2026)</a> found the Ford government approved more than <strong>100 water-taking permits</strong> in Waterloo Region over five years — some flagged by the province's own assessments as carrying the <em>highest risk of unacceptable environmental impact</em>. The Waterloo Moraine supplies roughly <strong>80 per cent</strong> of drinking water to the region's 600,000+ residents. By early 2026, the Region of Waterloo had <a href="https://thecord.ca/waterloo-region-hits-water-capacity-limit-pauses-growth/">hit its water capacity limit</a> and was forced to halt all new development approvals in portions of Kitchener, Waterloo, and Cambridge. Environmental Defence called on the province to <a href="https://environmentaldefence.ca/2026/02/25/ontario-government-must-reject-new-water-taking-permits-that-threaten-waterloo-regions-water-supply/">reject pending water-taking permit applications</a>, and the Ontario Greens asked for a moratorium on commercial water permits in the region. The Ford government declined.</p>

<h3>Dismantling Post-Walkerton Protections</h3>
<p><a href="https://thenarwhal.ca/ontario-bill-56-clean-water-act/">Bill 56 (Building a More Competitive Economy Act, 2025)</a>, which received Royal Assent November 27, 2025, amended the <em>Clean Water Act</em> to centralize power over source water protection plans at Queen's Park and reduce local input. Source protection plans — the first line of defence against contamination events like the Walkerton E. coli outbreak that killed seven Ontarians and sickened 2,000 in 2000 — can now be deemed approved if the Minister fails to respond within 120 days. Combined with Bill 68's collapse of 36 Conservation Authorities into seven, critics say Ontario is <a href="https://cupe.on.ca/bill-60-becomes-law-ontario-water-at-risk-as-government-rushes-privatization-and-deregulation/">systematically dismantling the post-Walkerton framework</a> in ways that echo the Harris government's deregulation that enabled that disaster.</p>

<h3>Background: Water Bottling and the Moratorium</h3>
<p>The Ford government's record on water extraction precedes 2025. In 2017, the Liberal government imposed a moratorium on new water-bottling permits to study environmental impacts. Ford extended it briefly, then lifted it in 2021, introducing new regulations. That same year, the government granted <strong>BlueTriton</strong> (formerly Nestlé Waters) a five-year renewal to extract up to <strong>4.7 million litres of groundwater per day</strong> from two wells in Wellington County — a total over the permit's life of more than <strong>8 billion litres</strong> from the Aberfoyle (Puslinch) and Hillsburgh (Erin) aquifers. BlueTriton exited Ontario in late 2024 amid community opposition; in January 2025, its Hillsburgh well was purchased by <strong>White Wolf Property Management</strong>, run by the Gott family — who also own <strong>Ice River Springs</strong>, another bottled water company. Centre Wellington township separately purchased the Elora well for $1.8 million in April 2025, returning it to public ownership.</p>`

  const rippling_effects = `<p>The most immediate consequence was in Waterloo Region, where the Ford government's permit approvals drove the region to its groundwater limit. By early 2026, all new development in the <strong>Mannheim Service Area</strong> — covering Kitchener, Waterloo, and parts of Cambridge — was halted. Regional councillors formally pushed the Ford government on water permits in February 2026; <a href="https://www.nationalobserver.com/2026/02/06/news/waterloo-councillors-push-ford-government-over-water-permits">Canada's National Observer reported</a> the province showed no sign of pausing approvals.</p>

<p>The First Nations response has been sharp. <a href="https://www.nationalobserver.com/2025/12/16/news/first-nations-ontario-water-taking-opposition">Ontario Regional Chief Abram Benedict</a> stated that removing the water-permit trigger for mining exploration "violates treaty rights, including the right to free, prior and informed consent." The permit application process is a key trigger point where companies must consult Indigenous communities before work begins — without it, companies could proceed in ways that harm water quality and traditional use. Nine First Nations went to court seeking an injunction against Bill 5 and its mining-focused provisions. The <a href="https://chiefs-of-ontario.org/chiefs-of-ontario-raises-concerns-regarding-provincial-proposal-to-allow-mining-project-proponents-to-take-water-without-permit/">Chiefs of Ontario</a> demanded the province withdraw the proposed changes and consult before proceeding.</p>

<p>The <strong>Keep Water Public</strong> coalition — comprising CUPE, The Council of Canadians, ACORN Ontario, the Canadian Association of Physicians for the Environment, and Ontario Nature — has run an active public campaign and is supporting legal challenges. <a href="https://environmentaldefence.ca/2026/03/13/new-legal-opinion-confirms-ontarios-slippery-slope-toward-water-privatization/">Environmental Defence</a> endorsed the March 2026 legal opinion and called on the government to amend Bill 60 to explicitly bar private ownership of water and wastewater corporations.</p>

<p>The Ontario NDP, led on this issue by MPP <strong>Catherine Fife</strong> (Waterloo), have been the primary legislative opposition — calling for a moratorium on commercial water-taking permits in the Waterloo Region and pushing for explicit public-ownership language in the Water and Wastewater Public Corporations Act. The Ontario Greens launched a petition and a moratorium demand in March 2026.</p>

<p>The timing is notable: the Ford government introduced its proposed <a href="https://www.nationalobserver.com/2026/03/13/news/doug-ford-freedom-of-information-law">FOI exemptions for the Premier's Office and cabinet ministers</a> on March 13, 2026 — the same day the CUPE legal opinion on water privatization dropped, raising concerns the FOI changes would prevent future scrutiny of water-related ministerial decisions.</p>

<p>Internationally, the pattern echoes failed water privatization experiments — most infamously in Cochabamba, Bolivia (2000), and the UK, where private water companies have faced years of regulatory battles over sewage dumping and rate increases. Closer to home, Ontario's own partial privatization of electricity distribution companies in the early 2000s — the precise structural model identified by Simon Archer's legal opinion — resulted in years of controversy over rates and accountability. Experts warn that once water infrastructure is incorporated under the Business Corporations Act, the fiduciary duty to shareholders creates structural pressure to prioritize returns over public health, even without formal government instruction to do so.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ontario Water Privatization',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2025-11-24',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'First Nations Injunction Against Bill 5 (Mining/Water Exemptions)',
      status: 'active',
      url: 'https://chiefs-of-ontario.org/first-nations-leadership-responds-to-the-passing-of-bill-5-with-warning-of-legal-and-grassroots-action/',
      description: `<p>Nine First Nations in Ontario filed for a court injunction against <strong>Bill 5</strong> (Protect Ontario by Unleashing our Economy Act, 2025), which passed June 5, 2025. The legal challenge targets provisions including the <em>Special Economic Zones Act</em> and the weakening of environmental and Indigenous consultation requirements — including the proposed exemption of mining exploration companies from needing a Permit to Take Water. <a href="https://chiefs-of-ontario.org/chiefs-of-ontario-raises-concerns-regarding-provincial-proposal-to-allow-mining-project-proponents-to-take-water-without-permit/">Chiefs of Ontario</a> stated the changes violate the duty to consult and treaty rights to water.</p>`,
    },
    {
      title: 'CUPE Ontario / Ontario NDP Legal Opinion Challenge (Bill 60)',
      status: 'active',
      url: 'https://cupe.on.ca/damning-legal-opinion-challenges-ford-conservatives-claims-about-water-privatization/',
      description: `<p>On March 13, 2026, CUPE Ontario and the Ontario NDP released a legal opinion by <strong>Simon Archer of Goldblatt LLP</strong> challenging the Ford government's claim that water and wastewater corporations under Bill 60's <em>Water and Wastewater Public Corporations Act</em> will be publicly owned. The opinion found the word "public" in the legislation has no binding legal effect, that nothing in the Act requires public ownership, and that the Minister has unfettered discretion over who can own the corporations. The opinion called the government's use of "municipal service corporations" — a term that does carry a public-ownership requirement — "incorrect and misleading" since that phrase appears nowhere in the legislation.</p>`,
    },
    {
      title: 'Environmental Registry Public Consultation — Water Permit Transfer Changes (ERO 025-0730)',
      status: 'settled',
      url: 'https://ero.ontario.ca/notice/025-0730',
      description: `<p>The Ministry of the Environment, Conservation and Parks held public consultation (July 2–August 1, 2025) on proposed amendments to Ontario Regulation 387/04 (Water Taking and Transfer) that would allow water-taking permits to be transferred between companies, and reinstated if previously cancelled, revoked, or expired — without requiring a new public review, environmental assessment, or First Nations consultation. Environmental groups, municipalities, and First Nations submitted opposition. The final regulatory outcome was still being assessed as of early 2026.</p>`,
    },
    {
      title: 'Waterloo Region Moratorium Demand (Ontario Greens / Environmental Defence)',
      status: 'active',
      url: 'https://environmentaldefence.ca/2026/02/25/ontario-government-must-reject-new-water-taking-permits-that-threaten-waterloo-regions-water-supply/',
      description: `<p>After the Region of Waterloo was forced to halt development approvals due to groundwater capacity limits in early 2026, Environmental Defence formally called on the Ontario government to reject pending water-taking permit applications threatening the Waterloo Moraine. The Ontario Greens separately <a href="https://gpo.ca/2026/03/05/clancy-requests-moratorium-on-water-taking-permits-in-waterloo/">requested a moratorium on commercial water-taking permits</a> in the region. The Ford government had approved more than 100 industrial permits in the region over the previous five years, some ranked by provincial assessors at the highest risk of unacceptable environmental impact. As of March 2026, no moratorium has been granted.</p>`,
    },
  ]

  for (const la of legalActions) {
    const id = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, NOW(), NOW())
    `
  }
  console.log(`✅ ${legalActions.length} legal actions inserted`)

  // Sources
  const sources = [
    { url: 'https://cupe.on.ca/damning-legal-opinion-challenges-ford-conservatives-claims-about-water-privatization/', title: 'Damning legal opinion challenges Ford Conservatives\' claims about water privatization — CUPE Ontario (March 13, 2026)' },
    { url: 'https://environmentaldefence.ca/2026/03/13/new-legal-opinion-confirms-ontarios-slippery-slope-toward-water-privatization/', title: 'New Legal Opinion Confirms Ontario\'s Slippery Slope Toward Water Privatization — Environmental Defence (March 13, 2026)' },
    { url: 'https://www.businesswire.com/news/home/20260312204933/en/With-new-legal-opinion-CUPE-Ontario-and-Ontario-NDP-challenge-Conservatives-claims-on-Bill-60-and-water-privatization', title: 'With new legal opinion, CUPE Ontario and Ontario NDP challenge Conservatives\' claims on Bill 60 and water privatization — Business Wire (March 12, 2026)' },
    { url: 'https://www.nationalobserver.com/2026/01/13/analysis/ford-waterloo-water-taking-environmental-impact', title: 'Ford\'s permit approvals have driven Waterloo to its water-taking limit — Canada\'s National Observer (January 13, 2026)' },
    { url: 'https://www.nationalobserver.com/2026/02/06/news/waterloo-councillors-push-ford-government-over-water-permits', title: 'Waterloo councillors push Ford government over water permits — Canada\'s National Observer (February 6, 2026)' },
    { url: 'https://environmentaldefence.ca/2026/02/25/ontario-government-must-reject-new-water-taking-permits-that-threaten-waterloo-regions-water-supply/', title: 'Ontario Government Must Reject Water-Taking Permits Threatening Waterloo Region\'s Water Supply — Environmental Defence (February 25, 2026)' },
    { url: 'https://gpo.ca/2026/03/05/clancy-requests-moratorium-on-water-taking-permits-in-waterloo/', title: 'Clancy requests moratorium on water-taking permits in Waterloo — Ontario Greens (March 5, 2026)' },
    { url: 'https://www.nationalobserver.com/2025/12/09/news/ford-water-permits-mining-ontario', title: 'Ford moves to let mining companies take water — no permit required — Canada\'s National Observer (December 9, 2025)' },
    { url: 'https://www.nationalobserver.com/2025/12/16/news/first-nations-ontario-water-taking-opposition', title: 'Ontario chiefs fight plan to let mining companies take water without permits — Canada\'s National Observer (December 16, 2025)' },
    { url: 'https://chiefs-of-ontario.org/chiefs-of-ontario-raises-concerns-regarding-provincial-proposal-to-allow-mining-project-proponents-to-take-water-without-permit/', title: 'Chiefs of Ontario Raises Concerns Regarding Provincial Proposal to Allow Mining Project Proponents to Take Water Without Permit — Chiefs of Ontario' },
    { url: 'https://www.nationalobserver.com/2025/11/28/news/ford-water-services-municipal', title: 'Ford government dives into municipal business as it eyes water services — Canada\'s National Observer (November 28, 2025)' },
    { url: 'https://cupe.on.ca/bill-60-becomes-law-ontario-water-at-risk-as-government-rushes-privatization-and-deregulation/', title: 'Bill 60 becomes law: Ontario water at risk as government rushes privatization and deregulation — CUPE Ontario (November 24, 2025)' },
    { url: 'https://cupe.on.ca/keep-water-public-coalition-conservative-governments-bill-60-turns-water-into-a-business-and-threatens-public-health/', title: 'Keep Water Public coalition: Conservative government\'s Bill 60 turns water into a business and threatens public health — CUPE Ontario (November 17, 2025)' },
    { url: 'https://environmentaldefence.ca/2025/11/14/privatizing-drinking-water-could-leave-ontarians-with-big-bills-bad-service-and-dirty-water/', title: 'Privatizing Drinking Water Could Lead to Big Bills, Bad Service and Dirty Water — Environmental Defence (November 14, 2025)' },
    { url: 'https://pressprogress.ca/ontario-claims-province-isnt-privatizing-water/', title: 'Ontario\'s Government Claims the Province Isn\'t Privatizing Water. Experts Are Not Convinced. — Press Progress' },
    { url: 'https://www.nationalobserver.com/2025/10/28/news/ford-ontario-water-taking-permits', title: 'Ford fast-tracking water permits despite environmental concerns — Canada\'s National Observer (October 28, 2025)' },
    { url: 'https://www.nationalobserver.com/2025/08/05/news/ford-ontario-water-resources-act-changes', title: 'Ford government\'s proposed water rules will suck Ontario dry, critics say — Canada\'s National Observer (August 5, 2025)' },
    { url: 'https://environmentaldefence.ca/2025/07/29/proposed-water-permitting-changes-threaten-ontarios-freshwater/', title: 'Proposed Water Permitting Changes Threaten Ontario\'s Freshwater — Environmental Defence (July 29, 2025)' },
    { url: 'https://thenarwhal.ca/ontario-bill-56-clean-water-act/', title: 'Ford plans changes to Ontario\'s Clean Water Act — The Narwhal' },
    { url: 'https://ero.ontario.ca/notice/025-0730', title: 'Proposed amendments to Water Taking and Transfer Regulation — Environmental Registry of Ontario (ERO 025-0730)' },
    { url: 'https://ero.ontario.ca/notice/025-1098', title: 'Proposed amendments to transfer Peel Region water/wastewater jurisdiction and Water and Wastewater Public Corporations Act — Environmental Registry of Ontario (ERO 025-1098)' },
    { url: 'https://thenarwhal.ca/ontario-bluetriton-water-bottling-closes/', title: 'BlueTriton, formerly Nestlé, closing Guelph water bottling plant — The Narwhal' },
    { url: 'https://canadians.org/media/premier-ford-gives-american-bottled-water-giant-permit-draw-billions-litres-ontario/', title: 'Premier Ford gives American bottled water giant permit to draw billions of litres of Ontario groundwater — Council of Canadians' },
    { url: 'https://keepwaterpublic.ca/', title: 'Keep Water Public — Coalition campaign website' },
    { url: 'https://thecord.ca/waterloo-region-hits-water-capacity-limit-pauses-growth/', title: 'Waterloo Region Hits Water Capacity Limit, Pauses Growth — The Cord' },
    { url: 'https://chiefs-of-ontario.org/first-nations-leadership-responds-to-the-passing-of-bill-5-with-warning-of-legal-and-grassroots-action/', title: 'First Nations Leadership responds to the passing of Bill 5 with warning of legal and grassroots action — Chiefs of Ontario' },
    { url: 'https://thepointer.com/article/2026-03-10/hostile-takeover-pcs-move-ahead-with-conservation-authority-merger-despite-widespread-concern', title: '\'Hostile takeover\': PCs move ahead with conservation authority merger despite widespread concern — The Pointer (March 10, 2026)' },
    { url: 'https://rabble.ca/environment/authoritarian-doug-ford-is-privatizing-our-water/', title: 'Authoritarian Doug Ford is privatizing our water — Rabble.ca' },
    { url: 'https://esemag.com/water/coalition-warns-bill-60-will-erode-water-safety-affordability-ontario/', title: 'Coalition warns Bill 60 erodes water safety, affordability in Ontario — Environmental Science & Engineering Magazine' },
    { url: 'https://cupe.ca/ontario-water-risk-government-rushes-privatization-and-deregulation-bill-60', title: 'Ontario water at risk as government rushes privatization and deregulation with Bill 60 — CUPE National' },
  ]

  for (const s of sources) {
    const id = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Water Privatization scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
