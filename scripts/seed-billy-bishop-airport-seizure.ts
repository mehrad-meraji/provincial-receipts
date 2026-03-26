/**
 * Seed script: Billy Bishop Airport Seizure
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-billy-bishop-airport-seizure.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'billy-bishop-airport-seizure'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Doug Ford is using Bill 5's Special Economic Zone powers to seize the City of Toronto's land at Billy Bishop Airport and force through a jet expansion banned by the 1983 tripartite agreement — bypassing municipal consent, blocking thousands of planned Portlands homes, and benefiting a private terminal owner whose lobbyist is a former senior Ford aide.`

  const summary = `In February 2026, Premier Doug Ford began publicly pushing to expand Billy Bishop Airport to allow commercial jets — currently prohibited under the 1983 tripartite agreement between Canada, the City of Toronto, and the Toronto Port Authority. On March 23, 2026, Ford declared the airport Ontario's first Special Economic Zone under Bill 5 (the Protect Ontario by Unleashing our Economy Act, passed June 2025) and announced the province would introduce legislation to expropriate the City of Toronto's roughly 20% land stake, offering approximately $5 million per year in compensation. The plan overrides municipal governance, sidelines Toronto from a decades-old intergovernmental agreement, and stands to deliver a windfall for Nieuport Aviation — the private consortium that owns the airport's terminal — whose lobbyist, former Ford deputy chief of staff Mark Lawson, had been working both the province and the Ontario Place file simultaneously.`

  const why_it_matters = `<p>Billy Bishop Airport sits on land owned three ways: the federal Toronto Port Authority controls roughly 78%, Transport Canada holds about 2%, and the <strong>City of Toronto owns approximately 20%</strong>. That city stake has given Toronto a formal veto over major changes at the airport since the <a href="https://www.newswire.ca/news-releases/background-on-1983-tripartite-agreement-billy-bishop-toronto-city-airport-slot-allocation-process-nef-contour-restrictions-runway-safety-end-area-regulations-and-2009-bbtca-noise-study-512256961.html">1983 tripartite agreement</a> was signed — an agreement that explicitly banned jets, capped aircraft at 78-seat turboprops, and was recently extended to 2045. Ford's plan doesn't negotiate. It legislates Toronto out of the room and seizes the land, offering about $5 million per year in exchange.</p>

<p>At the centre of the conflict-of-interest concern is <strong>Mark Lawson</strong>, who served as Doug Ford's Deputy Chief of Staff and Head of Policy from 2019 to 2021. After leaving the Premier's Office, Lawson was retained by <strong>Nieuport Aviation Infrastructure Partners</strong> — the private consortium that owns the Billy Bishop passenger terminal, acquired from Porter Airlines for approximately $700 million in 2015 — to lobby the provincial government on the airport's future. At the same time, Lawson held the title of VP of Communications and External Relations at <strong>Therme Group Canada</strong>, the Austrian company receiving a 95-year lease at Ontario Place, the provincial development directly adjacent to Billy Bishop. A single former Ford aide, simultaneously lobbying for the two major beneficiaries of Ford's waterfront agenda, while his wife served as Chief of Staff for the Cabinet Office.</p>

<p>Federal Transportation Minister <strong>Steven MacKinnon</strong> stated clearly that future decisions "will require the consensus of all signatories to the tripartite agreement" — meaning Ontario's plan to legislate itself into Toronto's seat does not bind the federal government. Aviation is federal jurisdiction. Ford can grab the land, but he cannot unilaterally get jets in the air without Ottawa. That hasn't slowed him down. On March 9, 2026, he <a href="https://www.cp24.com/local/toronto/2026/03/09/ford-doubles-down-on-toronto-billy-bishop-expansion-plans-calls-island-residents-squatters/">dismissed Toronto Island residents as "squatters" and "one-percenters"</a>, mischaracterizing the one-time $60,000–$78,000 lease fee paid by roughly 260 homeowners as "$1 a year."</p>

<p>Mayor Olivia Chow called the plan <a href="https://www.nationalobserver.com/2026/03/23/news/toronto-fight-fords-plan-seize-island-airport">"unilateral action to grab city land without consulting Torontonians"</a> and raised safety concerns: under a Transport Canada deadline, runway buffer safety zones at Billy Bishop must be completed by July 2027 — a federal requirement separate from and predating the expansion push. Chow warned that planning for Ford's expansion must not compromise that safety work. Toronto City Council moved to formally oppose any unilateral expropriation of city land.</p>`

  const rippling_effects = `<p>The most concrete casualty of the Billy Bishop expansion may be housing. <a href="https://environmentaldefence.ca/2026/03/24/ontario-billy-bishop-special-economic-zone/">Environmental Defence found</a> that the Special Economic Zone designation — which overrides provincial and municipal planning law — would cap building heights in the western Portlands at roughly 15 storeys due to airport flight paths, eliminating the 19-to-46-storey towers planned for a mixed-income transit-oriented community. The result: <strong>approximately 14,000 planned homes blocked</strong> on a brownfield site where multiple governments have already invested $1.4 billion in infrastructure. Ford is using Bill 5 to simultaneously remove a city's ability to govern its own land and prevent the construction of thousands of homes in one of Canada's largest cities.</p>

<p>The Billy Bishop expansion is the <strong>first application of Bill 5's Special Economic Zone powers</strong> since the Act received royal assent in June 2025. Bill 5 allows the Lieutenant Governor in Council to exempt "designated projects" from any provincial Act, regulation, or instrument — including municipal by-laws — and bars lawsuits against the government and participants. The Narwhal's <a href="https://thenarwhal.ca/ontario-bill-5-explained/">detailed analysis of Bill 5</a> noted it also weakened the Endangered Species Act, replacing science-driven protections with cabinet discretion. Billy Bishop now serves as the proof of concept for this sweeping override authority: if it works here, expect it elsewhere.</p>

<p>First Nations communities have challenged Bill 5 broadly. Chief Donny Morris of Kitchenuhmaykoosib Inninuwug stated: "These lands are not Ontario's to do with as they wish. They are our ancestral lands." The province claims to have engaged with more than 130 First Nations on the general Special Economic Zone framework — but no specific, documented consultation specific to the Billy Bishop application has been reported. Transportation Minister Prabmeet Sarkaria stated planning would begin "pending consultations with Indigenous communities," a formulation that has not satisfied First Nations groups who argue Bill 5 itself strips away their rights regardless of what consultations occur afterward.</p>

<p>The broader democratic concern is this: Ford is using a law he passed to strip a city of land it owns, remove that city from an agreement it signed, and hand the resulting benefit to a private terminal operator whose lobbyist came directly from the Premier's Office. No competitive process. No municipal consent. No environmental assessment. Just a press conference at the airport and a bill to follow.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Billy Bishop Airport Seizure',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2026-03-23',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'First Nations Legal Challenge to Bill 5 (Protect Ontario by Unleashing our Economy Act)',
      status: 'active',
      url: 'https://thenarwhal.ca/ontario-bill-5-explained/',
      description: `<p>Multiple First Nations, including Kitchenuhmaykoosib Inninuwug, Attawapiskat First Nation, and Apitipi Anicinapek Nation, have launched or threatened legal action against Bill 5, the legislation under which Billy Bishop was declared Ontario's first Special Economic Zone. The nations argue the law extinguishes Indigenous consultation rights and allows the province to override treaties and Crown land obligations. The Billy Bishop SEZ designation — the first exercise of Bill 5's core powers — brings these challenges into direct relevance for the airport expansion.</p>`,
    },
  ]

  for (const la of legalActions) {
    const id = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, NOW(), NOW())
    `
  }
  console.log(`✅ ${legalActions.length} legal actions inserted`)

  // Sources
  const sources = [
    { url: 'https://www.cbc.ca/news/canada/toronto/ford-billy-bishop-takeover-9.7138456', title: "Ford says province will make Billy Bishop airport a 'special economic zone' — CBC News" },
    { url: 'https://www.theglobeandmail.com/politics/article-ford-confirms-plan-to-seize-land-from-toronto-to-expand-island-airport/', title: 'Ford confirms plan to seize land from Toronto to expand island airport — The Globe and Mail' },
    { url: 'https://www.theglobeandmail.com/canada/article-ford-mulls-taking-over-torontos-stake-in-billy-bishop-airport-as-he/', title: "Ford mulls taking over Toronto's stake in Billy Bishop airport — The Globe and Mail" },
    { url: 'https://www.cp24.com/local/toronto/2026/03/23/ontario-to-seize-ownership-of-toronto-island-airport-lands-and-declare-it-is-a-special-economic-zone/', title: 'Ontario to seize ownership of Toronto Island Airport lands and declare it a special economic zone — CP24' },
    { url: 'https://www.cp24.com/local/toronto/2026/03/09/ford-doubles-down-on-toronto-billy-bishop-expansion-plans-calls-island-residents-squatters/', title: "Ford doubles down on Billy Bishop expansion plans, calls island residents 'squatters' — CP24" },
    { url: 'https://www.cbc.ca/news/canada/toronto/toronto-port-authority-billy-bishop-toronto-city-airport-doug-ford-9.7118619', title: 'Toronto Port Authority supports Ford airport expansion plan — CBC News' },
    { url: 'https://www.cbc.ca/news/canada/toronto/ford-province-billy-bishop-takeover-9.7122427', title: 'Ford says Ontario government will take over Billy Bishop — CBC News' },
    { url: 'https://environmentaldefence.ca/2026/03/24/ontario-billy-bishop-special-economic-zone/', title: 'Ontario is Using the Airport Special Economic Zone to Block Housing — Environmental Defence' },
    { url: 'https://www.nationalobserver.com/2026/03/23/news/toronto-fight-fords-plan-seize-island-airport', title: "Toronto to fight Ford's plan to seize island airport — Canada's National Observer" },
    { url: 'https://nowtoronto.com/news/ford-calls-toronto-islands-residents-squatters-as-he-pushes-billy-bishop-expansion-but-a-local-group-is-pushing-back/', title: "Ford calls island residents 'squatters' as he pushes Billy Bishop expansion — NOW Toronto" },
    { url: 'https://thenarwhal.ca/ontario-bill-5-explained/', title: "Ontario's Bill 5, explained — The Narwhal" },
    { url: 'https://www.ola.org/en/legislative-business/bills/parliament-44/session-1/bill-5', title: 'Bill 5, Protect Ontario by Unleashing our Economy Act, 2025 — Legislative Assembly of Ontario' },
    { url: 'https://globalnews.ca/news/11709963/doug-ford-billy-bishop-expansion/', title: "Premier wants to see 'gold mine' airport expanded — Global News" },
  ]

  for (const s of sources) {
    const id = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)

  // Timeline events
  const timelineEvents = [
    {
      date: '2026-02-26',
      icon: 'Megaphone',
      label: 'Ford calls Billy Bishop a "gold mine," demands runway extension for jets',
    },
    {
      date: '2026-03-09',
      icon: 'AlertTriangle',
      label: "Ford calls Toronto Island residents 'squatters' while pushing airport expansion",
    },
    {
      date: '2026-03-23',
      icon: 'Flag',
      label: 'Province declares Billy Bishop a Special Economic Zone, announces seizure of City of Toronto land',
    },
  ]

  for (const evt of timelineEvents) {
    const id = cuid()
    await sql`
      INSERT INTO "TimelineEvent" (id, date, label, url, icon, type, published, "createdAt", "updatedAt")
      VALUES (${id}, ${evt.date}, ${evt.label}, ${'/scandals/' + slug}, ${evt.icon}, 'milestone', false, NOW(), NOW())
    `
  }
  console.log(`✅ ${timelineEvents.length} timeline events inserted`)

  console.log(`\n🎉 Scandal seeded at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
