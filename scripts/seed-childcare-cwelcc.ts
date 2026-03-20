/**
 * Seed script: Ontario's $10/Day Child Care Failure — CWELCC targets missed,
 * profits prioritized, families left behind.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-childcare-cwelcc.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'childcare-cwelcc-failure'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford stood beside Justin Trudeau in March 2022 to sign a $13.2 billion deal promising $10/day child care for Ontario families by March 2026 and 86,000 new spaces by December 2026. Within months his government stripped the deal's profit-oversight rules — over federal objections. He delayed a stable funding formula for two years, pushing operators to the brink. The $10/day deadline has now passed: Ontario's average sits at $19/day — nearly double the target. Only 36,287 of the promised 48,000 interim spaces were created. Eight provinces already hit $10/day. Enrolment among lower-income subsidised families dropped 31%. The Auditor General identified a $2B funding gap and said Ontario is not on track on any of its core commitments.`

  const summary = `<p>On March 28, 2022, Premier Doug Ford appeared with Prime Minister Justin Trudeau at a YMCA in Brampton to announce a $13.2 billion Canada-Ontario child care agreement — the Canada-Wide Early Learning and Child Care (CWELCC) deal. Ford signed Ontario onto three core commitments: average fees reduced to $10/day by March 31, 2026; 76,700 net new licensed child care spaces created by March 2026, and 86,000 by December 2026; and minimum wage floors for child care workers. Eight provinces and territories have already achieved $10/day or less. Ontario has not. The original deadline has passed with Ontario's average fee sitting at $19/day and no confirmed plan to reduce it further.</p>
<p>Within months of signing, the Ford government began systematically weakening the agreement. In August 2022, Ontario unilaterally removed the CWELCC funding guidelines' entire section on undue profits and audit requirements for operators — over the explicit objection of federal Minister Karina Gould, who demanded answers and warned the move "may run counter to the objective of ensuring the sound and reasonable use of public funds." A portion of Ontario's annual federal allocation — $15.9 million — was contingent on maintaining cost controls Ontario had just gutted. Then came the funding formula: rather than giving operators a clear, stable cost-based funding model, Ontario left them in two years of financial limbo. The new formula was announced in August 2024 and didn't take effect until January 2025 — thirty months after the agreement was signed. During that period, operators burned through reserves subsidising gaps between what the province paid and what it actually cost to run a licensed centre. At the YMCA — the same location where Ford and Trudeau made the announcement — an infant space was running at a loss of $10,000 to $13,000 per year.</p>
<p>Operators began pulling out. Toronto's Ola Daycare left the CWELCC system in 2024; parent fees immediately doubled to approximately $1,400 per month. In October 2024, daycares across Toronto, Peel, York, Halton, Barrie, Muskoka, and Durham staged rolling closures in protest of the new funding formula, which they said still failed to cover real operating costs. Federal Families Minister Jenna Sudds publicly attributed the departures to Ontario's delay: "a consequence, unfortunately, of a delay with respect to the province of Ontario coming forward with a sustainable and long-term funding formula." Ontario's Education Minister conceded in September 2024 that the $10/day target would not be met — and blamed the federal government for not providing more money.</p>
<p>In July 2024, Ontario and the Association of Municipalities of Ontario jointly wrote to Ottawa asking for the cap on for-profit child care to be removed entirely — the Canada-Ontario agreement requires at least 70% of spaces to be in non-profit or public centres. When Ontario did finally implement its new funding formula in January 2025, it formalised an 8% profit margin for for-profit operators built into the public rate — normalising profit extraction from child care dollars. In March 2025, the Ministry quietly reduced space creation targets for underperforming regions, shifting the goalposts rather than meeting them.</p>`

  const why_it_matters = `<p>The Ontario Auditor General released a special report on the CWELCC program in October 2025. Its findings were unequivocal: Ontario is not on track to meet its targets for fees, spaces, or qualified staff. As of December 2024, the province had created only 36,287 net new spaces — 75% of its interim target of 48,000, more than 25,000 short of its March 2026 commitment. Fees averaged $19/day, nearly double the $10 target. The Ministry needed an additional $1.95 billion in 2026-27 just to reach $10/day — with no plan identified to fund it. The AG found that 80,500 licensed spaces — 27% of all licensed capacity — were vacant or non-operational in December 2023, primarily due to staff shortages that Ontario had also failed to address. The province needs an estimated 10,000 more registered early childhood educators by 2026.</p>
<p>Perhaps the most damning finding: enrolment among families receiving the child care fee subsidy — typically lower-income families, the program's stated priority — dropped 31% compared to 2019. The program was explicitly designed to improve access for vulnerable children. Under Ontario's implementation, the opposite happened. Subsidised spots exist on paper but not in practice: a family eligible for a subsidy still faces a separate wait for subsidy availability, and Ontario's failure to create spaces means the wait has lengthened rather than shortened.</p>
<p>The contrast with other provinces is stark. Saskatchewan reached $10/day in 2022. Manitoba in 2023. Prince Edward Island in December 2023 — two years ahead of the national target. Newfoundland and Labrador in 2022. Quebec's long-standing $9.35/day system predates the federal deal. Ontario is the largest province and the home of more than one-third of Canada's children. Its failure to meet commitments that smaller provinces fulfilled years early is a policy failure, not a logistical inevitability. In April 2025, Ontario's Education Minister sent parents a letter warning that fees "could rise" when the current deal expired — putting pressure on Ottawa rather than accounting for his government's own record. Advocates called it "alarming" and "misleading." The March 2026 deadline has now passed. Ontario is not at $10/day. Fees are frozen at $19/day under a one-year extension that contains no commitment to further reductions.</p>`

  const rippling_effects = `<p>The families most harmed by Ontario's child care failures are those with the least capacity to absorb the consequences. Record waitlists — 31% of Ontario families with children aged 0-5 were on a child care waitlist in 2025, the highest ever recorded. Ottawa saw waitlists balloon more than 300% since 2019. Stratford, a city of 33,000 people, had more than 1,000 children on its list. Families who cannot access subsidised care often cannot afford market-rate care either: the average cost of unsubsidised infant care in Toronto regularly exceeds $2,000 per month. Women disproportionately bear the cost when child care is inaccessible — through reduced employment, reduced hours, and career interruption.</p>
<p>The province's push to expand for-profit operators at public expense has long-run implications for cost and quality. Research consistently shows non-profit and public child care delivers better outcomes and lower staff turnover than for-profit centres. Ontario's formalisation of an 8% profit margin in its cost-based funding formula — embedded in public dollars — redirects money away from wages, programming, and staffing ratios. The Canada-Ontario agreement's 70% non-profit/public requirement was specifically designed to prevent this dynamic. Ontario tried to remove it.</p>
<p>The one-year extension signed in December 2025, which freezes fees at $19/day and provides no new space creation funding, leaves the program's future unresolved. With no confirmed federal agreement on CWELCC beyond March 2027 and no provincial commitment to the $10/day target, families face continued uncertainty. The original promise — made publicly, with cameras, by Ford and Trudeau — has expired unfulfilled. Ontario's children are waiting.</p>`

  console.log('Inserting Child Care CWELCC scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Ontario\'s $10/Day Child Care Failure — Targets Missed, Profits Prioritised, Families Left Behind'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2025-10-01'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Auditor General Special Report: Ontario "Not on Track" on Fees, Spaces, and Staffing (October 2025)',
      status: 'Completed',
      description: `<p>Ontario Auditor General Shelley Spence released a special report on the CWELCC program in October 2025. Key findings: as of December 2024, the province had created only 36,287 net new spaces — 75% of the interim 48,000-space target, and 25,000+ short of its March 2026 commitment. Average fees stood at $19/day — nearly double the $10 target. The province needed an additional $1.95 billion in 2026-27 to achieve $10/day and had no identified plan to fund it. The AG found that 80,500 licensed spaces (27% of all licensed capacity) were vacant or non-operational in December 2023, primarily due to staff shortages; the province needed an estimated 10,000 more registered ECEs by 2026. Enrolment among families receiving child care fee subsidies (lower-income families, the program's stated priority) declined 31% compared to 2019. The Ministry had quietly reduced regional space targets in March 2025, shifting goalposts for underperforming regions. The AG made 11 recommendations, all accepted by the government.</p>`,
      url: 'https://www.auditor.on.ca/en/content/specialreports/specialaudits/en2025/AR-PA_CELandCCP_en25.html',
    },
    {
      title: 'Federal Government Objects to Ontario Stripping Profit Oversight Rules (September 2022)',
      status: 'Completed',
      description: `<p>In August 2022, just months after signing the CWELCC agreement, Ontario unilaterally removed from its funding guidelines the entire section on undue profits and the requirement for financial audits of child care operators. The change was made under pressure from for-profit daycare lobby groups. Federal Minister Karina Gould formally objected in a letter to Education Minister Lecce, writing: "It is unfortunate that Ontario did not seek the views of the federal government on the changes prior to their release." Gould warned the removal "may run counter to the objective of ensuring the sound and reasonable use of public funds" and asked how Ontario intended to uphold its commitment to limit undue profits. A portion of Ontario's annual federal allocation — $15.9 million — was contingent on maintaining the cost-control framework Ontario had just gutted. Ontario was not penalised; the federal government did not claw back the contingent funding.</p>`,
      url: 'https://childcarecanada.org/documents/child-care-news/22/09/ontario-weakened-its-10-day-child-care-funding-rules-now-federal',
    },
    {
      title: 'Operators Stage Rolling Closures; Federal Government Blames Ontario for Funding Formula Delay (2024)',
      status: 'Completed',
      description: `<p>In October 2024, child care operators across Toronto, Peel, York, Halton, Barrie, Muskoka, and Durham staged rolling closures to protest Ontario's new cost-based funding formula, which they said failed to cover real operating costs. Toronto's Ola Daycare had already pulled out of the CWELCC system entirely; parent fees immediately doubled to approximately $1,400/month. Federal Families Minister Jenna Sudds publicly attributed the departures to Ontario's failure to provide a "sustainable and long-term funding formula for providers," calling it "a consequence, unfortunately, of a delay with respect to the province of Ontario." Education Minister Paul Calandra conceded in September 2024 that Ontario would not achieve $10/day by March 2026 — and blamed the federal government for insufficient funding. The new formula, announced in August 2024, did not take effect until January 2025 — thirty months after the agreement was signed.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-daycares-rolling-closures-1.7346364',
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
    { title: 'PM.gc.ca — $10-a-day child care for families in Ontario announced (March 28, 2022)', url: 'https://www.pm.gc.ca/en/news/news-releases/2022/03/28/10-day-child-care-families-ontario' },
    { title: 'CBC — Ontario reaches $10.2B child-care deal with federal government', url: 'https://www.cbc.ca/news/canada/toronto/ontario-child-care-deal-ford-trudeau-1.6399694' },
    { title: 'Ontario Auditor General — Special Report: CWELCC Program (2025)', url: 'https://www.auditor.on.ca/en/content/specialreports/specialaudits/en2025/AR-PA_CELandCCP_en25.html' },
    { title: 'CBC — Ontario not on track on child-care fee, space creation goals (Auditor General)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-four-special-reports-1.7647885' },
    { title: 'Child Care Canada — Ontario weakened its $10/day child care funding rules; federal government demands answers', url: 'https://childcarecanada.org/documents/child-care-news/22/09/ontario-weakened-its-10-day-child-care-funding-rules-now-federal' },
    { title: 'CBC — Feds blame Ontario as some daycare centres pull out of national child care program', url: 'https://www.cbc.ca/news/politics/daycare-fees-ontario-1.7202778' },
    { title: 'CBC — Daycare operators warn of rolling closures unless Ontario holds off on new funding formula', url: 'https://www.cbc.ca/news/canada/toronto/ontario-daycares-rolling-closures-1.7346364' },
    { title: 'CBC — Some Toronto, GTA daycares close in protest of Ontario\'s new funding rules', url: 'https://www.cbc.ca/news/canada/toronto/toronto-gta-daycares-provincial-protests-1.7359770' },
    { title: 'CBC — Ontario child-care fees could rise without new federal funding — minister warns', url: 'https://www.cbc.ca/news/canada/toronto/ont-child-care-1.7516736' },
    { title: 'CBC — Why an Ontario child-care centre faces closure after joining national $10/day program', url: 'https://www.cbc.ca/news/canada/toronto/ontario-child-care-daycare-10-federal-provincial-funding-1.7211652' },
    { title: 'CBC — Ontario cutting funding from daycare centres not in $10-a-day program', url: 'https://www.cbc.ca/news/canada/toronto/daycare-child-care-ontario-cutting-funding-1.7315212' },
    { title: 'Global News — Ontario unlikely to hit $10-a-day child care target, minister concedes (Sept 2024)', url: 'https://globalnews.ca/news/11459130/ontario-child-care-ag-report/' },
    { title: 'Global News — Half of provinces won\'t hit 2026 $10-a-day child care target', url: 'https://globalnews.ca/news/11281067/canada-child-care-policy-deadline/' },
    { title: 'Globe and Mail — Ontario needs almost $2B to make $10-a-day child care a reality', url: 'https://www.theglobeandmail.com/canada/article-ontario-10-a-day-child-care-2026-auditor-report/' },
    { title: 'The Trillium — Ontario \'at risk\' of missing $10-a-day targets, Auditor General warns', url: 'https://www.thetrillium.ca/news/education-and-training/ontario-at-risk-of-missing-10-a-day-child-care-program-targets-auditor-general-11288458' },
    { title: 'CP24 — Ontario falling short on reaching $10-a-day child-care goals', url: 'https://www.cp24.com/local/toronto/2025/10/01/ontario-falling-short-on-reaching-10-a-day-child-care-goals-auditor-general/' },
    { title: 'CCPA — The price is not right (yet): $10-a-day child care falling short of target', url: 'https://www.policyalternatives.ca/news-research/the-price-is-not-right-yet-10-a-day-child-care-falling-short-of-target/' },
    { title: 'Child Care Canada — Doug Ford\'s dangerous child-care plan (for-profit expansion, July 2024)', url: 'https://childcarecanada.org/documents/child-care-news/24/07/doug-ford%E2%80%99s-dangerous-child-care-plan' },
    { title: 'OCBCC — The Ford Government is Trying to Expand For-Profit Child Care', url: 'https://www.childcareontario.org/for_profit_child_care_risky_and_unnecessary' },
    { title: 'Canada.ca — Canada and Ontario sign one-year CWELCC extension (December 2025)', url: 'https://www.canada.ca/en/employment-social-development/news/2025/12/canada-and-ontario-agree-to-one-year-extension-of-the-canada-wide-early-learning-and-child-care-agreement.html' },
    { title: 'Child Care Now — Stalled fee reductions raise concern about future of $10/day program (Nov 2025)', url: 'https://childcarenow.ca/2025/11/11/media-release-stalled-fee-reductions-in-ontario-child-care-agreement-extension-raise-concern-about-the-future-of-10aday-program-across-canada/' },
    { title: 'Oakville News — Education minister sends families \'alarming\' letter warning of fee increases', url: 'https://www.oakvillenews.org/ontario-news/education-minister-sends-families-alarming-letter-warning-of-possible-child-care-fee-increases-next-year-10563273' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 70)}...`)
  }

  // Timeline events
  const timelineEvents = [
    {
      date: '2022-03-28',
      label: 'Ford and Trudeau sign $13.2B child care deal: $10/day by 2026, 86,000 new spaces',
      icon: 'Flag',
    },
    {
      date: '2022-08-01',
      label: 'Ontario strips profit oversight rules from child care agreement — over federal objections',
      icon: 'AlertTriangle',
    },
    {
      date: '2024-10-01',
      label: 'Daycares across Toronto and GTA stage rolling closures over inadequate Ford funding formula',
      icon: 'AlertTriangle',
    },
    {
      date: '2025-10-01',
      label: 'Auditor General: Ontario not on track for $10/day child care; 31% drop in subsidised enrolment',
      icon: 'FileText',
    },
    {
      date: '2026-03-31',
      label: '$10/day child care deadline passes — Ontario still at $19/day with no plan to reduce further',
      icon: 'Gavel',
    },
  ]

  const url = `/scandals/${slug}`
  for (const evt of timelineEvents) {
    const existing = await sql`
      SELECT id FROM "TimelineEvent"
      WHERE date = ${evt.date}::date AND label = ${evt.label}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Timeline skip: ${evt.date}`)
      continue
    }
    const evtId = cuid()
    const evtNow = new Date().toISOString()
    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (
        ${evtId}, ${evt.date}::date, ${evt.label}, ${url},
        ${evt.icon}, ${'milestone'}, ${true}, ${evtNow}, ${evtNow}
      )
    `
    console.log(`  ✅ Timeline: ${evt.date} — ${evt.label.substring(0, 60)}...`)
  }

  console.log('\n🎉 Child Care CWELCC scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
