/**
 * Seed script: Ontario Place / Therme Spa Scandal
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-ontario-place.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ontario-place-therme-spa'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford handed 8 acres of prime Toronto waterfront to an Austrian spa company that had misrepresented its own credentials, locked taxpayers into a 95-year lease, and watched infrastructure costs balloon from $424M to $2.24 billion — all through a procurement process the Auditor General found was not fair, transparent, or accountable.`

  const summary = `In 2022, the Ford government signed a 95-year lease giving Therme Group — an Austrian company that had falsely claimed to operate six spas when it operated one — exclusive use of Ontario Place's West Island waterfront for a private spa and waterpark. The province agreed to spend hundreds of millions preparing the site, build a $400M parking garage, and forcibly close and relocate the beloved Ontario Science Centre. By 2024, the total taxpayer cost had ballooned to an estimated $2.24 billion — $1.8 billion more than originally projected. The Auditor General's December 2024 report found the entire procurement process was rigged in Therme's favour, with the winning bidder given preferential access to government officials that other bidders never received.`

  const why_it_matters = `<p>Ontario Place is 155 acres of prime public waterfront in the heart of Toronto — land owned by every Ontarian. The Ford government's decision to hand the crown jewel of that site, the 8-acre West Island, to a private Austrian spa company on a <a href="https://www.theglobeandmail.com/canada/article-ontario-place-therme-canada-documents/">95-year lease</a> was controversial from the start. What the Auditor General's <a href="https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-setup-1.7399052">December 2024 report</a> revealed made it explosive.</p>

<p>The procurement process that selected Therme was, the AG found, not <strong>"fair, transparent or accountable to all participants"</strong> and broke the province's own rules. During the bidding period, an Infrastructure Ontario vice-president <a href="https://globalnews.ca/news/10898839/auditor-general-ontario-place-2024/">exchanged nine emails and a phone call</a> with Therme's legal counsel — contact not offered to competing bidders. Ford's office met with representatives from three shortlisted bidders in the summer of 2019 while other competitors were excluded. Therme was given a head start that other bidders never received.</p>

<p>Worse: <a href="https://www.cbc.ca/news/canada/toronto/ontario-place-spa-deal-1.7511819">Therme had lied about its own credentials</a>. In its submission, the company claimed to operate "six globally placed facilities." A New York Times investigation found it operated <strong>one</strong> — a single spa in Romania. Infrastructure Ontario conducted no due diligence to verify the claim. At the time of its pitch, Therme had less than $1.1 million in equity.</p>

<p>The financial deal is a disaster for taxpayers. The province agreed to spend <a href="https://opencouncil.ca/theme-spa-ontario-place/">$525–675 million</a> in public infrastructure to support Therme's facility — site servicing, flood mitigation, soil remediation, and a <strong>$400-million parking garage</strong> — in exchange for lease revenue worth roughly $380 million in present value over 95 years. Ontario is paying more than it will ever receive back, handing private profit a public subsidy. The AG found that as of February 2024, site costs had <a href="https://www.theglobeandmail.com/canada/article-ontario-place-auditor-general-report/">ballooned to $2.24 billion</a> — $1.8 billion above the government's own original estimate of $335–424 million.</p>

<p>Intertwined with the Therme deal is the forced closure and relocation of the <a href="https://globalnews.ca/news/10899041/ontario-science-centre-relocation-cost/">Ontario Science Centre</a>. Ford announced in April 2023 that the OSC — one of Canada's most visited cultural institutions — would be torn down and rebuilt at Ontario Place, freeing its Don Mills site for future development. The OSC's Don Mills location was <a href="https://www.cbc.ca/news/canada/toronto/ontario-science-centre-update-9.7106984">abruptly closed June 21, 2024</a>, citing roof damage requiring $22M in repairs — a closure critics called a convenient pretext. Relocation costs rose $400 million in less than eight months, and the AG found the government's original business case for the move was <strong>manipulated to reach a pre-determined conclusion</strong>, excluding full costs and omitting consultation with the City of Toronto or school boards.</p>`

  const rippling_effects = `<p>The physical and cultural damage is already done: the Ontario Science Centre — a 56-year-old institution that welcomed 1.5 million visitors annually — was <a href="https://www.cbc.ca/news/canada/toronto/ontario-science-centre-update-9.7106984">permanently shuttered</a> on less than 24 hours' notice in June 2024. Its 400,000-square-foot replacement at Ontario Place will be smaller and won't open until at least 2029. A generation of Toronto children will grow up without it.</p>

<p>The Therme deal also set a troubling template: Ford's government routinely used the Ontario Place redevelopment to bypass normal planning rules. The project required <strong>multiple ministerial zoning orders (MZOs)</strong> and exemptions from the City of Toronto's planning process — decisions that stripped local government and residents of their normal oversight role over one of the city's most significant public spaces.</p>

<p>Therme's credibility concerns haven't gone away. <a href="https://nowtoronto.com/news/ontarians-urge-doug-ford-to-scrap-ontario-place-spa-after-investigation-claims-developer-made-false-claims-to-secure-contract/">Public pressure</a> mounted after the misrepresentation allegations emerged, with calls to cancel the contract entirely. Ford refused, saying he was "very satisfied" with the deal. As of early 2026, construction is underway, locking Ontario into a 95-year relationship with a company that lied to win the contract.</p>

<p>The total cost to Ontarians — $2.24 billion and counting in public infrastructure, plus a century of foregone public use of prime waterfront — makes this one of the most expensive backroom deals in Ontario's history. And unlike the Greenbelt, it wasn't reversed. The public land is gone for a generation.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ontario Place / Therme Spa',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2024-12-03',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: "Auditor General Special Report — Ontario Place Redevelopment",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-setup-1.7399052',
      description: `<p>Released December 3, 2024, the Auditor General's report found the procurement process for Ontario Place was not <strong>"fair, transparent or accountable"</strong>, broke the province's own rules, and gave Therme preferential access to government officials. The AG also found Therme's submitted credentials were never verified despite containing five false claims about facilities it did not own or operate. The report recommended the government review the lease terms and improve oversight — recommendations the Ford government acknowledged without committing to substantive change.</p>`,
    },
    {
      title: "Auditor General Special Report — Ontario Science Centre Relocation",
      status: 'settled',
      url: 'https://globalnews.ca/news/10899041/ontario-science-centre-relocation-cost/',
      description: `<p>A separate AG finding in December 2024 concluded that the government's business case for relocating the Ontario Science Centre to Ontario Place was incomplete and <strong>manipulated to reach a pre-determined conclusion</strong>. Costs excluded from the original analysis caused the estimated total to rise by $400 million within eight months. The AG found the decision was made without proper consultation with the City of Toronto or school boards, and without a genuine comparison of the cost of renovating vs. relocating the existing facility.</p>`,
    },
    {
      title: "Freedom of Information Battles Over Lease Terms",
      status: 'active',
      url: 'https://rabble.ca/columnists/why-is-doug-ford-so-secretive-about-ontario-place-spa-deal/',
      description: `<p>For years, the Ford government refused to release the terms of the Therme lease, citing commercial confidentiality. Journalists and opposition MPPs filed Freedom of Information requests and faced repeated delays and redactions. The province <a href="https://www.cbc.ca/news/canada/toronto/therme-lease-details-1.7341585">finally released key lease details in October 2024</a>, revealing that Therme pays minimal rent and that 30% of the purportedly "public" outdoor space around the spa can be commercially restricted by Therme at its discretion. Critics argued the government's years of secrecy were designed to prevent public scrutiny until construction was too far along to reverse.</p>`,
    },
  ]

  for (const la of legalActions) {
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, NOW(), NOW())
    `
  }
  console.log(`✅ ${legalActions.length} legal actions inserted`)

  const sources = [
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-setup-1.7399052', title: "Ontario Place redevelopment not 'fair, transparent or accountable,' auditor general finds — CBC News" },
    { url: 'https://www.theglobeandmail.com/canada/article-ontario-place-auditor-general-report/', title: "Ontario Place redevelopment cost rises by $1.8-billion as Auditor-General questions bid process — The Globe and Mail" },
    { url: 'https://globalnews.ca/news/10899041/ontario-science-centre-relocation-cost/', title: "Cost of moving Ontario Science Centre skyrockets before construction even starts — Global News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-place-spa-deal-1.7511819', title: "Province grilled over Therme's credentials to build luxury spa at Ontario Place — CBC News" },
    { url: 'https://globalnews.ca/news/10898839/auditor-general-ontario-place-2024/', title: "Bombshell AG report says Ontario Place redevelopment 'not fair, transparent or accountable' — Global News" },
    { url: 'https://opencouncil.ca/theme-spa-ontario-place/', title: "Ford government spending $525-675M on Therme Spa to get up to $380-580M in value back over 95 years — Open Council" },
    { url: 'https://www.cbc.ca/news/canada/toronto/therme-lease-details-1.7341585', title: "Province reveals details of multi-million dollar, 95-year Therme lease at Ontario Place — CBC News" },
    { url: 'https://nowtoronto.com/news/ontarians-urge-doug-ford-to-scrap-ontario-place-spa-after-investigation-claims-developer-made-false-claims-to-secure-contract/', title: "'Cancel the deal,' Ontarians urge Doug Ford to scrap Ontario Place spa after developer made false claims — NOW Toronto" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-update-9.7106984', title: "Ontario Science Centre to close immediately — CBC News" },
    { url: 'https://www.canadianarchitect.com/the-auditor-generals-report-part-1-the-cost-of-privatizing-ontario-place/', title: "The Auditor General's Report, Part 1: The cost of privatizing Ontario Place — Canadian Architect" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Ontario Place scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
