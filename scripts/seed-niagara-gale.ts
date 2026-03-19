/**
 * Seed script: Niagara Amalgamation & Bob Gale / Mein Kampf Scandal
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-niagara-gale.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'niagara-amalgamation-gale'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ford appointed a former PC candidate as Niagara Region's chair to push amalgamation of its 12 municipalities — bypassing elections entirely. Within weeks, Bob Gale was aggressively lobbying to collapse Niagara into one or four cities. He resigned on March 12, 2026, after anti-racism advocates revealed he owned a signed copy of Adolf Hitler's Mein Kampf. Ford said he remains "keen" on amalgamation regardless.`

  const summary = `<p>When Niagara Regional Chair Jim Bradley died in late 2024, Ontario Municipal Affairs Minister Rob Flack did not allow an election. Instead, he directly <a href="https://news.ontario.ca/en/statement/1006885/province-appoints-bob-gale-as-new-chair-of-niagara-region" target="_blank" rel="noopener noreferrer">appointed Bob Gale</a> — a former PC candidate who ran for Ford's party in the Niagara Falls riding in 2022 and lost — as the region's new chair. The appointment gave the Ford government a proxy inside Niagara's own governance structure: a partisan ally positioned to reshape the region from within.</p>
<p>Gale wasted no time. Within weeks of his appointment, he was writing to Minister Flack and all 12 Niagara mayors advocating for collapsing the region's municipalities into either <a href="https://thepointer.com/article/2026-02-26/waste-abuse-and-a-culture-of-casualness-with-taxpayer-dollars-has-doug-ford-already-decided-on-a-4-city-or-even-1-city-future-for-niagara" target="_blank" rel="noopener noreferrer">one single city or four cities</a>. He described Niagara's governance as characterized by "waste, abuse and a culture of casualness with taxpayer dollars" — language that matched the Ford government's talking points almost precisely. Meanwhile, Ford publicly said any amalgamation was "up to the local mayors," but senior PC government sources told <a href="https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/niagara-politicians-debate-amalgamation-ahead-of-legislatures-return-11920753" target="_blank" rel="noopener noreferrer">The Trillium</a> they believed the province intended to legislate amalgamation regardless, as early as spring 2026.</p>
<p>Eight of Niagara's 12 mayors formally opposed the push, with several calling the process illegitimate and undemocratic. Niagara-on-the-Lake's council passed a formal submission stating: "Any proposal that would fundamentally change our municipality must have a clear legislative foundation, a transparent process, and meaningful public consultation. None of that has occurred." Regional council passed a motion directing Gale to halt further action on amalgamation while it conducted its own review.</p>
<p>Then, on the night of March 11, 2026, anti-racism advocates revealed that Gale owned a signed and authenticated copy of Adolf Hitler's <em>Mein Kampf</em>. <a href="https://thepointer.com/article/2026-03-12/amid-fury-over-heavy-handed-amalgamation-demand-embattled-niagara-chair-resigns-over-hitler-book" target="_blank" rel="noopener noreferrer">Gale resigned immediately</a>. The book, reportedly purchased at auction in 2010 and authenticated in 2018, had been in his possession throughout his time as a PC candidate, during his campaign appearances alongside Ford, and throughout his tenure as the province's appointee leading a major municipal restructuring effort.</p>`

  const why_it_matters = `<p>The Niagara episode is a condensed illustration of how the Ford government approaches democratic governance: bypassing elections when an unelected ally can advance the government's agenda; imposing top-down restructuring without adequate analysis, public consultation, or democratic mandate; and using provincial appointment power to install politically connected figures in positions of institutional authority.</p>
<p>The amalgamation push itself has no verified economic justification. Every independent expert who has commented on it has noted that municipal amalgamations in Ontario have a documented track record of <em>failing</em> to deliver promised savings. The Ford government's own experience with Peel Region is the most direct cautionary example: legislation dissolving Peel was passed in 2023, reversed in 2023 after the government's own transition board found it would cost <a href="https://www.cbc.ca/news/canada/toronto/ontario-government-transition-board-peel-dissolution-cost-tax-increases-1.7049940" target="_blank" rel="noopener noreferrer">$1.3 billion extra over 10 years</a> and trigger sharp tax increases. Ford cancelled the Peel dissolution — but is now pursuing the same model in Niagara, without conducting the analysis that proved fatal to the Peel plan.</p>
<p>The Ford government also suppressed a directly relevant independent study. In 2019, it commissioned Ken Seiling and Michael Fenn to conduct a regional governance review of 82 municipalities across Ontario — including Niagara — at a cost of $120,000 in public funds. The review received 8,500 written submissions from residents and stakeholders. The report was delivered to Minister Steve Clark in September 2019. The government then <a href="https://thepointer.com/article/2024-01-10/niagara-s-regional-government-could-see-major-impacts-as-province-reviews-the-system-slight-reductions-proposed-for-st-catharines-budget" target="_blank" rel="noopener noreferrer">permanently buried it</a>. Both advisors were required to sign non-disclosure agreements. The public paid for the research and cannot see it. Niagara Regional Council demanded its release in January 2024; the province refused. The Ford government now pushes amalgamation without disclosing the evidence base it collected at public expense.</p>
<p>The connection to developer interests is structural rather than directly documented in Niagara specifically. Ford's simultaneous "Destination Niagara" casino-tourism strategy — announced as a plan to draw 25 million visitors annually and generate $3 billion/year in GDP from a "Las Vegas of the North" development in Niagara Falls — requires massive construction and development approvals across multiple municipal jurisdictions. An amalgamated region with a single council and a Ford-friendly "strong mayor" would reduce the number of planning veto points from twelve to one, dramatically streamlining the approvals that ambitious development projects require.</p>`

  const rippling_effects = `<p>Gale's resignation did not end the amalgamation threat. Ford told reporters on March 17, 2026 — five days after Gale left — that he <a href="https://www.cp24.com/politics/queens-park/2026/03/17/ford-still-keen-on-niagara-amalgamations-plans-to-review-governance-in-the-region/" target="_blank" rel="noopener noreferrer">remains "keen" on Niagara amalgamations</a> and that his government plans to review regional governance. PC sources continued to suggest legislation could come in the spring 2026 sitting. The region now faces an indefinite period of uncertainty about its political future, with no elected chair, a contested governance review, and an absent democratic mandate for any restructuring — but ongoing provincial pressure to merge regardless.</p>
<p>The pattern in Niagara echoes Ford's approach to Toronto in 2018, when he unilaterally slashed Toronto city council from 47 to 25 seats mid-election — invoking the notwithstanding clause after an Ontario court ruled the move unconstitutional. It echoes the Peel dissolution (legislated, then reversed at the cost of years of chaos and administrative uncertainty). It echoes the broader use of "strong mayor" powers — now extended to over 169 Ontario municipalities — which allow mayors to override their own councils on provincial-priority matters. Each of these interventions reduces the number of elected voices, concentrates authority, and accelerates the speed at which development approvals can be obtained.</p>
<p>The Gale appointment also reveals a specific risk in how Ford uses provincial appointment powers: vetting appears to be cursory or political rather than substantive. A former PC candidate with a signed copy of Mein Kampf was appointed to reshape the governance of 500,000 people, in a region that includes large communities of Holocaust survivors and their descendants. The appointment process produced no public disclosure of his suitability, no conflict-of-interest review, and no public consultation. He was installed and began aggressively pursuing amalgamation before most Niagara residents were aware he had been appointed at all.</p>`

  console.log('Inserting Niagara Amalgamation / Bob Gale scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Niagara Amalgamation & the Bob Gale Appointment'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2025-12-01'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Ford Appoints Former PC Candidate as Niagara Regional Chair — Bypassing Election',
      status: 'Completed',
      description: `<p>In December 2024, following the death of Regional Chair Jim Bradley, Minister Rob Flack directly appointed Bob Gale — a former Ontario PC candidate who ran against NDP MPP Wayne Gates in Niagara Falls in 2022 — as the new Regional Chair, bypassing any democratic election or nomination process. The appointment gave the Ford government an ally inside Niagara's governance with a mandate to pursue the province's amalgamation agenda from within. Critics noted the appointment process had no transparency requirements, no conflict-of-interest review, and no mechanism for public input.</p>`,
      url: 'https://news.ontario.ca/en/statement/1006885/province-appoints-bob-gale-as-new-chair-of-niagara-region',
    },
    {
      title: 'Bob Gale Resigns After Mein Kampf Ownership Revealed',
      status: 'Completed',
      description: `<p>On the night of March 11, 2026, anti-racism advocates revealed that Niagara Regional Chair Bob Gale — Ford's direct appointee and the primary driver of the amalgamation push — owned a signed copy of Adolf Hitler's <em>Mein Kampf</em>, reportedly purchased at auction in 2010 and authenticated in 2018. Gale sent a resignation letter to Minister Flack effective immediately. The revelation came while Gale was already under fire for his heavy-handed amalgamation campaign and his defiance of a regional council motion directing him to halt further action. Anti-racism advocates described his resignation as a "relief." Ford's government offered no explanation of how the appointment process had failed to surface this information.</p>`,
      url: 'https://thepointer.com/article/2026-03-12/amid-fury-over-heavy-handed-amalgamation-demand-embattled-niagara-chair-resigns-over-hitler-book',
    },
    {
      title: 'Standing Committee on Regional Governance Hearings Abandoned Without Report',
      status: 'Completed',
      description: `<p>In January 2024, the Ontario Standing Committee on Heritage, Infrastructure and Cultural Policy held public hearings in six Ontario cities on regional governance. A promised second series of hearings never occurred — the legislature was dissolved ahead of the February 2025 election and no final committee report was ever tabled. The public process was abandoned mid-consultation. The same government then pursued amalgamation via unilateral appointment and legislative threats, having cancelled the democratic process designed to inform such decisions.</p>`,
      url: 'https://www.cbc.ca/news/canada/kitchener-waterloo/two-tier-regional-governance-review-committee-public-meetings-1.7039290',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${laId}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, ${now}, ${now})
    `
    console.log(`  ✅ Legal action: ${la.title}`)
  }

  const sources = [
    { title: 'Ontario Government — Appointment of Bob Gale as Niagara Regional Chair', url: 'https://news.ontario.ca/en/statement/1006885/province-appoints-bob-gale-as-new-chair-of-niagara-region' },
    { title: 'The Pointer — Has Ford already decided on a 4-city or 1-city future for Niagara?', url: 'https://thepointer.com/article/2026-02-26/waste-abuse-and-a-culture-of-casualness-with-taxpayer-dollars-has-doug-ford-already-decided-on-a-4-city-or-even-1-city-future-for-niagara' },
    { title: 'The Pointer — Gale resigns over Hitler book', url: 'https://thepointer.com/article/2026-03-12/amid-fury-over-heavy-handed-amalgamation-demand-embattled-niagara-chair-resigns-over-hitler-book' },
    { title: 'CP24 — Ford still keen on Niagara amalgamations (March 17, 2026)', url: 'https://www.cp24.com/politics/queens-park/2026/03/17/ford-still-keen-on-niagara-amalgamations-plans-to-review-governance-in-the-region/' },
    { title: 'CP24 — Resignation of Niagara politician who owns signed Mein Kampf a relief', url: 'https://www.cp24.com/local/niagara/2026/03/12/resignation-of-niagara-politician-who-allegedly-owns-signed-copy-of-mein-kampf-a-relief-anti-racism-advocate/' },
    { title: 'The Trillium — Niagara politicians debate amalgamation ahead of legislature return', url: 'https://www.thetrillium.ca/news/municipalities-transit-and-infrastructure/niagara-politicians-debate-amalgamation-ahead-of-legislatures-return-11920753' },
    { title: 'CBC — Niagara councillors tell Gale to put brakes on amalgamation', url: 'https://www.cbc.ca/news/canada/hamilton/niagara-region-motion-bob-gale-amalgamation-governance-review-9.7111534' },
    { title: 'CBC — Eight Niagara mayors sign letter opposing amalgamation', url: 'https://www.cbc.ca/news/canada/hamilton/doug-ford-niagara-amalgamation-9.7132965' },
    { title: 'CBC — Ontario abandons Peel Region dissolution after cost shock', url: 'https://www.cbc.ca/news/canada/toronto/peel-region-paul-calandra-1.7057628' },
    { title: 'CBC — Peel dissolution would cost $1.3B extra over 10 years: transition board', url: 'https://www.cbc.ca/news/canada/toronto/ontario-government-transition-board-peel-dissolution-cost-tax-increases-1.7049940' },
    { title: 'The Pointer — Niagara regional governance review', url: 'https://thepointer.com/article/2024-01-10/niagara-s-regional-government-could-see-major-impacts-as-province-reviews-the-system-slight-reductions-proposed-for-st-catharines-budget' },
    { title: 'Global News — Ford supportive of Niagara amalgamation, hoping for local plan', url: 'https://globalnews.ca/news/11701325/ontario-niagara-amalgamation-push/' },
    { title: 'Niagara-on-the-Lake Local — Bob Gale appointed as Niagara Regional Chair', url: 'https://www.notllocal.com/local-news/bob-gale-appointed-as-next-chair-of-niagara-regional-council-11644386' },
    { title: 'NOTL Local — Niagara-on-the-Lake formally opposes amalgamation', url: 'https://www.notllocal.com/local-news/niagara-on-the-lake-says-it-will-oppose-amalgamation-in-submission-to-province-11947918' },
    { title: 'CUPE Ontario — Condemns Niagara mayors water-for-power proposal', url: 'https://cupe.on.ca/cupe-ontario-condemns-niagara-mayors-water-for-power/' },
    { title: 'Ontario Destination Niagara official release', url: 'https://news.ontario.ca/en/release/1006861/ontario-building-destination-niagara' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 Niagara Amalgamation / Bob Gale scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
