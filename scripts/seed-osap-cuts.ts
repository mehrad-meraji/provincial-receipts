/**
 * Seed script: OSAP Cuts & Post-Secondary Defunding
 * Two waves of cuts (2019 and 2026), COVID clawbacks, Laurentian bankruptcy,
 * university funding collapse, and the "basket-weaving" quotes.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-osap-cuts.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'osap-cuts-postsecondary-defunding'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `In January 2019, Ford cut OSAP by $670 million — eliminating free tuition for low-income families, dropping 24,000 students from the program, and shifting the system from grants to loans. When the federal government doubled student grants during COVID, Ontario clawed back $400 million instead of passing it to students. The tuition freeze Ford extended repeatedly was never accompanied by restored aid or compensated operating grants — Laurentian University went bankrupt in 2021, the first public university in Canadian history to do so. In February 2026, Ford announced a second wave: grants capped at 25% of OSAP packages (down from 85%), with 75% as loans — and told students choosing the wrong programs to stop picking "basket-weaving courses." Hundreds protested at Queen's Park.`

  const summary = `<p>On January 17, 2019, Minister of Training, Colleges and Universities Merrilee Fullerton announced a sweeping restructuring of Ontario's student aid system — standing in front of a sign reading "For the Students." The package had three components: a mandatory 10% domestic tuition reduction, a restructured OSAP, and a Student Choice Initiative allowing students to opt out of campus fees. The tuition cut sounded good. What happened to OSAP did not.</p>
<p>Before Ford, Ontario's OSAP — redesigned by the previous Liberal government in 2017 — covered the full cost of average undergraduate tuition for families earning under $50,000 per year, with eligibility extending to families earning up to $175,000. The provincial OSAP budget was $2.04 billion. Ford's changes cut that budget to $1.37 billion — a reduction of $670 million, roughly 33%. The family income ceiling for any provincial grant dropped from $175,000 to $140,000. Approximately 24,000 fewer students received OSAP in the first year. The program shifted from 98% grants/2% loans to a system requiring at minimum 10% of every package to be loans — and 50% loans for graduate students, second-entry students (law, medicine), and students studying outside Ontario. The 6-month interest-free grace period on provincial loans after graduation was eliminated. The threshold for being classified as an "independent" student (meaning parents' income isn't counted) was extended from 4 years out of high school to 6 — pushing returning mature students back onto their parents' assessments. The maximum per-term Ontario Student Loan cap was raised from $5,200 to $7,500, enabling students to borrow more — but always in loans.</p>
<p>The 10% tuition cut disproportionately benefited students not on OSAP — those from families wealthy enough not to need grants. For students who were on OSAP, their grants were simply recalculated against the new lower tuition, resulting in smaller awards. Expert Alex Usher of Higher Education Strategy Associates put it plainly: <em>"All students on student aid will be worse off... only students not in need will be better off."</em> Student Federation Ontario chair Nour Alideeb: <em>"Students from low-income families pay more for their education in the long run."</em> Meanwhile the Student Choice Initiative — which allowed students to defund campus newspapers, student unions, and health services by opting out of ancillary fees — was struck down unanimously by the Ontario Divisional Court in November 2019, and the Court of Appeal dismissed Ford's appeal in August 2021, ordering the government to pay $20,000 in costs to the Canadian Federation of Students.</p>
<p>During COVID, the federal government doubled Canada Student Grants to provide emergency relief to students. Ontario clawed back approximately $400 million in provincial OSAP contributions in 2020–21 — reducing the provincial OSAP budget from $1.29 billion to $895 million — pocketing the federal increase rather than passing it to students. OUSA projected that if clawbacks continued at the same rate, students were short-changed by up to $1.2 billion in total federal relief. The clawbacks were documented in Ontario's own Fiscal Plan and Outlook (March 2021) and confirmed by the Financial Accountability Office.</p>
<p>Meanwhile Ford extended the tuition freeze repeatedly — through 2020–21, 2021–22, 2022–23, 2023–24 — without compensating universities for the lost revenue. Ontario's per-student university funding in 2022–23 was $10,246, versus a national average of $16,789. Ontario was funding universities at roughly 55 cents on the dollar compared to the national average. Universities lost over $1.1 billion in combined revenue between 2018 and 2022. The consequences were institutional. On February 1, 2021, Laurentian University filed for creditor protection under the Companies' Creditors Arrangement Act — the first public university in Canadian history to do so. Laurentian cut 195 faculty and staff positions and closed 69 programs, including 29 French-language programs serving Northern Ontario's francophone community. Documents later revealed Ford's government had denied Laurentian emergency COVID funding it extended to other institutions and had withheld correspondence about its role in the crisis. A government-commissioned expert panel in 2023 found Ontario's post-secondary sector "currently at serious risk" and named government policy as "a big part of the problem" — recommending an immediate 10% funding boost. The government's response: institutions must show "greater efficiencies in operations" first.</p>
<p>Then came February 12, 2026. Minister of Colleges, Universities, Research Excellence and Security Nolan Quinn announced a second, more sweeping restructuring: maximum OSAP grants slashed from 85% of a student's package to 25%, with minimum loans rising from 15% to 75%. A student previously receiving $10,000 in OSAP with $8,500 as non-repayable grants would now receive $2,500 in grants and $7,500 in loans — $6,000 more in annual debt, approximately $24,000 more over a four-year degree. Grants for private career college students were eliminated entirely. The seven-year tuition freeze was lifted, allowing universities to raise fees up to 2% per year. Ford's announced rationale for the grant cuts included a claim that he had heard "nightmare stories" of students buying "fancy watches and cologne" with OSAP money. On February 17, 2026, asked about the changes, Ford told students: <em>"You're picking basket-weaving courses, and there's not too many baskets being sold out there."</em> Hundreds of students protested at Queen's Park, with simultaneous walkouts at universities including approximately 1,000 students at the University of Waterloo. Two students were arrested. The Ontario NDP launched a "Save OSAP" campaign that reported 30,000 sign-ups in days.</p>`

  const why_it_matters = `<p>The 2019 OSAP restructuring was designed to appear as generosity — a 10% tuition cut announced alongside the aid changes — while cutting the underlying program that made post-secondary education financially accessible for students who needed it most. The tuition cut benefited students not receiving OSAP; the aid restructuring hurt those who were. The net effect was a transfer of public investment away from the students with the least capacity to absorb costs and toward those who didn't need the help. That is not a reform — it is a redistribution upward, branded as the opposite.</p>
<p>The COVID clawback compounded this dynamic at the worst possible moment. The federal government invested in student relief. Ontario's government intercepted it. Students who were already navigating an economically disrupted labour market, remote learning environments, and housing cost spikes received no additional provincial aid — because the province quietly reduced its own contribution by exactly as much as Ottawa added. The clawbacks were never announced; they were documented only through fiscal monitors and financial accountability reports.</p>
<p>The institutional damage is real and permanent in some cases. Laurentian University's bankruptcy eliminated 69 academic programs — including French-language programs for one of Ontario's most underserved communities — and 195 positions. The programs that closed cannot simply be reopened. The students who lost access to French-language education in Northern Ontario cannot simply commute to another institution. Ford's government denied Laurentian COVID relief it provided elsewhere and obscured its correspondence about the crisis. The government-appointed expert panel that found the post-secondary sector "at serious risk" and named government policy as "a big part of the problem" was dismissed with a demand for "efficiencies."</p>
<p>The 2026 changes — capping grants at 25%, converting 75% of OSAP to loans — represent a structural transformation of how Ontario conceptualises student aid: not as a public investment in accessible education, but as a loan program with a small grant component. A student graduating with a four-year degree under the new system could accumulate $24,000 more in debt than under the 2019 rules — which were already worse than what existed before Ford. Combined with tuition increases from the lifted freeze, total four-year debt loads could reach $45,000–$50,000 for many students. Ford's "basket-weaving" comment made explicit what the policy implied: the Premier of Ontario believes students who choose certain fields of study don't deserve grant funding. The government is now in the business of deciding which education is worth subsidising and which isn't — based on the Premier's views about labour market alignment, expressed through quotas on non-repayable aid.</p>`

  const rippling_effects = `<p>Ontario domestic students already carry the highest student loan debt of any province. The 2026 changes — if they stand — will widen that gap substantially. Projections suggest average OSAP-receiving students will graduate with approximately $27,060 in debt for a four-year degree under the new structure, with some estimates reaching $45,000–$50,000 when tuition increases are included. The NDP opposition pledged to bring a reversal vote when the legislature returned on March 23, 2026; as of that date, the outcome remained unknown.</p>
<p>The per-student funding gap with the rest of Canada remains unaddressed. Ontario funds universities at roughly 55% of the national average. That gap does not only affect finances — it affects the ratio of professors to students, the availability of research funding, the state of campus infrastructure, and the quality of the learning environment. The tuition freeze ended without a corresponding investment in operating grants; universities can raise tuition up to 2% per year, but that 2% will not close a gap that has been accumulating since 2008.</p>
<p>The Laurentian bankruptcy cut 29 French-language programs from Northern Ontario. Those communities — already geographically isolated and historically underserved — lost irreplaceable educational infrastructure. The French Language Services Act guarantees the right to services in French; the closure of Laurentian's French-language programs was a practical failure of that guarantee in post-secondary education. No equivalent programs have been established elsewhere in the affected region.</p>
<p>The student protests of March 2026 — at Queen's Park, at Waterloo, at Brock, in Hamilton, in Oshawa — represent the latest mobilisation against a seven-year pattern of disinvestment. Whether the protests produce legislative reversal depends on the legislature Ford convened so rarely. The arc of the OSAP scandal is clear: two waves of cuts, a COVID clawback, institutional bankruptcies, and a Premier who told students their choices didn't deserve public investment. Whether that arc bends toward restoration is a political question Ontario has not yet answered.</p>`

  console.log('Inserting OSAP Cuts scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'OSAP Cuts & Post-Secondary Defunding — Two Waves, a COVID Clawback, and "Basket-Weaving Courses"'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2026-02-12'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Student Choice Initiative Struck Down by Ontario Courts (November 2019 / August 2021)',
      status: 'Completed',
      description: `<p>The Student Choice Initiative — announced alongside the January 2019 OSAP changes — allowed students to opt out of "non-essential" ancillary fees, effectively defunding student unions, campus newspapers, peer support services, and student health centres. The Ontario Divisional Court struck it down unanimously on November 21, 2019, ruling the government had overstepped its authority. The Ford government appealed. On August 12, 2021, the Ontario Court of Appeal dismissed the appeal, fully affirming the lower court decision. The government was ordered to pay $20,000 in legal costs to the Canadian Federation of Students. The initiative was permanently quashed.</p>`,
      url: 'https://en.wikipedia.org/wiki/Student_Choice_Initiative',
    },
    {
      title: 'Ontario Claws Back $400M in Federal COVID Student Relief Instead of Passing It to Students (2020–21)',
      status: 'Completed',
      description: `<p>During the COVID-19 pandemic, the federal government doubled Canada Student Grants to provide emergency relief. Ontario responded by reducing its own provincial OSAP contribution by approximately the same amount — from $1.29 billion in 2019–20 to $895 million in 2020–21, a reduction of approximately $400 million. The province effectively intercepted the federal increase rather than passing it to students. This was documented in Ontario's Fiscal Plan and Outlook (March 2021, page 194) and confirmed by the Financial Accountability Office's Q1 2021–22 expenditure monitor. No government announcement accompanied the reduction. OUSA projected that if clawbacks continued, students were short-changed by up to $1.2 billion in total federal COVID student relief. No provincial action was taken to reimburse students.</p>`,
      url: 'https://www.ousa.ca/osap_clawbacks_explained',
    },
    {
      title: 'Laurentian University Bankruptcy — First Public University Insolvency in Canadian History (February 2021)',
      status: 'Completed',
      description: `<p>On February 1, 2021, Laurentian University in Sudbury filed for creditor protection under the Companies' Creditors Arrangement Act — the first public university in Canadian history to enter insolvency proceedings. Laurentian cut 195 faculty and staff positions and closed 69 academic programs, including 29 French-language programs serving Northern Ontario's francophone community. Documents revealed Ford's government denied Laurentian the emergency COVID relief funding extended to other institutions, and withheld correspondence about its role in the crisis. CUPE reported the Auditor General's review showed the Ford government had other options to save the university. The government-appointed expert panel on post-secondary funding (2023) found Ontario's sector "currently at serious risk" and named government policy as "a big part of the problem." Government response: institutions must demonstrate "greater efficiencies" before more funding.</p>`,
      url: 'https://en.wikipedia.org/wiki/2021_Laurentian_University_financial_crisis',
    },
    {
      title: '2026 OSAP Restructuring — Grants Capped at 25%, Loans at 75%; Student Protests Erupt (February 2026)',
      status: 'Ongoing',
      description: `<p>On February 12, 2026, Minister Nolan Quinn announced a second wave of OSAP restructuring effective Fall 2026: maximum grants slashed from 85% of a student's OSAP package to 25%; minimum loans increased from 15% to 75%. A student previously receiving $10,000 in OSAP with $8,500 in grants now receives $2,500 in grants and $7,500 in loans — approximately $24,000 in additional debt over a four-year degree. Grants for private career college students eliminated entirely. The seven-year tuition freeze lifted; universities may raise fees up to 2% per year. Ford told students on February 17, 2026: "You're picking basket-weaving courses, and there's not too many baskets being sold out there," and claimed he'd heard "nightmare stories" of students buying "fancy watches and cologne" with OSAP money. Hundreds protested at Queen's Park; ~1,000 students walked out at the University of Waterloo. Two people arrested. NDP's "Save OSAP" campaign gained 30,000 sign-ups in days. As of March 2026, the legislature had not yet voted on reversal motions.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-college-university-funding-osap-9.7086776',
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
    { title: 'Global News — Ontario government cuts tuition fees by 10%, eliminates free tuition for low-income students', url: 'https://globalnews.ca/news/4856924/ontario-tuition-cuts/' },
    { title: 'CBC — Minister defends tuition, student fee, and OSAP changes (January 2019)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-minister-tuition-cut-student-fees-opting-out-osap-changes-1.4986612' },
    { title: 'Inside Higher Ed — Ontario cuts tuition 10% while reducing aid spending', url: 'https://www.insidehighered.com/news/2019/01/18/ontario-cuts-tuition-10-percent-while-reducing-aid-spending-raising-concerns-about' },
    { title: 'OUSA — What\'s the Deal with the 2019 Changes to OSAP?', url: 'https://www.ousa.ca/blog_osap_changes' },
    { title: 'OUSA — Provincial OSAP Clawbacks Explained', url: 'https://www.ousa.ca/osap_clawbacks_explained' },
    { title: 'OUSA — Stop OSAP Clawbacks campaign', url: 'https://www.ousa.ca/stop_osap_clawbacks' },
    { title: 'CBC — Students affected by OSAP cuts (2019)', url: 'https://www.cbc.ca/news/canada/toronto/osap-funding-university-postsecondary-ford-1.5183918' },
    { title: 'CBC — 3 years after OSAP overhaul, many Ontario students still struggling', url: 'https://www.cbc.ca/news/canada/toronto/osap-changes-impact-three-years-on-1.6518122' },
    { title: 'Wikipedia — Student Choice Initiative (struck down by courts 2019/2021)', url: 'https://en.wikipedia.org/wiki/Student_Choice_Initiative' },
    { title: 'Wikipedia — 2021 Laurentian University financial crisis', url: 'https://en.wikipedia.org/wiki/2021_Laurentian_University_financial_crisis' },
    { title: 'CUPE — Government-appointed panel confirms massive university underfunding in Ontario', url: 'https://cupe.ca/government-appointed-panel-confirms-massive-university-underfunding-ontario' },
    { title: 'CUPE — AG\'s report shows Ford Conservatives had other options to save Laurentian', url: 'https://cupe.ca/ags-report-shows-ford-conservatives-had-other-options-save-laurentian-university' },
    { title: 'CBC — Ontario\'s universities face a funding crunch (government panel report)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-university-finance-tuition-panel-report-doug-ford-1.7032518' },
    { title: 'The Local — Ontario Post-Secondary Education Crisis in Five Figures', url: 'https://thelocal.to/ontario-post-secondary-education-funding-crisis/' },
    { title: 'CBC — Tuition set to rise, OSAP grants lower with new Ontario post-secondary funding changes (Feb 2026)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-college-university-funding-osap-9.7086776' },
    { title: 'CBC — Ford tells students to not pick "basket-weaving courses"', url: 'https://www.cbc.ca/news/canada/toronto/doug-ford-osap-cuts-9.7094009' },
    { title: 'CBC — Ford continues to defend OSAP cuts despite student outcry', url: 'https://www.cbc.ca/news/canada/toronto/ontario-premier-defends-osap-cuts-9.7095738' },
    { title: 'CBC — Fears Ontario\'s student aid cuts will bring huge debt, put higher education out of reach', url: 'https://www.cbc.ca/news/canada/ont-osap-student-debt-9.7096406' },
    { title: 'CBC — \'No cuts, no fees, no corporate universities\': Students stage mass protest at Queen\'s Park', url: 'https://www.cbc.ca/news/canada/toronto/osap-protest-ontario-toronto-9.7114458' },
    { title: 'Globe and Mail — Two arrested as Ontario students protest cuts to OSAP grants at Queen\'s Park', url: 'https://www.theglobeandmail.com/canada/education/article-ontario-students-gather-outside-legislature-to-protest-cuts-to-osap/' },
    { title: 'CBC — Opposition calls on Ford to reverse course on cuts to OSAP', url: 'https://www.cbc.ca/news/canada/toronto/opposition-calling-for-reversal-of-osap-cuts-9.7102860' },
    { title: 'Ontario NDP — Save OSAP campaign', url: 'https://www.ontariondp.ca/saveosap' },
    { title: 'OCUFA — Auditor General\'s claims about OSAP inaccurate and irresponsible', url: 'https://ocufa.on.ca/blog-posts/auditor-generals-claims-about-osap-inaccurate-and-irresponsible/' },
    { title: 'The Eyeopener — Students shocked after Ford slashes OSAP grants and unfreezes tuition', url: 'https://theeyeopener.com/2026/02/students-shocked-after-ford-slashes-osap-grants-and-unfreezes-tuition/' },
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
      date: '2019-01-17',
      label: 'Ford cuts OSAP by $670M — 24,000 students lose grants; free tuition for low-income families eliminated',
      icon: 'AlertTriangle',
    },
    {
      date: '2019-11-21',
      label: 'Ontario court unanimously strikes down Ford\'s Student Choice Initiative',
      icon: 'Gavel',
    },
    {
      date: '2021-02-01',
      label: 'Laurentian University files for insolvency — first public university bankruptcy in Canadian history',
      icon: 'AlertTriangle',
    },
    {
      date: '2021-08-12',
      label: 'Court of Appeal upholds Student Choice Initiative ruling; Ford ordered to pay $20K in costs',
      icon: 'Gavel',
    },
    {
      date: '2026-02-12',
      label: 'Ford announces second OSAP wave: grants capped at 25%, 75% loans; tuition freeze lifted',
      icon: 'AlertTriangle',
    },
    {
      date: '2026-02-17',
      label: 'Ford tells students: "You\'re picking basket-weaving courses, and there\'s not too many baskets"',
      icon: 'Newspaper',
    },
    {
      date: '2026-03-05',
      label: 'Hundreds protest OSAP cuts at Queen\'s Park; ~1,000 walk out at Waterloo; two arrested',
      icon: 'Megaphone',
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

  console.log('\n🎉 OSAP Cuts & Post-Secondary Defunding scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
