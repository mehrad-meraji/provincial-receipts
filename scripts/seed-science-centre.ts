/**
 * Seed script: Ontario Science Centre — Manufactured Closure & Ontario Place Relocation
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-science-centre.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ontario-science-centre-closure'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford abruptly closed the Ontario Science Centre on June 21, 2024, citing a dangerous roof — but the engineers' own report did not recommend closure. The same roofing material exists in 400+ other Ontario buildings that remain open. The roof survived a major snowstorm intact. Ford refused to reopen it anyway. The Science Centre is now temporarily housed in a mall and at Harbourfront while a replacement is built at Ontario Place — a project whose cost has ballooned from $322 million to over $1 billion, with the new building 45% the size of the original.`

  const summary = `<p>On June 21, 2024, the Ford government announced the immediate and permanent closure of the Ontario Science Centre — a beloved 55-year-old public institution designed by Raymond Moriyama and visited by generations of Ontario schoolchildren — citing roof safety concerns. The Ministry of Infrastructure stated that RAAC (Reinforced Autoclaved Aerated Concrete) roofing panels were in a "distressed, high-risk" condition and that fixing them would cost $22–40 million and require closing the building for up to two years.</p>
<p>Within days, journalists and architects obtained and published the engineering reports — and they told a very different story. A close reading by <a href="https://www.canadianarchitect.com/ontario-science-centre-doesnt-require-full-closure-a-close-reading-of-the-engineers-report/" target="_blank" rel="noopener noreferrer">Canadian Architect</a> found that the Rimkus Consulting report did not recommend closure. The "high-risk" panels represented <strong>less than 2.5% of the building's total roof area</strong>, concentrated almost entirely in non-exhibition areas. The draft reports — obtained through FOI requests — had recommended routine repairs to specific panels over the summer. The final report, <a href="https://www.canadianarchitect.com/draft-engineering-reports-didnt-suggest-closure-of-ontario-science-centre-new-documents-reveal/" target="_blank" rel="noopener noreferrer">released only after the closure was announced</a>, was more alarming in tone than its predecessors — and texts between Infrastructure Ontario's CEO and communications staff suggested the Ministry's communications team had been involved in shaping the engineers' public-facing conclusions.</p>
<p><a href="https://www.cbc.ca/news/canada/toronto/ontario-science-centre-closure-roof-concrete-panels-raac-1.7245973" target="_blank" rel="noopener noreferrer">CBC News found that the same RAAC panels exist in approximately 400 other Ontario buildings</a> — none of which had been closed. The same material is present in Ontario schools without replacement budgets, yet those buildings remained open. When a major snowstorm in early 2025 deposited record loads on the Science Centre's roof and it withstood the stress without incident, <a href="https://www.cbc.ca/news/canada/toronto/ontario-science-centre-roof-passes-test-call-to-reopen-liberal-mpp-9.7065687" target="_blank" rel="noopener noreferrer">Ford still refused to reopen it</a>.</p>`

  const why_it_matters = `<p>The closure did not happen in isolation. It was announced in the context of the Ford government's plan to relocate the Science Centre to Ontario Place — the same waterfront site at the centre of the Therme spa deal — and to demolish the original Don Mills building. The closure and relocation were announced together, suggesting the safety rationale was constructed to justify a decision that had already been made for other reasons: the Science Centre's Don Mills location needed to be vacated to facilitate the broader Ontario Place redevelopment.</p>
<p>The financial case for relocation collapsed on examination. The Ford government had argued that repairing and renewing the existing Science Centre would cost $478 million — more than building new. The Auditor General's December 2024 report found that this framing was misleading: the government's own business plan had projected <strong>$257 million in savings over 50 years</strong> from relocation. By the time the AG reported, relocation costs had <a href="https://www.canadianarchitect.com/cost-of-ontario-science-centre-temporary-location-exceeds-cost-of-roof-repairs/" target="_blank" rel="noopener noreferrer">already exceeded $400 million</a> — more than the cost of simply repairing the roof. The numbers had inverted: the move was more expensive than the repairs it replaced.</p>
<p>Then came the contract. In late 2025, Ford's government <a href="https://globalnews.ca/news/11708012/ontario-science-centre-new-renders/" target="_blank" rel="noopener noreferrer">awarded a $1.04 billion contract</a> to build the new Ontario Place-based Science Centre — more than three times the original $322 million projection, and double the "over $500 million" figure cited in the Auditor General's own December 2024 report. The new building will be <strong>45% the size of the original</strong>. Ontarians are paying three times as much for less than half the institution. The Auditor General had already found the decision-making process "not fair, transparent or accountable" — the same language used to describe the Therme lease that surrounds the new site.</p>
<p>The original building — designed by Raymond Moriyama and recognized as an architectural landmark — now sits empty and deteriorating at Don Mills, with demolition planned. Community groups, architects, heritage advocates, and former Science Centre staff have organized against the demolition. A year after the closure, <a href="https://www.link2build.ca/news/articles/2025/june/the-biggest-betrayal-a-year-on-staff-grieve-ontario-science-centre-s-snap-closure/" target="_blank" rel="noopener noreferrer">staff described the closure as "the biggest betrayal"</a> — abrupt, unexplained, and irreversible by the time anyone could mount a challenge.</p>`

  const rippling_effects = `<p>While the new Science Centre is under construction — with a target opening date of 2028–2029 — Ontario's public science institution now operates as a <strong>pop-up in a former Nordstrom store at Sherway Gardens mall</strong> and a temporary display at Harbourfront Centre. This is the province's interim provision for what was one of Canada's premier science education institutions. Schools that previously relied on the Science Centre for curriculum programming have lost access to the permanent facility indefinitely.</p>
<p>The broader context is the Ontario Place redevelopment: the new Science Centre will occupy a fraction of the Ontario Place site, while the majority of the publicly owned waterfront is leased to Therme for a private spa — on a 95-year lease, for $1 per year, with $2.24 billion in taxpayer-funded infrastructure. The Science Centre was used to provide public-interest cover for the Ontario Place deal: a public institution embedded in a private redevelopment project, allowing the government to claim the waterfront remains publicly accessible while the dominant land use is a private luxury facility.</p>
<p>The demolition of the Moriyama-designed original building, if it proceeds, will be permanent. The architectural and cultural loss cannot be recovered. Heritage Ontario and architectural organizations have documented the building's significance; Moriyama himself designed it as a building that was meant to feel like science itself — layered, surprising, and organic. The replacement, by contrast, will be a fraction of the size, embedded in a commercial development, and built at a cost that has already exceeded any plausible economic justification.</p>`

  console.log('Inserting Ontario Science Centre scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Ontario Science Centre — Manufactured Closure & Ontario Place Relocation'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2024-06-21'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Auditor General — Relocation Costs Exceed Projected Savings; $1B+ Contract (December 2024)',
      status: 'Completed',
      description: `<p>In the Auditor General's December 2024 report on Ontario Place, she found the Science Centre relocation had already cost more than the government's projected savings from the move — $400M+ spent versus $257M in anticipated 50-year savings. The report found the decision-making process was "not fair, transparent or accountable." Shortly after the AG report, the government awarded a $1.04 billion construction contract for the new Ontario Place-based Science Centre — more than three times the original $322M projection, and double the "over $500M" figure the AG herself had cited just weeks earlier. The new building will be 45% the size of the original.</p>`,
      url: 'https://www.canadianarchitect.com/cost-of-ontario-science-centre-temporary-location-exceeds-cost-of-roof-repairs/',
    },
    {
      title: 'Engineering Reports Show Closure Was Not Recommended — FOI Documents Reveal',
      status: 'Completed',
      description: `<p>Documents obtained through Freedom of Information requests and published by Canadian Architect revealed that draft engineering reports from Rimkus Consulting — the firm hired to assess the Science Centre roof — did not recommend closure. The "high-risk" RAAC panels covered less than 2.5% of the roof, concentrated in non-exhibition areas, and early draft reports recommended routine targeted repairs over the summer. The final report, released only after the closure announcement, was more alarming in tone. Texts between Infrastructure Ontario's CEO and communications staff indicated the Ministry's communications team was involved in how the engineers' findings were framed for public release — raising questions about whether political staff shaped the public safety rationale for a decision made for other reasons.</p>`,
      url: 'https://www.canadianarchitect.com/draft-engineering-reports-didnt-suggest-closure-of-ontario-science-centre-new-documents-reveal/',
    },
    {
      title: 'Roof Survives Major Snowstorm — Ford Still Refuses to Reopen (2025)',
      status: 'Completed',
      description: `<p>In early 2025, the Ontario Science Centre's roof — the stated reason for its permanent closure — withstood record snow loads from a major snowstorm without structural incident. Infrastructure Ontario confirmed it could not say whether the roof had been damaged. Liberal MPPs called on the government to reopen the building given the roof's demonstrated performance. Ford refused, stating the closure decision stood regardless of the roof's actual behaviour under stress. Critics noted that the government's refusal to revisit the decision, even after the stated safety risk failed to materialize, was evidence that the closure had never truly been about the roof.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-roof-passes-test-call-to-reopen-liberal-mpp-9.7065687',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${laId}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, ${now}, ${now})
    `
    console.log(`  ✅ Legal action: ${la.title.substring(0, 65)}...`)
  }

  const sources = [
    { title: 'Canadian Architect — Ontario Science Centre doesn\'t require full closure: engineers\' report', url: 'https://www.canadianarchitect.com/ontario-science-centre-doesnt-require-full-closure-a-close-reading-of-the-engineers-report/' },
    { title: 'Canadian Architect — Draft engineering reports didn\'t suggest closure, new documents reveal', url: 'https://www.canadianarchitect.com/draft-engineering-reports-didnt-suggest-closure-of-ontario-science-centre-new-documents-reveal/' },
    { title: 'Canadian Architect — Cost of temporary location exceeds cost of roof repairs', url: 'https://www.canadianarchitect.com/cost-of-ontario-science-centre-temporary-location-exceeds-cost-of-roof-repairs/' },
    { title: 'Canadian Architect — $1.04B contract awarded for new Ontario Science Centre', url: 'https://www.canadianarchitect.com/contract-awarded-for-new-ontario-science-centre/' },
    { title: 'CBC — Hundreds of buildings use Science Centre roofing panels; none have been closed', url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-closure-roof-concrete-panels-raac-1.7245973' },
    { title: 'CBC — Science Centre roof passes snowstorm test; Ford still refuses to reopen', url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-roof-passes-test-call-to-reopen-liberal-mpp-9.7065687' },
    { title: 'CBC — Ontario Science Centre to close immediately as province cites roof concerns', url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-closing-roof-1.7242810' },
    { title: 'CBC — How much of the Ontario Science Centre roof is actually at risk?', url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-closure-explained-1.7247957' },
    { title: 'CBC — New Science Centre will be built at Ontario Place as early as 2029', url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-update-9.7106984' },
    { title: 'CBC — Ontario to open temporary science centre at Harbourfront Centre', url: 'https://www.cbc.ca/news/canada/toronto/interim-science-centre-harbourfront-9.7010321' },
    { title: 'Global News — Ford government awards $1B contract for new Ontario Science Centre', url: 'https://globalnews.ca/news/11708012/ontario-science-centre-new-renders/' },
    { title: 'Global News — Infrastructure Ontario can\'t say if Science Centre roof was damaged in snowstorm', url: 'https://globalnews.ca/news/11639922/science-centre-roof-snow-storm/' },
    { title: 'Global News — Schools with same roof panels have no budget to replace them', url: 'https://globalnews.ca/news/10793850/ontario-school-raac-replacement-budget/' },
    { title: 'Link2Build — A year on, staff grieve Ontario Science Centre\'s snap closure', url: 'https://www.link2build.ca/news/articles/2025/june/the-biggest-betrayal-a-year-on-staff-grieve-ontario-science-centre-s-snap-closure/' },
    { title: 'The Architect\'s Newspaper — Public outrage continues over Ontario Science Centre demolition plans', url: 'https://www.archpaper.com/2024/12/public-outrage-continues-ontario-science-centre-demolition-plans/' },
    { title: 'Wikipedia — Ontario Science Centre', url: 'https://en.wikipedia.org/wiki/Ontario_Science_Centre' },
    { title: 'Infrastructure Ontario — RAAC Roof Panel Assessment Final Report (June 2024)', url: 'https://www.infrastructureontario.ca/49ee2b/contentassets/84df22e71b7c40b2aaeef94da88c78b5/osc-building-a-to-c-raac-roof-panel-assessment-final-june-18-2024-r2.pdf' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 Ontario Science Centre scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
