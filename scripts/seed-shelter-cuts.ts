/**
 * Seed script: Ford's Shelter Funding Cuts — Slashing Homelessness Programs
 * While Criminalizing the People Left Behind.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-shelter-cuts.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'shelter-funding-cuts'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Doug Ford has systematically cut funding for Ontario's homeless shelter and housing programs while homelessness has surged across the province. His 2019 budget slashed $550 million annually from affordable housing and homelessness prevention. In 2022 he quietly cut $268 million from homelessness programs while announcing a fake "$25 million boost." By 2025, his government gutted the Canada-Ontario Housing Benefit for Toronto by 80% — from $38 million to $7.95 million — eliminating the most effective tool for moving people out of shelters and into housing. Rather than build capacity, Ford's response was to criminalize homelessness: his Safer Municipalities Act threatens homeless people with fines up to $10,000 and jail time, while he pledged to invoke the notwithstanding clause to override any court protection for people living outside. Some 12,000 people are in Toronto's shelter system alone.`

  const summary = `<p>Since taking office in 2018, Doug Ford's government has pursued a consistent pattern: cut the programs that prevent and alleviate homelessness, let the visible crisis grow, then respond to the crisis with punitive legislation that criminalises the people most harmed by the cuts. His 2019 budget cut access to affordable housing, income support, and homelessness prevention by $550 million per year. Toronto City Manager Chris Murray warned city council that the cuts "would increase the strain on municipal services, including its family shelter system." Service providers across Ontario warned the changes to social assistance would push more people onto the streets — and they were right.</p>
<p>In March 2022, the Ford government announced what it claimed was a "$25 million boost" to homelessness programs. In reality, it had quietly merged multiple programs — the Community Homelessness Prevention Initiative, Home for Good, the Strong Communities Rent Supplement Program, and the Indigenous Supportive Housing Program — into a single consolidated allocation of $494 million per year. The combined programs had received $762 million under the 2021-22 budget. The NDP called it a "sneaky cut" of $268 million — a 35% real-dollar reduction presented publicly as a funding increase. Critics noted this mirrored the Ontario Liberals' 2012 tactic of folding five homelessness programs into one with less total money.</p>
<p>The Canada-Ontario Housing Benefit (COHB) — widely described by shelter operators and city officials as the single most effective tool for moving people out of shelters and into stable housing — was progressively defunded. Toronto's COHB allocation was $38 million in 2024. It was cut to $19.75 million in 2025. In September 2025, the province informed Toronto its allocation for 2026 would be just $7.95 million — an 80% cut from 2024 levels. By October 2025, Toronto had been told it could only allow 40 more households to move from shelter into housing before all COHB funding ran out — right as temperatures dropped and shelter demand rose. Mayor Olivia Chow warned this would leave Toronto facing higher taxes or service cuts, with no good options: "We can either stop sheltering refugee claimers, leave them on the street, which will make homelessness worse — or Torontonians will have to pay for it through their property taxes. Neither is fair."</p>
<p>Ford's response to the visible growth in encampments driven by his own funding cuts was to announce legislation to clear them. In December 2024, he introduced the Safer Municipalities Act, 2024 and the Restricting Public Consumption of Illegal Substances Act, 2024 — giving police new powers to dismantle encampments and imposing fines up to $10,000 and six-month jail sentences for repeat public drug use. Before the legislation even passed, Ford pledged to invoke the notwithstanding clause to override the Canadian Charter of Rights and Freedoms if courts tried to protect homeless people's right to shelter or be outdoors. Opposition Liberal Leader Bonnie Crombie said the bill amounted to "criminalising" homeless people. Critics noted Ford was making it illegal to be homeless rather than funding the housing that would end the crisis.</p>`

  const why_it_matters = `<p>Ontario is in a homelessness crisis that the Ford government's own cuts deepened. Toronto's shelter system houses approximately 12,000 people on any given night — a figure that has ballooned since Ford took office. Waitlists for affordable and supportive housing stretch into years. The COHB, the mechanism specifically designed to move people from shelters into permanent housing and free up shelter space for the next wave of people on the street, has been defunded to the point of near-irrelevance. Toronto's request for $54 million to allow 300 households per month to secure permanent housing was rejected; the province gave them enough for 40 households before the cold season.</p>
<p>The consequences fall hardest on those already most vulnerable. Encampments — the direct result of insufficient shelter capacity and unaffordable housing — became more visible. Ford's answer was legislation to forcibly dismantle them, pushing the people inside them further from services, from the health care they need, and from the support systems that could help. The notwithstanding clause threat — deployed against homeless people rather than corporations or foreign actors — represents an extraordinary use of a constitutional override mechanism to remove the last legal protection vulnerable Ontarians had from government-sanctioned displacement.</p>
<p>Housing advocates, shelters, municipalities, and service providers have been consistent: you cannot clear an encampment without first providing somewhere for people to go. Ford has not provided that somewhere. His government cut the benefit that created it, slashed the programs that funded it, and announced legislation to make it illegal to live outside without it. The math does not change because the politics demand it.</p>`

  const rippling_effects = `<p>The effects of Ford's shelter funding cuts are spread across Ontario but concentrated in urban centres where the unhoused population is most visible. Toronto has borne the largest share: 12,000 people in shelters, COHB funding reduced by 80%, encampments growing in parks and under overpasses, and a mayor left to choose between hiking property taxes and leaving people outside in winter. Hamilton, Ottawa, London, and Windsor have all seen shelter capacity strained as provincial funding was cut. Municipalities have had to choose between raising local taxes to compensate for provincial withdrawal or reducing services elsewhere.</p>
<p>The Safer Municipalities Act has drawn legal challenges. The Canadian Civil Liberties Association and shelter advocates have argued the legislation criminalises homelessness in violation of the Charter's protections against cruel and unusual treatment. Ford's pre-emptive notwithstanding clause pledge means those challenges may be moot — but also that Ford is prepared to constitutionally insulate punitive homelessness law from judicial review. That precedent extends beyond homeless people: it signals the province's willingness to use the override mechanism to immunise any policy from rights-based challenge.</p>
<p>The long-run cost of inadequate housing is borne primarily by the health system, the justice system, and municipalities — not the provincial government that reduced prevention funding. Emergency room visits by unhoused people cost far more than a subsidised apartment. Incarceration for drug use in public costs more than a treatment bed. Ford has effectively downloaded the cost of his cuts onto hospitals, jails, and city budgets, while claiming provincial fiscal responsibility. Ontario's homelessness crisis will not be resolved by clearing encampments. It will be resolved by building homes, funding shelters, and maintaining the benefits that bridge the gap — exactly what Ford's government has spent seven years cutting.</p>`

  console.log('Inserting Shelter Funding Cuts scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Ford\'s Shelter Funding Cuts — Slashing Homelessness Programs While Criminalizing the People Left Behind'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2022-03-07'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: '2019 Ford Budget Cuts $550M Annually from Housing and Homelessness Prevention',
      status: 'Completed',
      description: `<p>Doug Ford's first budget in 2019 cut access to social programs including affordable housing, income support, and homelessness prevention by an estimated $550 million per year. The budget cut roughly $1 billion from the Ministry for Children, Community and Social Services over three years, with further savings through "operational efficiencies." Toronto City Manager Chris Murray warned in a note to city council that the cuts would "increase the strain on municipal services, including its family shelter system." Service providers warned the changes to social assistance — including new caps on how much income recipients could earn before losing benefits — would push more people into homelessness. Ministry for Municipal Housing and Affairs funding was cut by 25 percent overall.</p>`,
      url: 'https://globalnews.ca/news/5161588/ford-government-cutting-1-billion-social-services/',
    },
    {
      title: 'Ford Quietly Cuts $268M from Homelessness Programs While Claiming a $25M Boost (March 2022)',
      status: 'Completed',
      description: `<p>In March 2022, the Ford government announced it was consolidating homelessness programs into a new Homelessness Prevention Program with a "$25 million increase" in funding. In reality, the Community Homelessness Prevention Initiative, Home for Good, the Strong Communities Rent Supplement Program, and the Indigenous Supportive Housing Program had together received $762 million in 2021-22. The consolidated program received $494 million — a cut of $268 million, or 35%, presented publicly as an increase. The NDP called it a "sneaky cut" and noted it mirrored the Ontario Liberals' 2012 tactic of folding five homelessness programs into one with less overall funding. Service providers warned the cut would deepen the housing crisis at a time when shelter demand was rising and affordable housing construction had stalled.</p>`,
      url: 'https://www.ontariondp.ca/news/ndp-slams-ford-s-sneaky-cut-funding-homelessness-initiatives',
    },
    {
      title: 'Canada-Ontario Housing Benefit Cut 80% in Two Years — From $38M to $7.95M for Toronto (2025)',
      status: 'Completed',
      description: `<p>The Canada-Ontario Housing Benefit (COHB) helps people move from city shelters into permanent housing through a rent supplement, freeing up shelter beds for others. Toronto's COHB allocation was $38 million in 2024, was cut to $19.75 million in 2025, and on September 18, 2025, the province informed the City it would be just $7.95 million for 2026 — an 80% reduction from 2024. Toronto had fronted $4.815 million earlier in 2025 to help 570 households move into housing. Under the 2026 allocation, the province said the City could allow only 40 more households to make that transition — with all funds running out by end of October, right as winter shelter demand peaks. Mayor Olivia Chow requested an allocation of $54 million to allow 300 households per month to secure permanent housing. The province provided less than 15% of that request. Chow warned Torontonians faced higher property taxes or reduced services, and that the cuts would reverse progress made in reducing encampments.</p>`,
      url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/new-provincial-cuts-compound-torontos-shelter-system-crisis-warns-chow-11283376',
    },
    {
      title: 'Safer Municipalities Act: Ford Criminalises Homelessness, Pledges Notwithstanding Clause (December 2024)',
      status: 'Active legislation',
      description: `<p>In December 2024, with encampments growing across Ontario as a direct consequence of inadequate shelter capacity and defunded housing benefits, Premier Ford introduced the Safer Municipalities Act, 2024 and the Restricting Public Consumption of Illegal Substances Act, 2024. The legislation gives police new powers to dismantle homeless encampments and imposes fines up to $10,000 and six-month jail sentences for repeat public drug use. Before the bill passed, Ford pledged to invoke the notwithstanding clause to override any Charter of Rights court protection for people living outside if courts tried to "interfere." The Canadian Civil Liberties Association and legal advocates called the legislation unconstitutional. Opposition Liberal Leader Bonnie Crombie said it amounted to "criminalising" homeless people. Critics noted Ford was making it illegal to be homeless in a province where his own government had cut the housing programs that could have prevented the crisis, and where shelter beds were already insufficient to house everyone outside.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/encampments-legislative-powers-ontario-notwithstanding-1.7401919',
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
    { title: 'Global News — Ford government cutting $1B from social services over 3 years (2019)', url: 'https://globalnews.ca/news/5161588/ford-government-cutting-1-billion-social-services/' },
    { title: 'Ontario NDP — Ford\'s sneaky cut to funding for homelessness initiatives (2022)', url: 'https://www.ontariondp.ca/news/ndp-slams-ford-s-sneaky-cut-funding-homelessness-initiatives' },
    { title: 'The Trillium — New provincial cuts will compound Toronto\'s shelter system crisis, warns Chow (2025)', url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/new-provincial-cuts-compound-torontos-shelter-system-crisis-warns-chow-11283376' },
    { title: 'CBC — Ford pledges tough new legislation to dismantle homeless encampments (2024)', url: 'https://www.cbc.ca/news/canada/toronto/encampments-legislative-powers-ontario-notwithstanding-1.7401919' },
    { title: 'CBC — Stiffer penalties for trespassing, public drug use in Ontario bill aimed at ending encampments', url: 'https://www.cbc.ca/news/canada/toronto/ford-homeless-encampments-drug-use-housing-ontario-1.7408376' },
    { title: 'CBC — Ontario anti-encampment law punishes the homeless, avoids long-term solutions: critics', url: 'https://www.cbc.ca/news/canada/toronto/ontario-encampment-law-1.7555659' },
    { title: 'Press Progress — Doug Ford\'s Changes to Social Assistance Will Push Ontarians Into Homelessness (2019)', url: 'https://pressprogress.ca/doug-fords-changes-to-social-assistance-will-push-ontarians-into-homelessness-service-providers-warn/' },
    { title: 'Press Progress — Doug Ford Quietly Planning Over $100 Million in Cuts to Housing and Rent Support Programs', url: 'https://pressprogress.ca/doug-ford-is-quietly-planning-over-100-million-in-cuts-to-housing-and-rent-support-programs/' },
    { title: 'CBC — Ontario spending on homelessness \'stagnate\' while problem worsens (2026)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-election-homelessness-report-1.7459204' },
    { title: 'Global News — Dollars and cents: Ontario homelessness spend balloons as community housing craters', url: 'https://globalnews.ca/news/10442251/ontario-homelessness-spend-increase-community-housing-decrease/' },
    { title: 'CMHA Brant Haldimand Norfolk — Issue Note: Ford\'s Encampment Legislation', url: 'https://bhn.cmha.ca/issue-note-fords-encampment-legislation/' },
    { title: 'City of Toronto — Cuts to Federal and Provincial Support for Housing (2025 Budget Notes)', url: 'https://www.toronto.ca/legdocs/mmis/2025/ex/bgrd/backgroundfile-258825.pdf' },
    { title: 'The Conversation — Ontario government\'s shameful snub of affordable housing', url: 'https://theconversation.com/the-ontario-governments-shameful-snub-of-affordable-housing-116132' },
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
      date: '2019-04-11',
      label: 'Ford\'s first budget cuts $550M/year from affordable housing and homelessness prevention',
      icon: 'AlertTriangle',
    },
    {
      date: '2022-03-07',
      label: 'Ford quietly cuts $268M from homelessness programs while claiming a "$25M boost"',
      icon: 'AlertTriangle',
    },
    {
      date: '2024-01-01',
      label: 'COHB funding for Toronto begins multi-year 80% cut: $38M → $19.75M → $7.95M by 2026',
      icon: 'AlertTriangle',
    },
    {
      date: '2024-12-12',
      label: 'Ford introduces Safer Municipalities Act to criminalize homeless encampments; pledges notwithstanding clause',
      icon: 'Gavel',
    },
    {
      date: '2025-09-18',
      label: 'Province tells Toronto its COHB allocation drops to $7.95M — only 40 more households can access housing before winter',
      icon: 'AlertTriangle',
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

  console.log('\n🎉 Shelter Funding Cuts scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
