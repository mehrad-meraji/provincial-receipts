/**
 * Seed script: Ron Taverner OPP Appointment
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-taverner.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ron-taverner-opp-appointment'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Within months of taking office, Doug Ford tried to install his personal friend and longtime family confidant as Ontario's top cop — quietly lowering the job qualifications to fit him, corrupting the hiring process through his own chief of staff, and spending $40,000 on an executive search that was effectively rigged from the start.`

  const summary = `In November 2018, the Ford government announced that Toronto Police Superintendent Ron Taverner — a 51-year veteran who had never risen above superintendent, and a decades-long personal friend of the Ford family from Etobicoke — would become Commissioner of the Ontario Provincial Police. The problem: Taverner didn't meet the job's minimum qualifications. Those qualifications had been quietly lowered two days after the original posting, apparently to fit him. Ford's chief of staff, Dean French, had fed Taverner's name directly to the cabinet secretary serving on the two-person hiring panel. Taverner also dined with one of his interviewers and with Ford himself before the selection was made. After an integrity commissioner investigation, a court challenge by the sitting OPP deputy commissioner, and sustained public outrage, Taverner withdrew in March 2019.`

  const why_it_matters = `<p>The Ontario Provincial Police is not just any police force. The OPP investigates <strong>organized crime, public corruption, and provincial government misconduct</strong>. The commissioner has enormous discretionary power over what gets investigated and how. The idea that a premier would attempt to install his personal friend in that role — someone who had been his family's Etobicoke police contact for decades — is not a minor breach of etiquette. It is a fundamental threat to the independence of law enforcement oversight.</p>

<p>Taverner had served as superintendent of Division 23 in Etobicoke, <a href="https://www.theglobeandmail.com/opinion/editorials/article-globe-editorial-it-bears-repeating-doug-fords-pal-ron-taverner/">the Ford family's political home base</a>, for much of his career. He publicly eulogized Rob Ford. His relationship with the Fords was not casual — it was deep and long-standing. Ford met with Taverner <a href="https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-povincial-police-opp-ron-taverner-1.5043447">at least three times</a> after taking office, while there is no evidence he met even once with any other candidate for the role.</p>

<p>The job posting itself was manipulated. The original OPP commissioner posting required candidates to hold the rank of <strong>deputy chief or assistant commissioner</strong> at minimum. Taverner had never risen above superintendent — two full ranks below that threshold. <a href="https://globalnews.ca/news/4754529/doug-ford-opp-ron-taverner-ombudsman-review/">The government lowered those requirements</a> two days after the original posting, saying it wanted to "attract a wider field." The only person who materially benefited from that change was Taverner.</p>

<p>The corruption of the process went deeper. Ford's chief of staff, Dean French, <a href="https://www.cbc.ca/news/canada/toronto/ont-opp-inquiry-taverner-ford-yarde-1.4950680">supplied Taverner's name</a> to cabinet secretary Steve Orsini, who sat on the two-person hiring panel. Text messages between French and Orsini showed what the Integrity Commissioner called "a tacit acknowledgment that Mr. French was rooting for Mr. Taverner's success" — meaning anyone reading those messages would have "serious doubts as to the fairness of the process." Taverner also dined with an interview panelist and with Ford himself before the selection was finalized. Ontario <a href="https://www.theglobeandmail.com/canada/article-ontario-paid-40000-search-hire-premier-fords-friend-ron-taverner/">paid $40,000</a> for an executive search firm that somehow produced a process leading to Taverner's selection.</p>

<p>All of this unfolded in the first months of Ford's government — before any of the other scandals. It established, at the outset, exactly what kind of premier Ontario had elected: one who treated the machinery of government as personal property to be deployed for friends and allies.</p>`

  const rippling_effects = `<p>The immediate damage was to the OPP itself. The sitting deputy commissioner, <strong>Brad Blair</strong>, was so alarmed by the appointment that he <a href="https://www.cbc.ca/news/canada/toronto/ron-taverner-opp-commissioner-court-1.4973909">went to court</a> seeking an Ombudsman review — a highly unusual step for a serving police officer. Blair argued the appointment process had been corrupted and that it undermined the independence of the province's top police force. His intervention was one of the most significant signs of how seriously the law enforcement community viewed the threat.</p>

<p>Taverner ultimately <a href="https://www.cbc.ca/news/canada/toronto/ron-taverner-withdraws-from-consideration-for-opp-commissioner-1.5046120">withdrew in March 2019</a>, stating he wanted to protect "the integrity of rank-and-file OPP officers" — an acknowledgment that his presence at the top of the force had become untenable. Ford appointed a new commissioner days later. The Integrity Commissioner's final report found Ford had not personally breached conflict of interest rules — he had been careful enough to stay formally at arm's length — but found the process was "flawed" with "troubling aspects," particularly French's intervention.</p>

<p>Dean French, the chief of staff who had engineered Taverner's candidacy, <a href="https://www.cbc.ca/news/canada/toronto/dean-french-resigns-1.5186053">resigned in June 2019</a> — not over Taverner directly, but after a separate patronage scandal involving the appointment of two former Ford staffers to lucrative agent-general roles in New York and London. The pattern was clear: French had been running a parallel operation inside the Ford government, using appointments and hiring to reward the premier's personal and political network.</p>

<p>The Taverner affair set a template that would repeat throughout the Ford years: use the formal machinery of government — job postings, hiring panels, executive searches — as window dressing for decisions already made. The Greenbelt, the Ontario Place redevelopment, and the MZO approvals all bore the same fingerprints.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ron Taverner OPP Appointment',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2018-11-20',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: 'Ontario Integrity Commissioner Investigation',
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-integrity-commissioner-ron-taverner-1.5064451',
      description: `<p>Following an NDP request, the Integrity Commissioner launched a formal probe into whether Ford had breached conflict of interest rules in Taverner's appointment. The final report, released in May 2019, found Ford had not personally broken any rules — he had maintained formal distance from the hiring panel. However, the Commissioner found the process was <strong>"flawed"</strong> with <strong>"troubling aspects"</strong>, specifically that chief of staff Dean French had fed Taverner's name to the cabinet secretary on the hiring panel, and that text messages between French and that official showed French was "rooting for Taverner's success."</p>`,
    },
    {
      title: 'OPP Deputy Commissioner Brad Blair — Court Challenge for Ombudsman Review',
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/ron-taverner-opp-commissioner-court-1.4973909',
      description: `<p>In a highly unusual move, sitting OPP Deputy Commissioner <strong>Brad Blair</strong> went to court in January 2019 to compel an Ombudsman investigation into the appointment process. Blair argued the process had been corrupted and that installing Taverner posed a direct threat to the independence of provincial policing. The legal challenge drew national attention and put significant pressure on both Taverner and the Ford government. Blair was ultimately <a href="https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-povincial-police-opp-ron-taverner-1.5043447">passed over for the permanent commissioner role</a> when Ford made a new appointment after Taverner withdrew — a move widely seen as retaliation.</p>`,
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
    { url: 'https://globalnews.ca/news/4754529/doug-ford-opp-ron-taverner-ombudsman-review/', title: "Doug Ford's friend was named Ontario's new OPP chief. Why that's now causing political uproar — Global News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ont-opp-inquiry-taverner-ford-yarde-1.4950680', title: "Integrity watchdog confirms probe into appointment of Ron Taverner as Ontario's top cop — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ron-taverner-opp-commissioner-court-1.4973909', title: "Force ombudsman to probe appointment of Ron Taverner, OPP deputy commissioner asks court — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-integrity-commissioner-ron-taverner-1.5064451', title: "Doug Ford didn't breach rules in Taverner appointment, integrity commissioner says — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ron-taverner-withdraws-from-consideration-for-opp-commissioner-1.5046120', title: "Ron Taverner, friend of Doug Ford, withdraws from consideration for OPP commissioner — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/doug-ford-ontario-povincial-police-opp-ron-taverner-1.5043447', title: "Doug Ford's role in OPP turmoil raises questions of political interference — CBC News" },
    { url: 'https://www.theglobeandmail.com/canada/article-ontario-paid-40000-search-hire-premier-fords-friend-ron-taverner/', title: "Ontario paid $40,000 for search that led to hiring of Premier Doug Ford's friend Ron Taverner — The Globe and Mail" },
    { url: 'https://www.nationalobserver.com/2018/12/15/news/ontario-government-slams-brakes-appointment-doug-fords-friend-ron-taverner-top', title: "Ontario government slams brakes on appointment of Doug Ford's friend Ron Taverner to top police job — National Observer" },
    { url: 'https://www.cbc.ca/news/canada/toronto/dean-french-resigns-1.5186053', title: "Doug Ford's chief of staff Dean French resigns following patronage controversy — CBC News" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Taverner scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
