/**
 * Seed script: Project South — Toronto Police Corruption & Ford's "Few Bad Apples" Response
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-toronto-police-corruption.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'project-south-tps-corruption'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Seven Toronto Police Service officers were charged in February 2026 with unlawfully selling confidential police intelligence — informant identities, surveillance logs, real-time location data — to organized crime figures in exchange for bribes. That intelligence was used to carry out at least seven shootings, extortion, commercial robberies, and drug trafficking. Ontario ordered a province-wide policing investigation. Premier Doug Ford's response: "There's always a few bad apples." His government announced no inquiry, no reform, and no accountability measures. It is the largest policing corruption scandal in Ontario in a generation.`

  const summary = `<p>In June 2025, York Regional Police launched Project South after uncovering a conspiracy to murder a corrections official. What investigators found went far beyond a single plot. On February 5, 2026, York Regional Police announced charges against seven serving Toronto Police Service officers and one retired TPS member. The allegation: the officers had been systematically accessing confidential police databases — informant identities, surveillance operation logs, real-time GPS tracking data, arrest intelligence — and selling that information to organized crime figures for cash.</p>
<p>The intelligence they provided was used operationally. Investigators attributed at least seven shootings, multiple extortion campaigns, commercial robberies, and drug trafficking operations to information leaked by the officers. Twenty-seven individuals in total faced charges across the interconnected criminal network. On March 4, 2026, the charged officers appeared in Ontario court. The scale of the breach — active officers feeding live operational intelligence to criminals who then used it to commit violence — prompted investigators to seek a province-wide policing investigation. Ontario ordered one.</p>
<p>Doug Ford's public response to the charges came the same day they were announced. Asked about seven Toronto Police officers allegedly enabling shootings by selling confidential data to organized crime, the Premier of Ontario said: "It's very disturbing, but there's always a few bad apples." His government announced no public inquiry, no legislative review of police data access controls, and no accountability framework for what had gone wrong inside TPS. The province-wide probe was ordered by investigators responding to the evidence — not by the government responsible for policing standards in Ontario.</p>`

  const why_it_matters = `<p>The Ford government's handling of Project South follows a consistent pattern: when confronted with evidence of failure inside Ontario's police services, the government minimises, deflects, and moves on. In 2018–2019, Ford appointed personal friend Ron Taverner to lead the OPP — quietly amending job requirements to allow his application, then watching as the deputy commissioner who raised alarms was fired. In that scandal, Ford accused police brass of "political payback" when investigators attempted to serve legal process on his brother. The instinct was to protect the institution from accountability rather than the public from the institution.</p>
<p>Project South is categorically more serious. Seven officers didn't bend a rule — they allegedly sold the identities of confidential informants and live operational surveillance data to people who used it to shoot people. Informant exposure is one of the most dangerous forms of police breach: those individuals trusted the justice system with their safety, and officers allegedly sold that trust for money. The criminal proceedings will establish guilt or innocence, but the question of how seven officers inside TPS were able to access and export sensitive operational data without detection is a systemic question — one that belongs to the government that funds, governs, and sets standards for Ontario policing.</p>
<p>"A few bad apples" is not just inadequate — it is the wrong analytical frame for what Project South describes. The "bad apples" metaphor implies isolated individual failure. Seven officers, one retired officer, and twenty-seven interconnected individuals suggest a network, not a handful of rogues. A government serious about police accountability would have announced an independent review of TPS data security and access protocols, examined whether similar vulnerabilities exist in other Ontario forces, and committed to structural reform. Ford did none of those things. He said "few bad apples" and the government moved on.</p>`

  const rippling_effects = `<p>The criminal proceedings against the charged officers and their alleged organized crime contacts will run through Ontario courts for years. The seven shootings allegedly enabled by leaked police intelligence represent lives altered by corruption that the justice system is now trying to untangle retroactively. Victims, witnesses, and informants whose identities may have been exposed face ongoing uncertainty about their safety.</p>
<p>The province-wide policing investigation ordered in response to Project South will map whether what happened inside TPS is isolated or indicative of broader vulnerabilities across Ontario's police forces. That investigation was not initiated by the Ford government — it was a response to the scale of what investigators found, driven by law enforcement, not by political leadership. Ontario's government has yet to announce what, if anything, it will do with the results of that probe.</p>
<p>Ford's "few bad apples" response has a cost beyond the immediate moment. It signals to Ontario's police services that the Premier's office will not examine structural failures in policing — that the government's default is deference to institutional self-description, not independent scrutiny. For the officers and community members who depend on the integrity of police intelligence systems, that signal matters. It defines the ceiling of accountability that Ontario's government is willing to enforce.</p>`

  console.log('Inserting Project South / TPS Corruption scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Project South — Toronto Police Corruption & Ford\'s "Few Bad Apples" Response'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2026-02-05'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Project South — Seven TPS Officers Charged with Selling Police Intelligence to Organized Crime (February 2026)',
      status: 'Ongoing',
      description: `<p>On February 5, 2026, York Regional Police announced charges against seven serving Toronto Police Service officers and one retired TPS member following the Project South investigation, launched in June 2025. Allegations: the officers unlawfully accessed confidential police databases — including informant identities, surveillance logs, real-time GPS tracking data, and arrest intelligence — and sold that information to organized crime figures in exchange for bribes. The leaked intelligence was used to carry out at least seven shootings, extortion, commercial robberies, and drug trafficking operations. Twenty-seven individuals in total face charges across the interconnected criminal network. Officers appeared in Ontario court on March 4, 2026. Criminal proceedings are ongoing. Ontario ordered a province-wide policing investigation in response to the scale of the breach.</p>`,
      url: 'https://globalnews.ca/news/11653820/toronto-police-officers-charged-corruption-organized-crime/',
    },
    {
      title: 'Province-Wide Policing Investigation Ordered — Government Silent on Reform (March 2026)',
      status: 'Ongoing',
      description: `<p>In response to Project South, Ontario ordered a province-wide investigation into police corruption and database access vulnerabilities across Ontario's police forces. The investigation was prompted by investigators and law enforcement — not initiated by the Ford government. Premier Doug Ford announced no public inquiry, no legislative review of police data security protocols, no whistleblower protection enhancements, and no accountability framework in response to the charges. His government's position, as stated publicly, was that the matter was one for the courts and for "a few bad apples" to answer for. Critics, legal experts, and opposition parties called the response wholly inadequate for the systemic nature of what Project South revealed.</p>`,
      url: 'https://globalnews.ca/news/11659179/toronto-police-corruption-investigation/',
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
    { title: 'Global News — Toronto Police Officers Charged with Corruption, Links to Organized Crime', url: 'https://globalnews.ca/news/11653820/toronto-police-officers-charged-corruption-organized-crime/' },
    { title: 'Global News — Ontario-Wide Probe on Police Corruption Ordered After TPS Charges', url: 'https://globalnews.ca/news/11659179/toronto-police-corruption-investigation/' },
    { title: 'Toronto Life — Ford Says "There\'s Always a Few Bad Apples" in Response to Police Corruption Arrests', url: 'https://torontolife.com/city/in-response-to-police-corruption-arrests-doug-ford-says-theres-always-a-few-bad-apples/' },
    { title: 'VOCM/CP24 — Seven Toronto Police Service Officers Charged with Corruption', url: 'https://vocm.com/2026/02/05/seven-toronto-police-service-officers-charged-with-corruption/' },
    { title: 'CBC — Doug Ford\'s Role in OPP Turmoil Raises Questions of Political Interference (Taverner context)', url: 'https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-povincial-police-opp-ron-taverner-1.5043447' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 70)}...`)
  }

  console.log('\n🎉 Project South / TPS Corruption scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
