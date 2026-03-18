/**
 * Seed script: Bill 124 / Bill 28 — Healthcare & Education Worker Wage Suppression
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-bill-124-128.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'bill-124-128-wage-suppression'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford's Bill 124 capped wages for 780,000 public sector workers — mostly nurses and healthcare staff — at 1% annually for three years while inflation ran at 4–7%. Two courts struck it down as unconstitutional. Separately, Bill 28 invoked the notwithstanding clause to ban 55,000 education workers from striking, threatening fines of $500,000/day on the union and $4,000/day on individuals. Ford was forced to repeal it within days after a threatened general strike. Ontario ultimately paid $4.3 million in legal costs.`

  const summary = `<p>In 2019, Ford's government passed Bill 124, the <em>Protecting a Sustainable Public Sector for Future Generations Act</em>, which imposed a hard cap on wage increases for 780,000 unionized public sector workers — including nurses, hospital workers, paramedics, long-term care staff, and other healthcare professionals. The cap limited any compensation increase to 1% annually for three years. The bill was framed as a deficit-reduction measure, but critics immediately noted it was applied exclusively to unionized workers and directly targeted sectors dominated by women.</p>
<p>In 2022, with inflation running at 4–7%, the real-wage impact of the cap became impossible to ignore. Nurses working in hospitals, making salaries that hadn't kept pace with the cost of living, began leaving the profession in large numbers — many moving to private nursing agencies where pay was <a href="https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291" target="_blank" rel="noopener noreferrer">substantially higher for the same work</a>. Emergency departments across Ontario began closing overnight due to staff shortages. The nursing crisis became one of the most visible domestic policy failures of Ford's tenure.</p>
<p>Simultaneously, Ford's government was locked in a wage dispute with CUPE, which represents 55,000 education support workers — custodians, educational assistants, school secretaries, early childhood educators — earning an average of <a href="https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027" target="_blank" rel="noopener noreferrer">approximately $39,000 per year</a>. When CUPE rejected the province's 2% offer and announced a strike, the Ford government responded with Bill 28, the <em>Keeping Students in Class Act</em>, which used the notwithstanding clause to ban the strike and impose a contract.</p>`

  const why_it_matters = `<p>Bill 124 was challenged in court by the Ontario Nurses' Association and dozens of other unions. In November 2022, an Ontario Superior Court judge <a href="https://ona.org/news/20240212-bill-124-appeal-victory/" target="_blank" rel="noopener noreferrer">struck down the law as unconstitutional</a>, finding it infringed on workers' Charter-protected right to freedom of association and collective bargaining. Ford's government appealed. In February 2024, the Ontario Court of Appeal upheld the ruling in a 2-1 decision, writing that "organized public sector workers, many of whom are women, racialized and/or low-income earners, have lost the ability to negotiate for better compensation or even better work conditions that do not have a monetary value."</p>
<p>The Court of Appeal's framing was pointed: the government's wage suppression had fallen most heavily on the most vulnerable public sector workers. The Ford government eventually agreed to repeal Bill 124, but the three years of wage suppression had already caused significant harm — nurses had left the profession, healthcare wait times had lengthened, and the system had become increasingly reliant on expensive private staffing agencies. <a href="https://www.cbc.ca/news/canada/toronto/bill-124-legal-costs-ontario-ford-1.7352208" target="_blank" rel="noopener noreferrer">Ontario taxpayers paid $4.3 million in legal costs</a> after the government lost its case.</p>
<p>Bill 28 represented a separate and more alarming precedent. The <em>notwithstanding clause</em> of the Charter allows governments to override fundamental rights — it is supposed to be used sparingly and for extraordinary circumstances. Ford invoked it to prevent low-wage education workers from exercising their right to strike over wages that hadn't kept up with inflation. Bill 28 imposed <a href="https://www.employmentandlabour.com/ontario-introduces-bill-28-the-keeping-students-in-class-act-2022/" target="_blank" rel="noopener noreferrer">fines of $4,000 per day on each individual worker who struck, and $500,000 per day on CUPE</a> as an organization — penalties designed to make any labour action economically catastrophic.</p>
<p>The response was immediate and unprecedented. Canada's largest unions threatened a province-wide general strike in solidarity with CUPE workers. The <a href="https://www.theglobeandmail.com/business/article-ford-cupe-notwithstanding-canadian-unions/" target="_blank" rel="noopener noreferrer">threat of a general strike united Canadian labour in a way that hadn't been seen in decades</a>. Within days, Ford blinked: he held a press conference, said he would repeal Bill 28 "as a sign of good faith," and the government introduced the repeal legislation (Bill 35) within a week. It passed unanimously.</p>`

  const rippling_effects = `<p>The Bill 124 saga contributed directly to Ontario's nursing shortage crisis. As hospital nurses' wages were capped at 1% while private agency nurses earned premium rates without the cap, the economic incentive to leave hospital employment became substantial. Emergency rooms began closing overnight. Surgeries were cancelled. The healthcare system accumulated a backlog that persisted long after the law was struck down. The Ford government's response to the ER closures — threatening to fine hospitals that closed emergency departments — was widely criticized as blaming institutions for a staffing crisis the government had created.</p>
<p>The use of the notwithstanding clause in Bill 28, even briefly, established a chilling precedent. The clause had been used sparingly in Ontario's history; Ford reached for it against the lowest-paid education workers in the system during a cost-of-living crisis. Constitutional scholars warned that the willingness to invoke the notwithstanding clause against fundamental labour rights could be repeated. Ford had previously <a href="https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291" target="_blank" rel="noopener noreferrer">threatened to use the notwithstanding clause</a> in other contexts, suggesting the government viewed it as a routine political tool rather than an extraordinary measure of last resort.</p>
<p>Together, Bills 124 and 28 represented a coherent political strategy: suppress wages for unionized public sector workers, transfer the savings to fiscal figures the government could point to, and use state power — including constitutional override — to prevent workers from fighting back. The strategy was ultimately repudiated by the courts and by the labour movement, but not before billions in suppressed wages had already been withheld, and not before Ontario's healthcare system had sustained structural damage that would take years to repair.</p>`

  console.log('Inserting Bill 124 / Bill 28 scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Bill 124 / Bill 28 — Healthcare & Education Wage Suppression'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2022-11-29'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  // Legal Actions
  const legalActions = [
    {
      title: 'Ontario Superior Court Strikes Down Bill 124 as Unconstitutional',
      status: 'Completed',
      description: `<p>In November 2022, Ontario Superior Court Justice Markus Koehnen struck down Bill 124 in its entirety, ruling that the legislation violated public sector workers' Charter Section 2(d) rights to freedom of association and collective bargaining. The court found the government had failed to demonstrate the infringement was justified. The ruling applied to all 780,000 workers affected by the cap and invalidated three years of wage suppression. Ford's government appealed.</p>`,
      url: 'https://ona.org/news/20240212-bill-124-appeal-victory/',
    },
    {
      title: 'Ontario Court of Appeal Upholds Bill 124 Unconstitutionality (2-1)',
      status: 'Completed',
      description: `<p>In February 2024, the Ontario Court of Appeal upheld the lower court's ruling in a 2-1 decision, confirming Bill 124 was an unjustifiable infringement of Charter rights. The majority wrote that the law had stripped "organized public sector workers, many of whom are women, racialized and/or low-income earners" of their ability to negotiate for better compensation or working conditions. The government subsequently agreed to repeal the legislation. Ontario taxpayers paid $4.3 million in legal costs arising from the Bill 124 litigation.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291',
    },
    {
      title: 'Bill 28 — Notwithstanding Clause Invoked to Ban Education Worker Strike',
      status: 'Completed',
      description: `<p>In November 2022, Ford's government passed Bill 28 (the <em>Keeping Students in Class Act</em>), using the notwithstanding clause to override CUPE education workers' right to strike and impose a contract. The bill threatened fines of $4,000/day per striking worker and $500,000/day on the union. After a threatened province-wide general strike from Canada's major labour unions, Ford reversed course and introduced repeal legislation (Bill 35) within days. Bill 35 passed unanimously. Critics called Ford's use of the notwithstanding clause against low-wage workers a dangerous constitutional precedent.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (
        ${laId}, ${scandalId}, ${la.title}, ${la.status},
        ${la.description}, ${la.url}, ${now}, ${now}
      )
    `
    console.log(`  ✅ Legal action: ${la.title}`)
  }

  // Sources
  const sources = [
    {
      title: 'CBC News — Ontario to repeal wage-cap law after Appeal Court rules Bill 124 unconstitutional',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-124-appeal-court-ruling-ontario-1.7112291',
    },
    {
      title: 'Ontario Nurses\' Association — Bill 124 Appeal Victory',
      url: 'https://ona.org/news/20240212-bill-124-appeal-victory/',
    },
    {
      title: 'CBC News — Ontario taxpayers fork over $4.3M to settle legal costs in Bill 124 cases',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-124-legal-costs-ontario-ford-1.7352208',
    },
    {
      title: 'CBC News — Ontario passes Bill 28 to ban CUPE education workers\' strike',
      url: 'https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027',
    },
    {
      title: 'CBC News — Ford promises to repeal Bill 28 after CUPE strike threat',
      url: 'https://www.cbc.ca/news/canada/toronto/cupe-strike-labour-board-ruling-expected-1.6642824',
    },
    {
      title: 'CBC News — Ontario government repeals Bill 28 anti-strike law',
      url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
    },
    {
      title: 'Dentons — Ontario introduces Bill 28: Keeping Students in Class Act, 2022',
      url: 'https://www.employmentandlabour.com/ontario-introduces-bill-28-the-keeping-students-in-class-act-2022/',
    },
    {
      title: 'Globe and Mail — Ford\'s use of notwithstanding clause brought Canada\'s largest unions together',
      url: 'https://www.theglobeandmail.com/business/article-ford-cupe-notwithstanding-canadian-unions/',
    },
    {
      title: 'Wikipedia — Bill 124 (Ontario)',
      url: 'https://en.wikipedia.org/wiki/Bill_124',
    },
    {
      title: 'Wikipedia — Keeping Students in Class Act (Bill 28)',
      url: 'https://en.wikipedia.org/wiki/Keeping_Students_in_Class_Act',
    },
    {
      title: 'Ontario Nurses\' Association — About Bill 124',
      url: 'https://www.ona.org/about-bill-124/',
    },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 60)}...`)
  }

  console.log('\n🎉 Bill 124 / Bill 28 scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
