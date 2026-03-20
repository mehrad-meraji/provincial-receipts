/**
 * Seed script: Ford Government Closes Supervised Consumption Sites
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-consumption-site-closures.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'consumption-site-closures'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `In August 2024, Ford's government ordered the closure of supervised consumption sites within 200 metres of schools or daycares — a rule that targeted 10 sites for elimination. The government conducted no studies before closing them. Its own internal risk assessment warned deaths would result. Its own commissioned reviews of the triggering site recommended against closure. Ontario's Auditor General found the sites had prevented nearly 1,600 fatal overdoses in a single year. After the April 2025 closures: overdoses at Toronto drop-in centres rose 75% in the first month, 175% in May, and 288% by June. Paramedic opioid overdose calls in Toronto were up 47% by January 2026. Hamilton recorded its worst overdose numbers in history. Health Minister Sylvia Jones, asked if she had estimated how many people would die: "People are not going to die."`

  const summary = `<p>Between 2017 and 2024, Ontario operated a network of supervised consumption sites — called Consumption and Treatment Services (CTS) sites — where people could use pre-obtained drugs under medical supervision, with naloxone on hand to reverse overdoses and pathways to treatment on offer. Over 22,000 overdoses occurred at these sites during the period. Zero were fatal. Ontario's Auditor General found the sites prevented nearly 1,600 fatal overdoses in a single year alone.</p>
<p>On August 20, 2024, Health Minister Sylvia Jones announced the Ford government would ban consumption sites from operating within 200 metres of a school or daycare. The rule targeted ten sites for closure by March 31, 2025. The government simultaneously announced it would not approve any new federal exemptions for new or relocated sites — making relocation legally impossible — and passed Bill 223 to codify the ban. The legislation bypassed standard committee study. Jones refused all applications to relocate. Nine of the ten sites converted to HART hubs (abstinence-focused drop-in centres) and closed their supervised consumption operations. The tenth — Kensington Market, which received no provincial funding — obtained a court injunction and remained open.</p>
<p>The triggering justification for the policy was the death of Karolina Huebner-Makurat, a 44-year-old mother of two shot by a stray bullet near the South Riverdale Community Health Centre site in July 2023. She was not a drug user — she was a bystander killed in a fight between men allegedly involved in illegal drug dealing near the site. The Ford government commissioned two separate reviews of the South Riverdale site in response. Neither recommended closure. Ford ordered the closures anyway. His summary: "If it had been up to me, I would have closed all of them."</p>
<p>In March 2026, the government moved to defund the seven remaining provincially-funded sites — giving them 90 days' notice that funding would end June 13, 2026.</p>`

  const why_it_matters = `<p><strong>The Government Knew.</strong> Before the closures, Ontario's own internal government document — obtained through reporting — warned: "There is a high risk that reducing access to harm reduction and overdose support services will result in increased emergency department visits, health impacts, overdose and death." This was not an outside critic. This was the government's internal risk assessment. Health Minister Jones, when asked publicly how many people would die from the closures, said: "People are not going to die. They are going to get access to service." At the same press conference, she stated: "I do not call watching someone inject an illicit drug to be health care in the province of Ontario." The government's internal documents said the opposite of what its minister told the public.</p>
<p><strong>The Auditor General's Findings.</strong> Ontario's Auditor General, in her December 2024 annual report, confirmed what public health officials had been saying for years: the ten targeted CTS sites <strong>prevented nearly 1,600 fatal opioid overdoses in a single year</strong>. Not a single one of the 22,000-plus overdoses treated at Ontario's consumption sites since 2017 had resulted in death. The Auditor General also found that the Ford government closed the ten sites <strong>without conducting any studies or reviews to support that decision.</strong> The government that spent years demanding evidence before acting on climate, housing, or transit had, in this case, ordered closures of proven life-saving facilities without a single piece of supporting analysis.</p>
<p><strong>The Reviews It Ignored.</strong> The South Riverdale Community Health Centre site — the one Ford's government cited as the trigger for the entire closure policy — was reviewed twice by government-commissioned investigators after Karolina Huebner-Makurat's death. Neither review recommended closure. Ford closed it anyway, along with nine others. The premise of the policy — that the South Riverdale site was operating dangerously and needed to be shut down — was contradicted by the government's own commissioned evidence before the policy was announced.</p>
<p><strong>What the Court Found.</strong> In March 2025, Ontario Superior Court Justice John Callaghan granted a temporary injunction against the closures, writing: "Like British Columbia and Alberta, the current opioid crisis in Ontario is exceptional. The closing of SCSs will cause significant harm across the province, including the loss of life." The court found irreparable harm — specifically that "many more will overdose, and some of those will die." Health Minister Jones declared that nine of the ten sites would close anyway: they had already signed HART hub conversion agreements with the province, making the injunction moot. The one site the injunction could protect — the privately-funded Kensington Market site — stayed open. The full Charter challenge remained before the courts as of early 2026.</p>`

  const rippling_effects = `<p>The data following the April 2025 closures is unambiguous. The Toronto Drop-In Network, representing ten community drop-in centres that were not equipped or designed to manage overdoses, documented the immediate effect: overdoses at member locations were up <strong>75% in April 2025</strong> compared to April 2024, the month the consumption sites were still open. By May 2025, the increase was <strong>175%</strong>. By June 2025, it was <strong>288%</strong> — nearly four times the pre-closure rate. Toronto Paramedic Services data showed non-fatal suspected opioid overdose calls rising steadily from October 2025 (277) through November (281), December (320), and January 2026 (350) — a <strong>47% increase</strong> over January 2025. Overdoses were reported spiking in churchyards and other outdoor spaces near former consumption site locations.</p>
<p>In Hamilton, the effect was equally stark. Hamilton's sole CTS site closed in March 2025. By July 2025, paramedics responded to <strong>134 suspected opioid overdoses</strong> — the highest monthly total since data recording began in 2017. In February 2026, Hamilton set another all-time record. Hamilton's medical officer of health, Dr. Elizabeth Richardson, confirmed publicly that opioid overdose paramedic responses had "increased significantly" since April 2025.</p>
<p>The replacement model — HART hubs — is categorically different from what was closed. HART hubs are abstinence-focused; they do not permit on-site drug consumption. They serve people who are ready to pursue treatment. Supervised consumption sites, by design, serve people who are not yet there — keeping them alive until they are. A HART hub cannot reverse an overdose that happens after someone leaves the building to use alone in an alley. This is not a policy nuance; it is the mechanism by which the closures cause deaths. Ford replaced a facility that kept people alive during active drug use with a facility that requires people to already have stopped. The people most at risk of fatal overdose — those who are not ready for abstinence — have nowhere to go.</p>
<p>As of March 2026, the Ford government announced a second wave: seven remaining provincially-funded sites to lose funding as of June 13, 2026. These sites collectively served thousands of people across Toronto, Ottawa, Niagara, Peterborough, and London. The full Charter challenge — which could strike down Bill 223 entirely — remains pending before Ontario's courts. In the meantime, the overdose data accumulates.</p>`

  console.log('Inserting Consumption Site Closures scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Ford Closes Supervised Consumption Sites — 288% Overdose Spike Follows'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2024-08-20'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Bill 223 — Safer Streets, Stronger Communities Act: Banning Consumption Sites (December 2024)',
      status: 'Active — Law in Force; Charter Challenge Pending',
      description: `<p>In December 2024, the Ford government passed Bill 223 — the Safer Streets, Stronger Communities Act — formalizing the ban on supervised consumption sites within 200 metres of a school or daycare, barring municipalities from independently applying for federal exemptions under the Controlled Drugs and Substances Act without provincial health minister approval (which Jones said she would never grant), and prohibiting new sites from opening. The bill bypassed standard committee study. Critics including the Ontario Nurses' Association, RNAO, OPSEU, and HIV Legal Network described the legislation as unconstitutional. A full Charter challenge was filed by The Neighbourhood Group, two people who use the Kensington Market site, and the HIV Legal Network, alleging violations of Section 7 of the Charter (right to life, liberty and security). The challenge was still before the courts as of early 2026.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-supervised-drug-consumption-sites-legal-challenge-1.7406760',
    },
    {
      title: 'Charter Challenge — Court Grants Injunction Finding Closures Will Cause Deaths (March 2025)',
      status: 'Injunction Granted; Full Challenge Pending',
      description: `<p>On March 28, 2025, Ontario Superior Court Justice John Callaghan granted a temporary injunction suspending the 200-metre location restriction until 30 days after the full Charter decision. Justice Callaghan wrote: "Like British Columbia and Alberta, the current opioid crisis in Ontario is exceptional. The closing of SCSs will cause significant harm across the province, including the loss of life." He found that closure posed irreparable harm — specifically that "many more will overdose, and some of those will die." Despite the injunction, Health Minister Sylvia Jones declared nine of the ten targeted sites would close anyway: their operators had already signed HART hub conversion agreements with the province, making the injunction moot for them. Only the Kensington Market Overdose Prevention Site — which never received provincial funding and therefore never signed a HART agreement — remained open under the court order.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/charter-challenge-hearing-ontario-drug-consumption-site-law-1.7491438',
    },
    {
      title: 'Ontario Auditor General — Government Closed Life-Saving Sites Without Any Supporting Studies (December 2024)',
      status: 'Finding Issued',
      description: `<p>Ontario's Auditor General, in her December 2024 annual report, found that the Ford government's ten targeted supervised consumption sites <strong>prevented nearly 1,600 fatal opioid overdoses in a single year</strong>, and that over 22,000 overdoses had been treated at Ontario's CTS sites since 2017 with zero resulting in death. Critically, the Auditor General found the Ford government closed the ten sites <strong>without conducting any studies or reviews to support the closure decision.</strong> The same report documented that the government's own earlier 2018 internal assessment — conducted under Ford — had found supervised consumption services "improve the health of those who use drugs, are cost-effective and reduce the strain on the health care system." The government funded and approved more than half the sites it later ordered closed, then shut them without any evidentiary basis.</p>`,
      url: 'https://www.auditor.on.ca/en/content/annualreports/arreports/en24/pa_ONopioid_en24.pdf',
    },
    {
      title: 'Second Wave — Province Defunds Seven Remaining Sites (March 2026)',
      status: 'Active — Closures Pending June 2026',
      description: `<p>In March 2026, Ontario informed seven remaining provincially-funded supervised consumption sites that their provincial funding would end on June 13, 2026 — 90 days' notice. The affected sites serve communities in Toronto (Fred Victor Centre and South Riverdale), Ottawa (two sites), Niagara, Peterborough, and London. The announcement came as paramedic overdose data from the first wave of closures showed a 47% increase in non-fatal opioid overdose calls in Toronto and record-high overdose rates in Hamilton. The province did not release any impact assessment, study, or evidence review to justify the second wave of defunding.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-ending-supervised-drug-consumption-funding-9.7130534',
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
    { title: 'CBC News — Ontario announces supervised consumption site restrictions (August 2024)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-consumption-site-ford-1.7386562' },
    { title: 'Global News — Ontario bans supervised consumption sites near schools and daycares', url: 'https://globalnews.ca/news/10706674/ontario-ban-supervised-consumption-sites-schools/' },
    { title: 'Global News — Ontario internal warnings about supervised consumption site closures', url: 'https://globalnews.ca/news/10868065/ontario-supervised-consumption-site-internal-warnings/' },
    { title: 'Ontario Auditor General — 2024 Annual Report: Opioid Strategy (PDF)', url: 'https://www.auditor.on.ca/en/content/annualreports/arreports/en24/pa_ONopioid_en24.pdf' },
    { title: 'The Pointer — Auditor General: Ford closed consumption sites without any study (January 2025)', url: 'https://thepointer.com/article/2025-01-01/doug-ford-s-opioid-crisis-damning-auditor-general-audit-reveals-safe-consumption-sites-being-closed-without-any-study' },
    { title: 'CBC News — Reviews of South Riverdale CTS site did not recommend closure', url: 'https://www.cbc.ca/news/canada/toronto/supervised-drug-consumption-sites-toronto-1.7300721' },
    { title: 'CBC News — Toronto supervised injection sites affected by Ontario restrictions', url: 'https://www.cbc.ca/news/canada/toronto/toronto-supervised-injection-sites-ontario-restrictions-1.7299398' },
    { title: 'CBC News — Legal challenge to Ontario\'s supervised drug consumption site law', url: 'https://www.cbc.ca/news/canada/toronto/ontario-supervised-drug-consumption-sites-legal-challenge-1.7406760' },
    { title: 'CBC News — Charter challenge hearing for Ontario drug consumption site law (March 2025)', url: 'https://www.cbc.ca/news/canada/toronto/charter-challenge-hearing-ontario-drug-consumption-site-law-1.7491438' },
    { title: 'CBC News — Overdoses increasing at Toronto drop-in centres after closures (2025)', url: 'https://www.cbc.ca/news/canada/toronto/overdoses-increasing-toronto-drop-in-centres-network-says-1.7593944' },
    { title: 'CBC News — Drug overdoses increasing since safe consumption site closures in Ontario', url: 'https://www.cbc.ca/news/canada/toronto/overdoses-increasing-safe-consumption-site-closures-ontario-1.7603288' },
    { title: 'CP24 — Drug overdoses in Toronto up nearly 50% since last January (March 2026)', url: 'https://www.cp24.com/local/toronto/2026/03/03/drug-overdoses-in-toronto-up-nearly-50-per-cent-since-last-january-new-city-data-shows/' },
    { title: 'CBC News — Hamilton overdoses rise after safe drug consumption funding cuts', url: 'https://www.cbc.ca/news/canada/hamilton/overdoses-safe-drug-consumption-funding-cuts-9.7132358' },
    { title: 'CBC News — Ontario ending supervised drug consumption site funding (March 2026)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-ending-supervised-drug-consumption-funding-9.7130534' },
    { title: 'Global News — Ontario cuts funding to seven supervised drug consumption sites', url: 'https://globalnews.ca/news/11732999/ontario-cuts-funding-seven-supervised-drug-consumption-sites/' },
    { title: 'CBC News — Trial of Damian Hudson in Karolina Huebner-Makurat shooting', url: 'https://www.cbc.ca/news/canada/toronto/trial-damian-hudson-second-degree-murder-karolina-huebner-makurat-9.6959067' },
    { title: 'Ontario Nurses\' Association — Joint letter opposing Bill 223 closures', url: 'https://www.ona.org/news-posts/joint-letter-safe-consumption/' },
    { title: 'OPSEU — Ford government\'s "deadly closure" of safe consumption sites', url: 'https://opseu.org/news/ford-government-deadly-closure-of-safe-consumption-sites-spells-disaster-for-ontarios-overdose-epidemic-safe-supply-saves-lives-this-decision-will-result-in-countless-unne/241520/' },
    { title: 'Amnesty International Canada — Ontario must end deadly war on drugs as overdose crisis escalates', url: 'https://amnesty.ca/press-releases/ontario-must-end-deadly-war-on-drugs-as-overdose-crisis-escalates/' },
    { title: 'HIV Legal Network — Statement on constitutional challenge to supervised consumption site law', url: 'https://www.hivlegalnetwork.ca/site/media-statement-the-neighbourhood-group-community-services-and-hiv-legal-networks-comment-following-the-conclusion-of-the-ontario-superior-court-constitutional-challenge-on-supervised-consum/?lang=en' },
    { title: 'IDPC — Ontario consumption sites still facing closure despite court injunction', url: 'https://idpc.net/news/2025/04/canada-despite-ontario-superior-court-injunction-recognising-irreparable-harm-most-supervised' },
    { title: 'Canadian Affairs — Ontario HART Hubs one year in: wins and failures (March 2026)', url: 'https://www.canadianaffairs.news/2026/03/01/ontarios-hart-hubs-a-year-in-the-wins-and-failures/' },
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
      date: '2023-07-07',
      label: 'Karolina Huebner-Makurat shot and killed near South Riverdale CTS site — Ford uses it to justify closures',
      icon: 'AlertTriangle',
      url: 'https://www.cbc.ca/news/canada/toronto/trial-damian-hudson-second-degree-murder-karolina-huebner-makurat-9.6959067',
    },
    {
      date: '2024-08-20',
      label: 'Jones announces ban on consumption sites within 200m of schools — 10 sites targeted for closure',
      icon: 'Flag',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-consumption-site-ford-1.7386562',
    },
    {
      date: '2024-12-01',
      label: 'Bill 223 passes — municipalities barred from seeking federal exemptions for new or relocated sites',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-supervised-drug-consumption-sites-legal-challenge-1.7406760',
    },
    {
      date: '2024-12-15',
      label: 'Auditor General: closed sites prevented 1,600 fatal overdoses per year; government did no studies before closing',
      icon: 'FileText',
      url: 'https://www.auditor.on.ca/en/content/annualreports/arreports/en24/pa_ONopioid_en24.pdf',
    },
    {
      date: '2025-03-28',
      label: 'Court grants injunction — judge finds closures will cause deaths; Jones closes 9 of 10 sites anyway',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/charter-challenge-hearing-ontario-drug-consumption-site-law-1.7491438',
    },
    {
      date: '2025-04-01',
      label: '9 Toronto-area consumption sites close — first month: overdoses at drop-in centres up 75%',
      icon: 'AlertTriangle',
      url: 'https://www.cbc.ca/news/canada/toronto/overdoses-increasing-toronto-drop-in-centres-network-says-1.7593944',
    },
    {
      date: '2025-07-01',
      label: 'Hamilton records worst-ever monthly opioid overdoses since closures; Toronto overdoses up 288%',
      icon: 'AlertTriangle',
      url: 'https://www.cbc.ca/news/canada/hamilton/overdoses-safe-drug-consumption-funding-cuts-9.7132358',
    },
    {
      date: '2026-03-01',
      label: 'Ontario defunds 7 remaining consumption sites — 90 days notice; Toronto paramedic calls up 47% year-over-year',
      icon: 'Flag',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-ending-supervised-drug-consumption-funding-9.7130534',
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

  console.log('\n🎉 Consumption Site Closures scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
