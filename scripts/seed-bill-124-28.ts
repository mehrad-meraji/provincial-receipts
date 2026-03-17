/**
 * Seed script: Bill 124 / Bill 28 — Healthcare & Education Worker Suppression
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-bill-124-28.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'bill-124-28-wage-suppression'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford capped wages for 780,000 nurses, PSWs, and education workers at 1% per year while Ontario ran a $2.1 billion surplus — then invoked the notwithstanding clause to ban a strike by some of Canada's lowest-paid education workers. Both laws were struck down or repealed under public pressure, but not before accelerating a nursing exodus Ford's own ministry had privately documented, and leaving Ontario on the hook for a projected $13 billion in retroactive compensation.`

  const summary = `In November 2019, the Ford government passed Bill 124 — the Protecting a Sustainable Public Sector for Future Generations Act — capping wage increases for approximately 780,000 broader public sector workers at 1% per year. The cap applied to nurses, personal support workers, hospital staff, teachers, and education workers. Police officers and firefighters were explicitly exempted. Ford claimed the measure was a fiscal necessity; Ontario would post a $2.1 billion surplus just two years later. In November 2022, as nurses left the province in escalating numbers and a healthcare staffing crisis deepened, Ford turned to CUPE's education support workers — averaging $39,000 per year — and passed Bill 28, preemptively invoking the notwithstanding clause to ban their strike before it happened. Workers struck anyway. Within four days, facing the threat of a national general strike, Ford repealed the bill. The same month, the Ontario Superior Court struck down Bill 124 as unconstitutional. Two years of appeals followed. In February 2024, the Court of Appeal upheld the ruling 2-1. Ford repealed the Act. The total cost to taxpayers — retroactive pay for wages unlawfully suppressed — is projected by Ontario's Financial Accountability Officer at $13 billion.`

  const why_it_matters = `<p>Bill 124 was described by the Ford government as a necessary response to Ontario's fiscal crisis — a responsible cap to ensure public sector wages didn't outpace what the province could afford. The Ontario Superior Court found it was unconstitutional. The Ontario Court of Appeal agreed. Ontario's own finances told a different story: the province posted a <strong>$2.1 billion surplus in 2021-22</strong>, its first since 2007-08, during the very years nurses and PSWs were capped at 1% per year. The fiscal emergency that justified legally suppressing wages for 780,000 workers simply did not exist.</p>

<p>The bill's scope was sweeping and its targeting was specific. It applied to <a href="https://ona.org/campaign/bill-124/"><strong>approximately 780,000 workers</strong></a> across Ontario's broader public sector: nurses, registered practical nurses (RPNs), personal support workers (PSWs), hospital staff, long-term care employees, teachers, and university workers. <strong>Police officers and municipal firefighters were explicitly exempted.</strong> The Ontario Nurses' Association argued in court that this disparity — capping female-dominated healthcare professions while exempting male-dominated emergency services — perpetuated the systemic gender pay gap embedded in Ontario's public sector. Ninety percent of RPNs and PSWs are women. Seventy-five percent of respiratory therapists are women. The bill did not cap policing. It capped nursing.</p>

<p>The government knew it was worsening a crisis it was publicly denying. Internal Health Ministry briefing documents — obtained by <a href="https://globalnews.ca/news/9340310/health-care-ontario-bill-124-ford-government-documents/">Global News through Freedom of Information requests</a> in 2022 — explicitly listed "concerns about wage disparity via Bill 124" among the leading causes of Ontario's healthcare staffing shortage. These were notes prepared for Health Minister Sylvia Jones upon her appointment to brief her on the "main challenges to ending shortages." When confronted with his own ministry's documents, Ford called them <a href="https://globalnews.ca/news/9403082/doug-ford-bill-124-internal-documents-reaction/">"not accurate."</a> ONA President Erin Ariss put it plainly: <em>"Since Doug Ford took office in 2018, the number of nurses leaving the system has increased every year. For every 10 nurses this government says have been hired, six have left."</em></p>

<p>Bill 28 — the <em>Keeping Students in Class Act</em> — took the suppression one step further. CUPE's 55,000 education support workers — educational assistants, early childhood educators, custodians, school secretaries — earned an average of <strong>$39,000 per year</strong>, with 84% earning under $50,000. Their collective agreement had expired. CUPE members voted <a href="https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027">96.5% in favour of strike action</a> over wages that had fallen behind inflation for years. Rather than negotiate, Ford's government passed legislation on November 3, 2022 declaring any strike by these workers illegal, imposing a four-year collective agreement on them without their consent, and setting fines of up to <strong>$4,000 per day per striking worker</strong> and <strong>$500,000 per day for the union</strong>. To ensure the law could not be challenged in court, the government pre-emptively invoked <strong>Section 33 of the Charter — the notwithstanding clause</strong> — before a strike had even begun. It was the first time in Canadian history that any provincial government used the notwithstanding clause in collective bargaining legislation.</p>

<p>Prime Minister Justin Trudeau called the use of the notwithstanding clause <a href="https://beta.ctvnews.ca/national/politics/2022/11/3/1_6136885.amp.html">"wrong and inappropriate."</a> Federal Justice Minister David Lametti called the pre-emptive invocation "exceedingly problematic." The Canadian Civil Liberties Association called it unprecedented. Ford's rationale — that students had to be "kept in class" — applied to workers who had not yet struck. The law was not responding to a crisis. It was preemptively stripping workers of the only leverage they had.</p>`

  const rippling_effects = `<p>CUPE education workers <a href="https://cupe.ca/we-won-cupe-celebrates-defeat-doug-fords-anti-worker-bill-28">struck anyway on November 4, 2022</a>, defying the law and its fines. The response from Canada's labour movement was without modern precedent: the Ontario Federation of Labour announced plans for a general strike on November 14. Unions representing millions of Canadian workers — Unifor, the BC Teachers' Federation, national CUPE — mobilized solidarity. The BC Teachers' Federation sent $1 million. Facing what would have been the broadest general strike in Ontario's modern history, Ford held a press conference on November 7-8 and announced he would repeal the bill "as a sign of good faith." <a href="https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584">Bill 35 — the repeal — passed unanimously on November 14</a>, the same day it was introduced. It was the fastest repeal of a government bill in Canadian history. CUPE National President Mark Hancock stood beside other labour leaders representing millions of Canadian workers and said three words: <em>"The government blinked."</em></p>

<p>The legal reckoning for Bill 124 unfolded in parallel. On <a href="https://www.cbc.ca/news/canada/toronto/bill-124-ontario-public-sector-wages-1.6668186">November 29, 2022</a> — the same month Ford repealed Bill 28 — Ontario Superior Court Justice Markus Koehnen declared Bill 124 "void and of no effect," finding it violated Section 2(d) of the Charter (freedom of association, which includes the right to meaningful collective bargaining). The government appealed. On <a href="https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291">February 12, 2024</a>, the Ontario Court of Appeal upheld the ruling 2-1. Ford announced the next day that he would not appeal further. <a href="https://www.osler.com/en/insights/blogs/employment-and-labour-law-blog/bill-124-quashed-and-repealed/">Bill 124 was formally repealed on February 23, 2024.</a></p>

<p>The fiscal damage from the government's "fiscal responsibility" measure dwarfs any savings it generated. Premier Ford confirmed to CBC News that Ontario had paid over <a href="https://www.cbc.ca/news/canada/toronto/bill124-compensation-ford-government-1.7144793"><strong>$6 billion in retroactive compensation</strong></a> to broader public sector workers as of 2024. Ontario's Financial Accountability Officer projected the total cost — once wage increases are compounded into base salaries for future years — could reach <strong>$13 billion</strong>. Ontario also paid <a href="https://www.cbc.ca/news/canada/toronto/bill-124-legal-costs-ontario-ford-1.7352208">$4.3 million in legal costs</a>: $3.45 million to the 10 unions that challenged the law in court (and won), plus $856,000 in government legal costs defending an appeal that it lost. The "fiscal discipline" of Bill 124 cost Ontario more than a decade of compounding retroactive salary liability and years of legal fees — for a law that courts found was unconstitutional from the start.</p>

<p>The healthcare damage compounds differently and won't appear on a balance sheet. Nurses did not leave because of any single factor — but Bill 124 was a documented accelerant of a structural exodus. American hospitals were recruiting Ontario nurses with relocation packages, higher base pay, better staffing ratios, and educational supports. Ontario's response was a 1% annual cap. The government's own internal documents said it was making things worse. As of early 2026, tens of thousands of low-paid community and social services workers — among the most vulnerable workers in the public sector — are still awaiting retroactive compensation settlements. Major labour leaders have threatened further legal action. The workers who were harmed earliest and most are still waiting for what courts confirmed they were owed.</p>

<p>The constitutional precedent from Bill 28 cuts in both directions. No Canadian government had ever used the notwithstanding clause against labour rights. Ford did it preemptively — before a strike, against workers who hadn't yet exercised the right being stripped — and was forced to reverse it within four days. The episode demonstrated both the existence and the limits of the notwithstanding clause as a tool for suppressing worker rights: it can be done, but a sufficiently unified labour movement can make it politically untenable. It also permanently radicalized a national labour coalition that had been organizing separately. The threat of a general strike, which forced Ford to capitulate, was built in four days. That capacity has not dissipated.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Bill 124 / Bill 28 — Wage Suppression',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2019-11-08',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: "Ontario Superior Court — Bill 124 Declared Unconstitutional",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-124-ontario-public-sector-wages-1.6668186',
      description: `<p>On November 29, 2022, Ontario Superior Court Justice Markus Koehnen declared Bill 124 <strong>"void and of no effect,"</strong> finding it violated Section 2(d) of the Canadian Charter of Rights and Freedoms — the right to freedom of association, which includes the right to meaningful collective bargaining. The court found that capping wages at 1% "removed wages and compensation as an item for negotiation" and that legislation which "takes issues off the table" substantially interferes with collective bargaining. The government's justification — Ontario's fiscal situation — could not meet the Section 1 standard of a "pressing and substantial objective" sufficient to justify the rights violation, particularly given Ontario's improving financial position. The Ford government announced it would appeal.</p>`,
    },
    {
      title: "Ontario Court of Appeal — Bill 124 Unconstitutionality Upheld (2-1)",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291',
      description: `<p>On February 12, 2024, the Ontario Court of Appeal upheld the lower court ruling in a 2-1 decision, finding Bill 124 unconstitutional as applied to unionized employees. The majority confirmed the infringement on Section 2(d) Charter rights could not be justified. Justice Hourigan dissented, arguing the majority was wading into matters of public policy. Ford announced the following day that the government would not seek further appeal and would repeal the Act entirely. <a href="https://www.osler.com/en/insights/blogs/employment-and-labour-law-blog/bill-124-quashed-and-repealed/">Bill 124 was formally repealed on February 23, 2024</a> — four years, three months, and 15 days after it was passed. Ontario paid <a href="https://www.cbc.ca/news/canada/toronto/bill-124-legal-costs-ontario-ford-1.7352208">$4.3 million in legal costs</a> to the unions that challenged it.</p>`,
    },
    {
      title: "Bill 28 — Notwithstanding Clause Against CUPE; Repealed in 4 Days",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
      description: `<p>On November 3, 2022, the Ford government passed Bill 28 — the <em>Keeping Students in Class Act</em> — pre-emptively invoking the notwithstanding clause to ban a strike by 55,000 CUPE education workers before it began, impose a four-year collective agreement without worker consent, and set fines of up to $4,000/day per striking worker. It was <strong>the first use of the notwithstanding clause against labour rights in Canadian history.</strong> CUPE workers struck anyway on November 4. The Ontario Federation of Labour announced a general strike for November 14. Facing the broadest labour mobilization in Ontario's modern history, Ford announced the repeal on November 7-8. <a href="https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584">Bill 35 — the repeal — passed unanimously on November 14, 2022</a>, the same day it was introduced: the fastest repeal of a government bill in Canadian history.</p>`,
    },
    {
      title: "Retroactive Compensation — $6B+ Paid, $13B Projected",
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/bill124-compensation-ford-government-1.7144793',
      description: `<p>Following the Court of Appeal's ruling and Bill 124's repeal, Ontario entered retroactive pay arbitrations with 10 union groupings representing hundreds of thousands of workers. Premier Ford confirmed to CBC News that over <strong>$6 billion</strong> in retroactive compensation had been paid as of 2024. Ontario's Financial Accountability Officer projected the total cost — once compounded into base salaries for future years — could reach <strong>$13 billion</strong>. Ontario public servants received a 6.5% retroactive increase over the suppressed period; hospital nurses received average raises of 11% over two years in arbitration awards. As of early 2026, tens of thousands of low-paid community and social services workers are still awaiting settlements. The "fiscal discipline" of Bill 124 will ultimately cost Ontario more than a decade of compounding salary liability.</p>`,
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
    { url: 'https://www.cbc.ca/news/canada/toronto/bill-124-ontario-public-sector-wages-1.6668186', title: "Ontario judge declares Ford government's wage cap for public sector workers unconstitutional — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291', title: "Ontario appeal court rules Bill 124 wage-capping law unconstitutional, largely upholding lower court decision — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/bill124-compensation-ford-government-1.7144793', title: "Ontario on the hook for $6B and counting after Bill 124 struck down — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/bill-124-legal-costs-ontario-ford-1.7352208', title: "Ontario taxpayers on the hook for $4.3M in legal costs after Ford loses Bill 124 challenge — CBC News" },
    { url: 'https://globalnews.ca/news/9340310/health-care-ontario-bill-124-ford-government-documents/', title: "Internal health ministry documents say Bill 124 is worsening Ontario's staffing shortage — Global News" },
    { url: 'https://globalnews.ca/news/9403082/doug-ford-bill-124-internal-documents-reaction/', title: "Ford calls his own government's documents on Bill 124 and nursing shortage 'not accurate' — Global News" },
    { url: 'https://globalnews.ca/news/10764198/ontario-bill-124-cost-increase/', title: "Ford government's Bill 124 backpay closing in on $7B — Global News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027', title: "Ontario passes legislation to prevent education worker strike, invokes notwithstanding clause — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584', title: "Ontario government repeals controversial back-to-work legislation — CBC News" },
    { url: 'https://cupe.ca/we-won-cupe-celebrates-defeat-doug-fords-anti-worker-bill-28', title: "'We Won': CUPE celebrates defeat of Doug Ford's anti-worker Bill 28 — CUPE.ca" },
    { url: 'https://www.theglobeandmail.com/business/article-ford-cupe-notwithstanding-canadian-unions/', title: "Ford's notwithstanding clause use brought Canada's largest unions together — The Globe and Mail" },
    { url: 'https://beta.ctvnews.ca/national/politics/2022/11/3/1_6136885.amp.html', title: "Trudeau tells Ford use of notwithstanding clause is 'wrong and inappropriate' — CTV News" },
    { url: 'https://ona.org/campaign/bill-124/', title: "Bill 124 Campaign — Ontario Nurses' Association" },
    { url: 'https://www.osler.com/en/insights/blogs/employment-and-labour-law-blog/bill-124-quashed-and-repealed/', title: "Bill 124: Quashed and Repealed — Osler, Hoskin & Harcourt LLP" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Bill 124/28 scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
