/**
 * Seed script: Ford Government & the Notwithstanding Clause
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-notwithstanding-clause.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'notwithstanding-clause'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Doug Ford's government has invoked or threatened the notwithstanding clause three times — more than any Ontario premier in history. In 2018, Ford threatened to override a court ruling that his mid-election Toronto council cuts were unconstitutional. In 2021, he pre-emptively buried an election advertising law inside Section 33 to shield it from Charter challenge. In 2022, he used the clause against 55,000 education workers before a single strike vote was held — the first time any Canadian government had invoked Section 33 against labour rights. Workers struck anyway. Ford backed down in four days. The clause is meant to be a mechanism of last resort for democratically exceptional circumstances. Ford has treated it as a first-response tool for policy he expects courts to reject.`

  const summary = `<p>Section 33 of the Canadian Charter of Rights and Freedoms — the notwithstanding clause — allows Parliament or a provincial legislature to declare that a law operates "notwithstanding" certain Charter rights, shielding the law from judicial review for five years. It was included in the Charter as a compromise, intended as a mechanism of last resort for extraordinary democratic circumstances. In forty years, it was invoked sparingly: Quebec used it systematically in the 1980s following the patriation dispute; Saskatchewan used it in 1986 to end a farm strike; Alberta used it in 2000 on a marriage definition law. Ontario had never used it.</p>
<p>Doug Ford's government has invoked or formally threatened Section 33 three times since 2018. The first was a threat, the second was pre-emptive and procedurally quiet, and the third — against education workers in November 2022 — was the most dramatic use of the clause in Canadian history. No Canadian government had ever used Section 33 against labour rights. Ford did it before a strike had even begun. Workers defied the law anyway. Within four days, facing the threat of a national general strike, Ford repealed the legislation entirely.</p>
<p>The pattern across all three invocations is consistent: Ford's government uses or threatens Section 33 when it anticipates courts will strike down legislation that serves a political objective and when the government is not prepared to defend the law on its merits. The clause is not used after careful deliberation about Charter values — it is used to foreclose that deliberation before it begins.</p>`

  const why_it_matters = `<p><strong>The First Threat — Bill 5 and the Toronto Ward Reduction (2018):</strong> In July 2018, mid-election, Ford's government passed Bill 5 reducing Toronto's city council from 47 seats to 25 — cutting the number of wards while a municipal election campaign was already underway and ballots were being printed. Ontario Superior Court Justice Edward Belobaba struck the law down on September 10, finding it violated the free expression rights of candidates and voters under Section 2(b) of the Charter. Ford's response was immediate: he announced he would recall the legislature for a special session to invoke the notwithstanding clause. He called Section 33 "a tool given to us by the fathers of Confederation" and said he would use it to override the court. It was the first time any Ontario premier had threatened to use the clause. Before Ford was required to formally invoke it, the Ontario Court of Appeal granted an emergency stay of the lower court ruling, allowing the election to proceed under the new ward map. Ford ultimately passed the legislation without formally invoking Section 33 — but he had announced, publicly and deliberately, that he was willing to override the Charter rather than accept a court ruling that went against him.</p>
<p><strong>The Quiet Pre-emption — Bill 307 and Election Advertising (2021):</strong> In June 2021, the Ford government passed the Protecting Elections and Defending Democracy Act (Bill 307), which reinstated third-party election advertising spending limits that had been struck down by the courts as violating Section 2(b) of the Charter. Rather than defend the limits on their merits — or revise them to be constitutionally sound — the government pre-emptively embedded Section 33 directly in the bill's text. There was no legal crisis, no court order to override. Ford's government simply expected the law would be found unconstitutional and used the notwithstanding clause as insurance. This invocation received less public attention than the Bill 28 episode, but it was legally significant: it was the first time the Ford government formally invoked Section 33 in enacted legislation, and it established that the government was prepared to use the clause pre-emptively and without public deliberation.</p>
<p><strong>The Labour Weapon — Bill 28 and the CUPE Education Workers (2022):</strong> On November 3, 2022, the Ford government passed Bill 28 — the Keeping Students in Class Act. CUPE's 55,000 education support workers — educational assistants, early childhood educators, custodians, school secretaries — earned an average of $39,000 per year. After their collective agreement expired and years of wages falling behind inflation, CUPE members voted 96.5% in favour of strike action. Ford's government responded not with negotiation but with legislation that: declared any strike illegal before it had begun; imposed a four-year collective agreement without worker consent; set fines of up to $4,000 per day per worker and $500,000 per day for the union; and pre-emptively invoked Section 33 to prevent any Charter challenge from proceeding. It was the first time in Canadian history that any government had used the notwithstanding clause against labour rights. Prime Minister Justin Trudeau called it "wrong and inappropriate." Federal Justice Minister David Lametti called the pre-emptive invocation "exceedingly problematic." The Canadian Civil Liberties Association said it was unprecedented. Ford's stated rationale — keeping students in school — applied to workers who had not yet exercised their legal right to strike.</p>`

  const rippling_effects = `<p>CUPE education workers struck on November 4, 2022 — defying Bill 28 and its fines. The Ontario Federation of Labour announced a general strike for November 14. Unions representing millions of Canadian workers mobilized: Unifor, the BC Teachers' Federation, national CUPE, and others. The BC Teachers' Federation sent $1 million in strike support. What Ford had characterized as a dispute over 55,000 education support workers became the largest labour mobilization Canada had seen in decades. Facing a general strike, Ford held a press conference and announced he would repeal the bill "as a sign of good faith." Bill 35 — the repeal — passed unanimously on November 14, the same day it was introduced. It was the fastest repeal of a major government bill in Canadian history. CUPE National President Mark Hancock stood with other labour leaders and said: "The government blinked."</p>
<p>The constitutional implications of Ford's notwithstanding clause pattern extend beyond the individual bills. Legal scholars have noted that the Ford government has used the clause not in response to profound conflicts between legislative will and judicial overreach — the circumstances the clause was designed for — but as a pre-emptive shield for legislation the government expects to lose in court. This use has been called "weaponization" of the clause by constitutional scholars including University of Ottawa law professor Emmett Macfarlane. It treats Section 33 not as an extraordinary override of last resort but as a routine policy insulation tool. The implication is significant: if governments normalize the pre-emptive use of the notwithstanding clause whenever they anticipate Charter conflict, the entire system of constitutional review becomes optional for sufficiently determined governments.</p>
<p>Ford's invocations have also accelerated a national debate about whether Section 33 requires reform. The federal government under Justin Trudeau raised the possibility of requiring federal approval for provincial notwithstanding clause use — a proposal that was itself constitutionally contentious. The New Brunswick, Alberta, and Saskatchewan governments subsequently invoked Section 33 for their own legislation, in what critics described as normalization of the clause modelled in part on Ontario's precedents. Whether the Ford government's aggressive use of Section 33 permanently lowered the political threshold for invoking it across Canada is a question constitutional scholars expect courts and legislatures will be grappling with for decades.</p>`

  console.log('Inserting Notwithstanding Clause scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${"Ford Government's Use of the Notwithstanding Clause"},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2018-09-10'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Bill 5 — Toronto Ward Reduction Struck Down; Ford Threatens Section 33 (September 2018)',
      status: 'Resolved',
      description: `<p>On September 10, 2018, Ontario Superior Court Justice Edward Belobaba struck down Bill 5 — Ford's mid-election reduction of Toronto's city council from 47 to 25 seats — finding it violated the free expression rights of candidates and voters under Section 2(b) of the Canadian Charter of Rights and Freedoms. Ford immediately announced he would recall the legislature to invoke the notwithstanding clause to override the ruling. It was the first time any Ontario premier had publicly threatened to use Section 33. The Ontario Court of Appeal granted an emergency stay before the clause needed to be formally invoked, and the election proceeded under the new ward map. The Court of Appeal ultimately upheld Bill 5 on its merits in 2019. Ford did not formally invoke Section 33 but had announced publicly that he would override the Charter rather than accept a court ruling against him.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ford-notwithstanding-clause-city-council-1.4818327',
    },
    {
      title: 'Bill 307 — Protecting Elections and Defending Democracy Act; Pre-emptive Section 33 (June 2021)',
      status: 'Active',
      description: `<p>In June 2021, the Ford government passed Bill 307 — the Protecting Elections and Defending Democracy Act — reinstating third-party election advertising spending limits that had been struck down as a violation of Section 2(b) of the Charter (freedom of expression). Rather than revise the limits to pass constitutional scrutiny, the government pre-emptively included the notwithstanding clause in the bill's text, shielding it from Charter challenge for five years. It was the first formal invocation of Section 33 in enacted Ontario legislation under Ford. No court had yet ruled on the new bill; the government used the clause as insurance against a challenge it expected to lose. The Canadian Civil Liberties Association and election law advocates criticized the pre-emptive use as a misapplication of the clause's intended role as a mechanism of last resort.</p>`,
      url: 'https://www.thestar.com/opinion/contributors/2021/07/09/ford-government-invokes-notwithstanding-clause-to-limit-third-party-election-spending.html',
    },
    {
      title: 'Bill 28 — Keeping Students in Class Act; Section 33 Against Labour Rights (November 2022)',
      status: 'Resolved — Bill Repealed',
      description: `<p>On November 3, 2022, the Ford government passed Bill 28 — the Keeping Students in Class Act — pre-emptively invoking Section 33 to ban a strike by 55,000 CUPE education support workers before it had occurred, imposing a four-year collective agreement without their consent, and setting fines of up to $4,000 per day per striking worker and $500,000 per day for the union. It was the first time in Canadian history that any government had used the notwithstanding clause against labour rights. Prime Minister Trudeau called it "wrong and inappropriate." CUPE workers struck anyway on November 4. Facing a threatened general strike involving millions of workers across Canada, Ford announced the repeal of the bill on November 7-8. Bill 35 — the repeal — passed unanimously on November 14, 2022, the same day it was introduced: the fastest repeal of a government bill in Canadian history.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
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
    { title: 'CBC News — Ford Threatens Notwithstanding Clause After Court Strikes Down Toronto Council Cuts', url: 'https://www.cbc.ca/news/canada/toronto/ford-notwithstanding-clause-city-council-1.4818327' },
    { title: 'Globe and Mail — Ford Announces Legislature Will Be Recalled to Override Court Ruling', url: 'https://www.theglobeandmail.com/canada/toronto/article-ford-recalls-legislature-to-override-court-ruling/' },
    { title: 'Toronto Star — Ford Government Invokes Notwithstanding Clause to Limit Third-Party Election Spending (Bill 307)', url: 'https://www.thestar.com/opinion/contributors/2021/07/09/ford-government-invokes-notwithstanding-clause-to-limit-third-party-election-spending.html' },
    { title: 'CBC News — Ontario Passes Legislation to Prevent Education Worker Strike, Invokes Notwithstanding Clause (Bill 28)', url: 'https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027' },
    { title: 'CTV News — Trudeau Calls Ford\'s Use of Notwithstanding Clause "Wrong and Inappropriate"', url: 'https://www.ctvnews.ca/politics/trudeau-tells-ford-use-of-notwithstanding-clause-is-wrong-and-inappropriate-1.6136885' },
    { title: 'CBC News — Ontario Government Repeals Controversial Back-to-Work Legislation (Bill 35)', url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584' },
    { title: 'CUPE Canada — "We Won": CUPE Celebrates Defeat of Doug Ford\'s Anti-Worker Bill 28', url: 'https://cupe.ca/we-won-cupe-celebrates-defeat-doug-fords-anti-worker-bill-28' },
    { title: 'Globe and Mail — Ford\'s Notwithstanding Clause Use Brought Canada\'s Largest Unions Together', url: 'https://www.theglobeandmail.com/business/article-ford-cupe-notwithstanding-canadian-unions/' },
    { title: 'Maclean\'s — The Notwithstanding Clause Is Being Normalized and That Should Worry Everyone', url: 'https://www.macleans.ca/politics/the-notwithstanding-clause-is-being-normalized/' },
    { title: 'Policy Options — Ford\'s Use of the Notwithstanding Clause and the Weaponization of Section 33', url: 'https://policyoptions.irpp.org/magazines/november-2022/ford-cupe-notwithstanding-section-33/' },
    { title: 'CBC News — CUPE Education Workers Strike Defying Back-to-Work Legislation', url: 'https://www.cbc.ca/news/canada/toronto/cupe-education-workers-strike-ontario-1.6641636' },
    { title: 'National Post — What is the Notwithstanding Clause and Why Does Ford Keep Using It?', url: 'https://nationalpost.com/news/canada/what-is-the-notwithstanding-clause-ford-ontario' },
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
      date: '2018-09-10',
      label: 'Court strikes down Toronto ward cuts — Ford threatens notwithstanding clause',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/ford-notwithstanding-clause-city-council-1.4818327',
    },
    {
      date: '2018-09-13',
      label: 'Ford recalls legislature; Court of Appeal stays lower court ruling before Section 33 needed',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/ford-notwithstanding-clause-city-council-1.4818327',
    },
    {
      date: '2021-06-14',
      label: 'Bill 307: Ford pre-emptively invokes notwithstanding clause on election advertising limits',
      icon: 'Vote',
      url: 'https://www.thestar.com/opinion/contributors/2021/07/09/ford-government-invokes-notwithstanding-clause-to-limit-third-party-election-spending.html',
    },
    {
      date: '2022-11-03',
      label: 'Bill 28 passes — first use of notwithstanding clause against labour rights in Canadian history',
      icon: 'Megaphone',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027',
    },
    {
      date: '2022-11-04',
      label: 'CUPE education workers strike in defiance of Bill 28 and its fines',
      icon: 'Megaphone',
      url: 'https://www.cbc.ca/news/canada/toronto/cupe-education-workers-strike-ontario-1.6641636',
    },
    {
      date: '2022-11-07',
      label: 'Ford announces repeal of Bill 28 facing threatened national general strike',
      icon: 'Megaphone',
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
    },
    {
      date: '2022-11-14',
      label: 'Bill 35 repeals Bill 28 unanimously — fastest repeal of a government bill in Canadian history',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
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

  console.log('\n🎉 Notwithstanding Clause scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
