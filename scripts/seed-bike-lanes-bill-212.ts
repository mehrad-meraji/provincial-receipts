/**
 * Seed script: Bill 212 — Bike Lane Removal & Liability Immunity
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-bike-lanes-bill-212.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'bill-212-bike-lanes'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford's Bill 212 ordered the removal of 19 kilometres of protected bike lanes in Toronto — overriding the city's elected council — then added a clause barring any cyclist who is injured or killed as a result from suing the province. The Ontario Superior Court found this violates the Charter right to life. The judge explicitly cited the immunity clause as the government's own acknowledgment that people would be seriously hurt. An injunction has halted removals while the Court of Appeal considers the case.`

  const summary = `<p>On November 25, 2024, Ford's government passed Bill 212, the <em>Reducing Gridlock, Saving You Time Act</em>. The bill targeted 19 kilometres of protected cycling infrastructure on three major Toronto streets — Bloor Street West, University Avenue, and Yonge Street — and ordered them removed. This was done by provincial legislation, bypassing Toronto City Council entirely. The council had approved and funded these lanes through its own democratic process; Ford used the legislature to override that decision.</p>
<p>As the legislation advanced, the NDP <a href="https://www.cbc.ca/news/canada/toronto/ontario-bike-lane-bill-amendments-1.7390145" target="_blank" rel="noopener noreferrer">highlighted a little-noticed amendment buried in the bill</a>: a "no cause of action" clause explicitly barring cyclists — or their families — from suing the Ontario government or its contractors if they are seriously injured or killed as a result of the bike lane removals. The provision was not announced publicly. It was discovered when the bill's amendments were reviewed in detail. Two lawyers and cycling advocates called it an attempt to immunize the government against the lethal consequences of its own policy — consequences the government clearly anticipated.</p>
<p>A <a href="https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/ford-government-moves-to-block-bike-lane-removal-lawsuits-9845266" target="_blank" rel="noopener noreferrer">Toronto city staff report had already documented</a> that the risk of cyclist injury on a major street with parked cars and no protected infrastructure is approximately nine times greater than on a protected bike lane. Ford's government removed the infrastructure, barred legal recourse, and proceeded.</p>`

  const why_it_matters = `<p>The immunity clause is not just a legal technicality — it is a confession. When a government passes legislation and then immediately adds a provision shielding itself from lawsuits arising from that legislation's consequences, it is acknowledging, in legal form, that those consequences include serious injury and death. The Ontario Superior Court said exactly this. In its July 2025 ruling, Justice Peter Osborne <a href="https://ecojustice.ca/news/major-victory-in-cycle-challenge-ontario-court-finds-government-violated-charter-rights/" target="_blank" rel="noopener noreferrer">explicitly cited the immunity clause as the government's own acknowledgment of the danger it was creating</a>, using it as evidence that the bill violated Section 7 of the Charter — the right to life, liberty, and security of the person.</p>
<p>The court found that removing safe cycling infrastructure from roads where thousands of people ride daily, and then blocking any legal remedy for those who are harmed, constitutes a state-imposed threat to life that requires justification under the Charter. The government could not provide that justification. The ruling was a landmark: it established that Canadians have a constitutional right to safe cycling infrastructure — or at minimum, that the state cannot deliberately remove it while simultaneously immunizing itself from the deaths that result.</p>
<p>The policy's stated rationale was reducing gridlock. <a href="https://thenarwhal.ca/ontario-highway-413-bill-passed/" target="_blank" rel="noopener noreferrer">Transportation experts and the city's own data</a> showed the bike lanes had a negligible impact on car travel times — and that removing them would not meaningfully reduce congestion. Toronto's own modelling found the lanes had minimal effect on traffic flow. The government did not commission or release any independent traffic analysis before introducing the bill. Its primary effect was not traffic relief but the removal of safe space for cyclists — and the signal to municipalities province-wide that the province could override any local transportation decision at will.</p>
<p>Bill 212 also contained a separate provision accelerating Highway 413 by exempting it from the Environmental Assessment Act, removing public access to environmental study findings, and allowing 24-hour construction. The bike lane removal and the highway fast-track were packaged together in a single bill — infrastructure decisions affecting millions of people, combined without any shared policy logic except that both benefit car traffic over everything else.</p>`

  const rippling_effects = `<p>An injunction obtained by Cycle Toronto and Ecojustice in April 2025 has prevented the Ford government from removing the lanes pending the final court decision. As a result, the bike lanes remain in place — not because the government reversed course, but because the courts intervened. The Court of Appeal heard the province's challenge to the injunction in January 2026, and a final ruling on the constitutionality of Bill 212 is still pending as of March 2026. If the government prevails, removals will begin immediately.</p>
<p>The ripple effects extend far beyond Toronto. Bill 212 also granted the province power to prevent any Ontario municipality from installing new bike lanes where a motor vehicle lane would need to be reduced — a sweeping restriction that effectively requires ministerial approval for cycling infrastructure across the entire province. Cities planning protected lanes in Mississauga, Ottawa, Hamilton, and London all face provincial veto power over decisions their own councils vote for. The political signal was unmistakeable: build cycling infrastructure that reduces car lanes at your own risk, and expect the province to override it.</p>
<p>The liability immunity provision, if it survives legal challenge, would set a broader precedent for how Ontario governments can insulate themselves from the consequences of dangerous policy. If a government can remove known safety infrastructure, pre-emptively bar lawsuits from those who are killed or injured as a result, and survive constitutional challenge, that template becomes available for future governments to apply to other dangerous rollbacks. The Ecojustice legal team framing the case as a Charter Section 7 issue is precisely designed to prevent that precedent from being established.</p>`

  console.log('Inserting Bill 212 / Bike Lane Removal scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Bill 212 — Bike Lane Removal & Liability Immunity'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2024-11-25'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Cycle Toronto & Ecojustice Legal Challenge — Bill 212 Unconstitutional',
      status: 'In Progress',
      description: `<p>In December 2024, Cycle Toronto, Ecojustice, and two individual cyclists launched a constitutional challenge to Bill 212, arguing it violated Section 7 of the Charter (right to life, liberty, and security of the person) by removing proven safety infrastructure while barring any legal remedy. Ecojustice represented the applicants. An interlocutory injunction was granted in April 2025, halting all bike lane removals pending the outcome. The full hearing was scheduled for July 2025. The province appealed to the Court of Appeal in January 2026. A final decision is pending.</p>`,
      url: 'https://ecojustice.ca/file/challenging-the-ontario-governments-anti-bike-lane-law/',
    },
    {
      title: 'Ontario Superior Court Finds Bill 212 Violates Charter Section 7 (July 2025)',
      status: 'Completed',
      description: `<p>In July 2025, Ontario Superior Court Justice Peter Osborne ruled that Bill 212 violates Section 7 of the Canadian Charter of Rights and Freedoms — the right to life, liberty, and security of the person. The court found that removing 19 kilometres of proven safety infrastructure while simultaneously immunizing the government from lawsuits constituted a state-imposed threat to the lives of cyclists. Crucially, the judge cited the government's own liability immunity clause as evidence that the province knew and accepted people would be seriously hurt — its own legislative acknowledgment of the danger it was creating. The Canadian Public Health Association was granted intervenor status, supporting the charter challenge.</p>`,
      url: 'https://ecojustice.ca/news/major-victory-in-cycle-challenge-ontario-court-finds-government-violated-charter-rights/',
    },
    {
      title: 'Ontario Court of Appeal — Province Appeals Charter Ruling (January 2026)',
      status: 'In Progress',
      description: `<p>In January 2026, a three-judge panel of the Ontario Court of Appeal heard the province's appeal of the Superior Court ruling. The Ford government argued the legislation was a valid exercise of provincial authority over transportation. Cycle Toronto and Ecojustice defended the Charter finding. A decision from the Court of Appeal is pending. The injunction preventing bike lane removals remains in force while the appeal is decided. If the province wins, removals are expected to begin immediately.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/toronto-cyclists-to-defend-bike-lane-challenge-in-court-9.7064937',
    },
    {
      title: 'Bill 212 Immunity Clause — NDP Raises Alarm Over "No Cause of Action" Provision',
      status: 'Completed',
      description: `<p>During legislative review of Bill 212, the Ontario NDP identified and raised an amendment that barred any cyclist — or the family of a killed cyclist — from launching a legal action against the Ontario government or its contractors for injuries or deaths caused by the bike lane removals. The clause was not highlighted in government communications. The Trillium reported it in detail after it was flagged by the NDP. Two lawyers and cycling safety advocates publicly called the clause an attempt to immunize the government against the lethal consequences of its own policy, and noted it demonstrated the government anticipated serious harm would result.</p>`,
      url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/ford-government-moves-to-block-bike-lane-removal-lawsuits-9845266',
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
    { title: 'CBC — Injured cyclists can\'t sue province under amendment to bike lane bill', url: 'https://www.cbc.ca/news/canada/toronto/ontario-bike-lane-bill-amendments-1.7390145' },
    { title: 'The Trillium — Ford government moves to bar lawsuits over injured, killed cyclists', url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/ford-government-moves-to-block-bike-lane-removal-lawsuits-9845266' },
    { title: 'Ecojustice — Court sides with cyclists: Charter rights violated by Bill 212', url: 'https://ecojustice.ca/news/major-victory-in-cycle-challenge-ontario-court-finds-government-violated-charter-rights/' },
    { title: 'Ecojustice — Court challenge launched against Ontario\'s anti-bike lane law', url: 'https://ecojustice.ca/news/court-challenge-launched-against-ontario-governments-anti-bike-lane-law/' },
    { title: 'Ecojustice — Legal file: Challenging Ontario\'s anti-bike lane law', url: 'https://ecojustice.ca/file/challenging-the-ontario-governments-anti-bike-lane-law/' },
    { title: 'CBC — Ontario passes Bill 212, bike lanes to be ripped out', url: 'https://www.cbc.ca/news/canada/toronto/bill-212-bike-lanes-highway-413-passes-1.7392821' },
    { title: 'CBC — Toronto cyclists defend bike lane challenge at Court of Appeal', url: 'https://www.cbc.ca/news/canada/toronto/toronto-cyclists-to-defend-bike-lane-challenge-in-court-9.7064937' },
    { title: 'CBC — Court challenge launched against Ontario bike lane law', url: 'https://www.cbc.ca/news/canada/toronto/court-challenge-bike-lanes-ontario-law-1.7407324' },
    { title: 'Cycle Toronto — Cycle Toronto v. Ontario (case overview)', url: 'https://www.cycleto.ca/cycle_toronto_v_ontario' },
    { title: 'Cycle Toronto — What\'s going on with Bill 212?', url: 'https://www.cycleto.ca/what_s_going_on_with_bill_212' },
    { title: 'Global News — Ford government passes law to remove Ontario bike lanes', url: 'https://globalnews.ca/news/10887272/ontario-bike-lane-removal-law-passes/' },
    { title: 'The Narwhal — Bill 212 passed: Highway 413 in, bike lanes out', url: 'https://thenarwhal.ca/ontario-highway-413-bill-passed/' },
    { title: 'Canadian Public Health Association — CPHA granted intervenor status in Bill 212 challenge', url: 'https://www.cpha.ca/bill-212' },
    { title: 'Legislative Assembly of Ontario — Bill 212 full text', url: 'https://www.ola.org/en/legislative-business/bills/parliament-43/session-1/bill-212' },
    { title: 'Canadian Cycling Magazine — Cyclists return to court as Ontario fights ruling', url: 'https://cyclingmagazine.ca/sections/news/cyclists-return-to-court-as-ontario-fights-ruling-blocking-toronto-bike-lane-removals/' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 Bill 212 / Bike Lane Removal scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
