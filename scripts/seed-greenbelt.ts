/**
 * Seed script: Greenbelt Scandal
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-greenbelt.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  // Simple cuid-like ID for seeding
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'the-greenbelt-scandal'

  // Check if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Premier Doug Ford secretly handed 15 parcels of protected Greenbelt farmland to well-connected developers through a three-week backroom process — a windfall worth $8.3 billion to those developers — and only reversed it after the Auditor General publicly exposed the scheme.`

  const summary = `In December 2022, the Ford government removed 7,400 acres from Ontario's legally protected Greenbelt in a rushed, secretive process that excluded planning experts and public consultation. A special investigation by the Auditor General of Ontario, published August 9, 2023, revealed that 95% of the parcels chosen for removal came directly from developer lobbying packages handed to Housing Minister Steve Clark's chief of staff, Ryan Amato. Developers stood to gain $8.3 billion in increased land value. After massive public backlash, resignations of two cabinet ministers, and an ongoing RCMP criminal investigation, Ford reversed the decision in September 2023 — but the political and legal fallout continues.`

  const why_it_matters = `<p>The Ontario <a href="https://en.wikipedia.org/wiki/Greenbelt_(Golden_Horseshoe)">Greenbelt</a> is a 2-million-acre ring of protected farmland, wetlands, and forests encircling the Greater Toronto Area — the largest protected greenbelt in the world and a critical defence against urban sprawl. The Ford government's 2022 decision to open 15 parcels for development was not random: it was designed in a <a href="https://www.auditor.on.ca/en/content/news/specials_newsreleases/ataglance_Greenbelt_EN.pdf">three-week process</a> that excluded the government's own land-use planning experts and relied almost entirely on packages submitted by well-connected private developers.</p>

<p>The Auditor General found that <a href="https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-greenbelt-report-1.6930390">95% of the parcels</a> were identified by Ryan Amato, chief of staff to Housing Minister Steve Clark — not by planners or civil servants — and that 92% of the total acreage came from packages handed to Amato by just two developers at a private industry event in September 2022. The process was, the AG wrote, <strong>not transparent, fair, objective, or fully informed</strong>.</p>

<p>The developers who owned 14 of the 15 parcels stood to gain <a href="https://www.auditor.on.ca/en/content/news/specials_newsreleases/ataglance_Greenbelt_EN.pdf">$8.3 billion in increased property value</a> — a public subsidy of staggering size with no benefit to Ontario taxpayers. Among the key beneficiaries: <strong>Silvio De Gasperis</strong> (TACC Developments), <strong>Michael Rice</strong> (Rice Group, who bought his parcels just weeks before the announcement), and <strong>Shakir Rehmatullah</strong> (Flato Developments), a self-described friend of the Premier.</p>

<p>Ford himself claimed he was unaware of Amato's central role — a claim widely disputed. <a href="https://www.thetrillium.ca/news/the-trillium-investigations/who-is-ryan-amato-the-political-staffer-at-the-centre-of-ontarios-greenbelt-scandal-7591776">The Integrity Commissioner's investigation</a> found Housing Minister Clark had violated ethics rules by delegating decision-making to Amato without oversight. <a href="https://www.cbc.ca/news/canada/toronto/rcmp-criminal-investigation-ford-greenbelt-1.6991595">The RCMP launched a criminal investigation</a> in October 2023 into whether the changes corruptly favoured certain developers — an investigation still ongoing as of early 2026.</p>

<p>Of the land removed: <a href="https://www.auditor.on.ca/en/content/news/specials_newsreleases/ataglance_Greenbelt_EN.pdf">83% was classified as prime agricultural land</a> — the highest-quality farmland in Ontario — and the changes eliminated environmental protections for approximately 404 hectares of woodlands and wetlands. Ontario already loses 319 acres of farmland per day; this decision would have accelerated that.</p>`

  const rippling_effects = `<p>The immediate political fallout was severe. <a href="https://www.cbc.ca/news/canada/toronto/housing-minister-chief-staff-integrity-commissioner-1.6932582">Housing Minister Steve Clark resigned</a> in September 2023 after the Integrity Commissioner found he had violated ethics rules. Days later, <strong>Kaleed Rasheed</strong>, Minister of Public and Business Service Delivery, also resigned over his own relationship with a Greenbelt developer. Ryan Amato, the staffer who orchestrated the land selection, resigned in August 2023 — but not before <a href="https://thenarwhal.ca/ontario-greenbelt-scandal-ryan-amato-payout/">receiving a full year's salary as severance</a> courtesy of Ontario taxpayers.</p>

<p>Ford reversed the Greenbelt changes on <strong>September 21, 2023</strong>, issuing a public apology — a rare moment of contrition from a premier who had spent months defending the policy. The legislature subsequently passed Bill 10, restoring the Greenbelt's original boundaries and requiring future changes to receive legislative approval. But legal challenges immediately followed: developer <strong>Minotar Holdings</strong> launched a constitutional challenge in December 2023, arguing the reversal was politically motivated and voided their legitimate land investments.</p>

<p>A <a href="https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251">$2.2-million civil lawsuit</a> filed in early 2025 alleges that Amato and fellow staffer Shiv Raj used "backchannel contacts" to promise fast-tracked rezoning approvals to a developer in exchange for $1.5 million — then failed to deliver. The lawsuit lifts the lid on what critics say was a broader culture of pay-to-play access in Ford's housing file.</p>

<p>The scandal has fundamentally damaged public trust in Ontario's land-use planning system, demonstrated that protected spaces are only as safe as the political will to defend them, and shown that a small circle of connected developers could reshape provincial policy through a few informal meetings. The <a href="https://globalnews.ca/news/11472355/rcmp-greenbelt-update/">RCMP investigation</a> — still active with no charges as of 2026 — hangs over the Ford government as it enters its third term.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'The Greenbelt Scandal',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2023-08-09',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'RCMP Criminal Investigation',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/rcmp-criminal-investigation-ford-greenbelt-1.6991595',
      description: `<p>In October 2023, the RCMP's <strong>Sensitive and International Investigations Unit</strong> — which handles financial crimes, fraud, corruption, and illegal lobbying by elected officials — opened a criminal investigation into whether the Ford government's Greenbelt changes corruptly favoured certain developers. As of early 2026, the investigation is ongoing. The RCMP has confirmed interviews with government witnesses have taken place but has not disclosed findings or laid any charges, citing the integrity of the investigation.</p>`,
    },
    {
      title: 'Ontario Integrity Commissioner Investigation — Steve Clark',
      status: 'settled',
      url: 'https://www.ontario.ca/page/office-integrity-commissioner-ontario',
      description: `<p>The Integrity Commissioner found that Housing Minister <strong>Steve Clark</strong> violated the Members' Integrity Act by improperly delegating his ministerial responsibilities to his chief of staff Ryan Amato without adequate oversight. Clark <a href="https://www.cbc.ca/news/canada/toronto/housing-minister-chief-staff-integrity-commissioner-1.6932582">resigned in September 2023</a> following the ruling. Amato himself was later subject to a separate Commissioner review; an April 2025 ruling compelled him to produce emails related to his Greenbelt communications or swear an affidavit that none exist.</p>`,
    },
    {
      title: 'Minotar Holdings Constitutional Challenge',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/michael-rice-auditor-general-greenbelt-1.6904603',
      description: `<p>In December 2023, <strong>Minotar Holdings</strong> filed a constitutional challenge in Ontario's Divisional Court against the <em>Greenbelt Statute Law Amendment Act</em> (Bill 10), which reinstated protections for the 15 parcels. Minotar argues the retroactive reversal is unjust, voids a legitimate 2017 settlement agreement, and improperly removes judicial review. If successful, it could expose the province to significant financial liability from other developers who purchased Greenbelt land in anticipation of its opening.</p>`,
    },
    {
      title: 'Civil Lawsuit: Amato & Raj Rezoning Scheme ($2.2M)',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251',
      description: `<p>A $2.2-million civil lawsuit filed in early 2025 alleges that former Ford staffers <strong>Ryan Amato</strong> and <strong>Shiv Raj</strong> leveraged their political connections to promise a developer fast-tracked rezoning approvals for three properties in exchange for $1.5 million in payments. The staffers allegedly failed to deliver the approvals. The lawsuit describes use of "backchannel contacts" and a broader transactional culture around housing approvals during Ford's tenure.</p>`,
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
    { url: 'https://www.auditor.on.ca/en/content/news/specials_newsreleases/ataglance_Greenbelt_EN.pdf', title: 'Special Report on Changes to the Greenbelt — Auditor General of Ontario (August 2023)' },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-greenbelt-report-1.6930390', title: "Ontario government's Greenbelt land swap influenced by well-connected developers, AG finds — CBC News" },
    { url: 'https://thenarwhal.ca/ontario-greenbelt-timeline-auditor-general-report/', title: "Doug Ford and Ontario's Greenbelt: a timeline — The Narwhal" },
    { url: 'https://www.cbc.ca/news/canada/toronto/rcmp-criminal-investigation-ford-greenbelt-1.6991595', title: "RCMP investigating Ontario government's plan to open Greenbelt land for development — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ont-greenbelt-timeline-1.6974715', title: "A timeline of key events in Ontario's Greenbelt controversy — CBC News" },
    { url: 'https://thenarwhal.ca/ontario-greenbelt-scandal/', title: "How Doug Ford's Greenbelt land swap backfired — The Narwhal" },
    { url: 'https://www.thetrillium.ca/news/the-trillium-investigations/who-is-ryan-amato-the-political-staffer-at-the-centre-of-ontarios-greenbelt-scandal-7591776', title: "Who is Ryan Amato, the political staffer at the centre of Ontario's Greenbelt scandal? — The Trillium" },
    { url: 'https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251', title: "Lawsuit alleges former Ford staffers promised to use 'backchannel contacts' to get land rezoned — CBC News" },
    { url: 'https://thenarwhal.ca/ontario-greenbelt-scandal-anniversary/', title: "A year after Ontario's Greenbelt scandal, what's changed? — The Narwhal" },
    { url: 'https://globalnews.ca/news/11472355/rcmp-greenbelt-update/', title: "RCMP's 'thorough' Greenbelt investigation reaches 2-year mark — Global News" },
  ]

  for (const s of sources) {
    const id = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Greenbelt scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
