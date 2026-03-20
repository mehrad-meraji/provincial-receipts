/**
 * Update script: Expand the Project South / TPS Corruption scandal to include
 * the full personal history and family angles — hashish dealing allegations,
 * Ford family criminal orbit, Dave Haynes son-in-law misconduct.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/update-police-scandal-full.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'project-south-tps-corruption'

  const row = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (row.length === 0) {
    console.error(`❌ Scandal not found: ${slug}`)
    process.exit(1)
  }
  const scandalId = row[0].id
  const now = new Date().toISOString()
  console.log(`Found scandal id: ${scandalId}`)

  // ── Update core text fields ──────────────────────────────────────────────

  const newTitle = 'Doug Ford, the Ford Family & Toronto Police — Hashish Allegations, Organized Crime Ties, and Project South'

  const newTldr = `An 18-month Globe and Mail investigation found ten sources — including former suppliers and street-level dealers — describing Doug Ford as a mid-level hashish dealer in Etobicoke for roughly seven years in the 1980s. Ford denied it and was never charged. His brother Rob Ford's crack cocaine scandal exposed ties to the Dixon City Bloods gang, wiretapped by Toronto Police in Project Traveller. Ford's longtime friend Sandro Lisi — alleged extortionist attempting to recover the crack video — denied ever being known by Doug, despite working on the 2010 mayoral campaign Doug co-managed. As Premier, Ford appointed his personal friend Ron Taverner as OPP Commissioner (reversed after the deputy who raised alarms was fired), and his son-in-law Dave Haynes faces 12 Toronto Police misconduct charges while Ford serves as Premier. In February 2026, seven TPS officers were charged with selling live police intelligence to organized crime — enabling shootings, extortion, and trafficking. Ford's response: "There's always a few bad apples."`

  const newSummary = `<p>On May 25, 2013, the Globe and Mail published a major investigation by reporters Greg McArthur and Shannon Kari, the product of 18 months of reporting: ten sources — including two former hashish suppliers, three street-level dealers, and casual users — described Doug Ford as a mid-level hash dealer in Etobicoke for approximately seven years, ending around 1986 when he was 22. James Gardens park in central Etobicoke was repeatedly cited; sources described the location as a "hash drive-thru" by nightfall. Ford sold to users but also to dealers above street level, supplying a select network that redistributed across the neighbourhood. Doug Ford denied every allegation — "a lie, an outright lie" — and his lawyer called them false. The Globe's editor-in-chief published a separate letter explaining why the paper stood behind the reporting. No criminal charges have ever been laid against Doug Ford. The story remains unretracted.</p>
<p>The family context is extensive. Brother Randy Ford was charged in connection with a drug-related kidnapping. Sister Kathy Ford was the victim of drug-related gun violence. Brother Rob Ford, whose 2010 Toronto mayoral campaign Doug co-managed, was found to have appeared in a crack cocaine video with members of the Dixon City Bloods gang in Etobicoke. Toronto Police's Project Traveller — a guns-and-drugs investigation targeting that gang — produced wiretaps capturing approximately 50 conversations about Rob Ford on the day the crack video story broke publicly in May 2013. Sandro Lisi, Rob Ford's friend and occasional driver, was charged with extortion in October 2013 for allegedly attempting to recover the crack video in exchange for marijuana. In response to Lisi's arrest, Doug Ford stated publicly: "I don't know this guy. Never seen him, never met him — ever." Yet Lisi had worked on Rob Ford's 2010 mayoral campaign — the campaign Doug co-managed. The extortion charge against Lisi was withdrawn May 8, 2015, the same day the crack video was publicly released.</p>
<p>As Premier, the pattern continued. In November 2018, Ford appointed personal friend Ron Taverner — a Toronto Police superintendent — as OPP Commissioner, quietly amending the job posting requirements to allow Taverner's application. OPP Deputy Commissioner Brad Blair went public with allegations of political interference; he was fired in March 2019 after a 32-year career, days after raising alarms. Taverner withdrew. That scandal is documented separately. Ford's son-in-law, TPS officer Ernest "Dave" Haynes — husband of Krista Ford Haynes (Doug's daughter) — faces 12 Police Act misconduct charges: forwarding confidential internal police emails to outside parties (including Krista), posting about police operations on social media, and sending a mass email to hundreds of TPS colleagues criticising department leadership. His wife launched a GoFundMe in January 2025 seeking $100,000 for his legal defence. Tribunal proceedings are ongoing as of early 2026. Doug Ford has offered no public comment on his son-in-law's misconduct charges.</p>
<p>Then came Project South. In June 2025, York Regional Police launched a major investigation after uncovering a conspiracy to murder a corrections official. On February 5, 2026, they announced charges against seven serving TPS officers and one retired member. The allegation: the officers unlawfully accessed confidential police databases — informant identities, surveillance operation logs, real-time GPS tracking data, arrest intelligence — and sold that information to organized crime figures in exchange for bribes. The intelligence they provided was used to carry out at least seven shootings, extortion, commercial robberies, and drug trafficking. Twenty-seven individuals in total face charges. Ontario ordered a province-wide policing investigation. Doug Ford's response: "It's very disturbing, but there's always a few bad apples."</p>`

  const newWhyItMatters = `<p>Doug Ford became Premier of Ontario in 2018, five years after the Globe and Mail published its drug-dealing investigation — and without having meaningfully answered its specific allegations. Unlike most political corruption stories about policy decisions or government contracts, the underlying allegation here goes to who Doug Ford was before public life, and whether that history has shaped his reflexive defensiveness toward police accountability. Ontario's voters elected him Premier in 2018 and re-elected him in 2022 and 2024 without the allegations being publicly re-litigated or answered in detail. The reporting stands, unretracted, from one of Canada's most established newspapers.</p>
<p>The most substantiated scandal directly involving Ford as Premier remains the OPP Taverner appointment — documented separately — where Ford nominated a personal friend to command the provincial police force, quietly changed the job requirements to allow his application, and fired the deputy who raised alarms. In that case, Ford accused police brass of conducting "political payback" against his brother. The instinct was to protect the institution from accountability when it suited him — and to attack it when it didn't.</p>
<p>Project South is categorically more serious. Seven officers didn't bend a rule — they allegedly sold the identities of confidential informants and live surveillance data to people who used it to commit shootings. Informant exposure is among the most dangerous forms of police breach: those individuals trusted the justice system with their safety. The question of how seven officers were able to export sensitive operational data without detection for long enough to enable seven shootings is a systemic question — one that belongs to the government responsible for policing standards in Ontario. "A few bad apples" is not just inadequate. It is the wrong analytical frame for what Project South describes: seven officers, one retired officer, twenty-seven interconnected individuals, and a network that apparently operated long enough to facilitate multiple acts of violence.</p>
<p>The thread connecting all of this is not proof of any single criminal act — it is a pattern of proximity and reflexive deflection. Ford's personal history, his family's entanglement with Toronto's drug trade and organised crime-adjacent figures, his own political appointments to police leadership, his son-in-law's active misconduct proceedings, and his government's non-response to the largest TPS corruption scandal in a generation all exist in the same story. Each element has its own evidentiary weight. Taken together they describe a Premier whose relationship with police accountability has been consistently shaped by personal interest rather than public obligation.</p>`

  const newRipplingEffects = `<p>The Globe and Mail's 2013 drug-dealing investigation set a precedent that has never been resolved: serious allegations about Doug Ford's personal conduct were published, denied, never disproven, and never the subject of criminal proceedings. No correction or retraction has been issued. The story is a matter of public record.</p>
<p>Project South's implications are ongoing. Seven officers inside TPS were allegedly selling live operational intelligence to organised crime. Those officers had access to confidential informant files, surveillance operations, arrest records, and real-time location data. The criminal cases will proceed through Ontario courts for years. The victims of the seven shootings allegedly enabled by leaked police data have no guarantee of justice until the full scope of the corruption is mapped. The province-wide policing audit — prompted by Project South — represents an acknowledgment that what happened inside TPS may not be isolated. That investigation was not initiated by the Ford government. It was driven by investigators responding to the evidence.</p>
<p>Dave Haynes' misconduct proceedings, still active as of early 2026, sit in an unusual political position: the Premier's son-in-law is before a police disciplinary tribunal for leaking confidential material while the Premier's government is simultaneously responsible for policing governance in Ontario. Ford has not addressed this publicly. The tribunal proceedings will eventually conclude. The silence from the Premier's office will remain on the record regardless of outcome.</p>
<p>Ford's "few bad apples" response defines the ceiling of accountability his government is willing to enforce. For the officers and community members who depend on the integrity of Ontario's police intelligence systems — and for informants whose safety depends on those systems being airtight — that ceiling matters.</p>`

  await sql`
    UPDATE "Scandal"
    SET
      title = ${newTitle},
      tldr = ${newTldr},
      summary = ${newSummary},
      why_it_matters = ${newWhyItMatters},
      rippling_effects = ${newRipplingEffects},
      "updatedAt" = ${now}
    WHERE id = ${scandalId}
  `
  console.log('✅ Scandal text fields updated')

  // ── Add missing legal actions ────────────────────────────────────────────

  const newLegalActions = [
    {
      title: 'Globe and Mail Investigation: Doug Ford Alleged to Have Dealt Hashish in Etobicoke, 1979–1986 (May 2013)',
      status: 'No Charges Laid',
      description: `<p>Reporters Greg McArthur and Shannon Kari published a major investigation on May 25, 2013, based on 18 months of reporting. Ten sources — including two former hashish suppliers, three street-level dealers, and casual users — described Doug Ford as a mid-level hashish dealer in Etobicoke for approximately seven years, ending around 1986. The location cited most frequently was James Gardens park in central Etobicoke. Sources described Ford as selling not only to users but to dealers above street level, supplying a distribution network. The Globe put the allegations to Ford in writing before publication; his lawyer called them false. Doug Ford publicly called them "a lie, an outright lie." The Globe's editor-in-chief published a separate letter explaining why the paper chose to publish. No criminal charges have ever been laid against Doug Ford in connection with these allegations. The story remains unretracted by the Globe and Mail.</p>`,
      url: 'https://www.theglobeandmail.com/news/toronto/globe-investigation-the-ford-familys-history-with-drug-dealing/article12153014/',
    },
    {
      title: 'Project Traveller (Dixon City Bloods) and Project Brazen 2 — Ford Family Proximity to Organised Crime Investigation (2013)',
      status: 'Completed',
      description: `<p>Toronto Police's Project Traveller was a guns-and-drugs investigation targeting the Dixon City Bloods gang in Etobicoke. Wiretaps from Project Traveller captured approximately 50 conversations about Rob Ford on the day the crack cocaine video story broke publicly in May 2013; the gang was alleged to possess the video. Sandro Lisi — Rob Ford's friend and occasional driver — was charged in October 2013 with extortion for allegedly attempting to recover the crack video. Doug Ford publicly stated he had "never seen, never met" Lisi — yet Lisi had worked on Rob Ford's 2010 mayoral campaign, which Doug co-managed. Project Brazen 2, a Toronto Police surveillance operation targeting Rob Ford, prompted Doug Ford to accuse police of conducting "political payback" when investigators attempted to serve Rob Ford a legal subpoena. The extortion charge against Lisi was withdrawn May 8, 2015, the same day the crack video was publicly released. Approximately 60 individuals were arrested in Project Traveller.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/how-the-rob-ford-investigation-has-unfolded-1.2325422',
    },
    {
      title: 'Dave Haynes (Ford Son-in-Law) — 12 Toronto Police Misconduct Charges (2024–Ongoing)',
      status: 'Ongoing',
      description: `<p>Ernest "Dave" Haynes, a Toronto Police Service officer and husband of Krista Ford Haynes (Premier Doug Ford's daughter), faces 12 counts under the Police Services Act: discreditable conduct, breach of confidence, and insubordination. Allegations include forwarding confidential internal police emails to outside parties including Krista Ford Haynes, posting about police operations and internal matters on social media, and sending a December 2023 mass email to hundreds of TPS colleagues at Divisions 22 and 31 criticising department leadership and morale. His lawyer characterised him as a whistleblower facing retaliation. In January 2025, Krista Ford Haynes launched a GoFundMe seeking $100,000 for his legal defence costs. Tribunal proceedings were ongoing in early 2026. Doug Ford, as Premier and the officer's father-in-law, has offered no public comment on the charges.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/dave-haynes-krista-ford-charges-1.7467904',
    },
  ]

  for (const la of newLegalActions) {
    // Check if already exists by title
    const existing = await sql`
      SELECT id FROM "LegalAction"
      WHERE "scandalId" = ${scandalId} AND title = ${la.title}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Skip (exists): ${la.title.substring(0, 60)}...`)
      continue
    }
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${laId}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, ${now}, ${now})
    `
    console.log(`  ✅ Legal action: ${la.title.substring(0, 70)}...`)
  }

  // ── Add missing sources ──────────────────────────────────────────────────

  const newSources = [
    { title: 'Globe and Mail — The Ford Family\'s History with Drug Dealing (May 25, 2013)', url: 'https://www.theglobeandmail.com/news/toronto/globe-investigation-the-ford-familys-history-with-drug-dealing/article12153014/' },
    { title: 'Globe and Mail — Editor\'s Letter: Why We Published the Ford Family Story', url: 'https://www.theglobeandmail.com/community/editors-letter/editors-letter-why-we-published-the-ford-family-story/article12152740/' },
    { title: 'Globe and Mail — Doug Ford Disputes Drug Dealing Report', url: 'https://www.theglobeandmail.com/news/toronto/doug-ford-disputes-globe-report-on-family-family-with-drug-dealing/article12156831/' },
    { title: 'Global News — Doug Ford Calls Drug Trade Allegations "Sleazy Journalism"', url: 'https://globalnews.ca/news/589636/doug-ford-calls-drug-trade-allegations-sleazy-journalism/' },
    { title: 'CBC — Sandro Lisi: Who Is Rob Ford\'s Friend and Driver', url: 'https://www.cbc.ca/news/canada/toronto/sandro-lisi-who-is-rob-ford-s-friend-and-driver-1.2304355' },
    { title: 'CBC — Rob Ford to Be Served Subpoena; Doug Ford Calls It Police "Payback"', url: 'https://www.cbc.ca/news/canada/toronto/rob-ford-to-be-served-subpoena-doug-ford-calls-it-police-payback-1.2725046' },
    { title: 'CBC — How the Rob Ford Investigation Unfolded (Projects Traveller and Brazen 2)', url: 'https://www.cbc.ca/news/canada/toronto/how-the-rob-ford-investigation-has-unfolded-1.2325422' },
    { title: 'Globe and Mail — Dixon City Bloods Discussed Ford Video, Wiretaps Reveal', url: 'https://www.theglobeandmail.com/news/toronto/more-evidence-in-rob-ford-investigation-in-the-hands-of-a-judge-today/article17716010/' },
    { title: 'CBC — Doug Ford\'s Son-in-Law Facing Police Misconduct Charges', url: 'https://www.cbc.ca/news/canada/toronto/dave-haynes-krista-ford-charges-1.7467904' },
    { title: 'Barrie Today — Doug Ford\'s Son-in-Law Testifies at TPS Tribunal', url: 'https://www.barrietoday.com/police-beat/doug-ford-son-in-law-dave-haynes-testifies-misconduct-charges-tps-tribunal-11883785' },
  ]

  for (const src of newSources) {
    const existing = await sql`
      SELECT id FROM "ScandalSource"
      WHERE "scandalId" = ${scandalId} AND url = ${src.url}
      LIMIT 1
    `
    if (existing.length > 0) {
      console.log(`⚠️  Skip (exists): ${src.title.substring(0, 60)}...`)
      continue
    }
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 70)}...`)
  }

  // ── Add timeline events ──────────────────────────────────────────────────

  const timelineEvents = [
    {
      date: '2013-05-25',
      label: 'Globe and Mail: ten sources describe Doug Ford as a mid-level hash dealer in 1980s Etobicoke',
      icon: 'Newspaper',
    },
    {
      date: '2013-10-01',
      label: 'Sandro Lisi charged with extortion over Rob Ford crack video; Doug Ford claims he never knew him',
      icon: 'Gavel',
    },
    {
      date: '2026-02-05',
      label: 'Seven TPS officers charged with selling police intelligence to organized crime (Project South)',
      icon: 'Gavel',
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
    console.log(`  ✅ Timeline event: ${evt.date} — ${evt.label.substring(0, 55)}...`)
  }

  console.log('\n🎉 Scandal updated with full personal history and family angles.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
