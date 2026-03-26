/**
 * Seed script: The School Lands Sell-Off
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-school-lands-sell-off.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'the-school-lands-sell-off'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `The Ford government passed legislation giving the Minister of Education power to force school boards to sell public land to private developers, then used manufactured financial crises to take over six school boards — handing control of an estimated $60 billion in public land to provincial-appointed supervisors with real estate backgrounds and no education experience.`

  const summary = `Since 2018, the Ford government cut approximately $6 billion from education funding, pushing school boards into deficits and forcing asset sales to balance budgets. In 2023, Bill 98 (the Better Schools and Student Outcomes Act) gave the Minister of Education new powers to direct school boards to sell "surplus" land — bypassing locally elected trustees — including to private developers. Then, in 2025, the government used the resulting financial distress as justification to place six school boards under provincial supervision, including the Toronto District School Board, which holds $20 billion worth of land across 612 properties. The province-appointed supervisors are real estate and finance insiders, not educators. Under supervision, public transparency at the TDSB's real estate subsidiary has been curtailed, meetings are no longer livestreamed, and the supervisor is quietly working with the Ministry on undisclosed governance changes. Critics have explicitly compared the strategy to the Greenbelt scandal — using a public interest rationale to pave the way for developer-friendly land decisions.`

  const why_it_matters = `<p><strong>Bill 98</strong>, passed in June 2023, fundamentally shifted who controls public school land in Ontario. Before the bill, decisions about selling school properties required the involvement of locally elected trustees accountable to their communities. After it, the <a href="https://hicksmorley.com/2023/07/05/bill-98-better-schools-and-student-outcomes-act-2023-receives-royal-assent/">Minister of Education gained the power to force boards to sell land</a> not projected to be needed for students within ten years — including to private developers — without meaningful democratic input.</p>

<p>The 2025 school board takeovers compounded this. Rather than reverse the chronic underfunding that left boards scrambling to sell assets, the Ford government <a href="https://www.cbc.ca/news/canada/toronto/ontario-government-supervisors-4-school-boards-1.7572705">cited the resulting deficits as "mismanagement"</a> and appointed supervisors to run the boards. The TDSB's supervisor, <strong>Rohit Gupta</strong>, is the managing partner of Harrington Place Advisors — an M&A firm that, by its own description, specializes in "identifying high value opportunities for public sector assets." He has no known experience in public education and earns $350,000 annually in the role.</p>

<p>By taking over the TDSB, the province also seized control of the <strong>Toronto Lands Corporation (TLC)</strong>, the school board's real estate subsidiary that manages its $20 billion land portfolio. Shortly after the takeover, <a href="https://educationactiontoronto.com/articles/fords-school-board-takeover-a-real-estate-heist-disguised-as-education-reform/">public meetings were no longer livestreamed</a> and the TLC's governance documents were pulled from public access. Gupta told the TLC board in November 2025 that he was working with the Ministry on a "shareholder direction" — a fundamental change to the TLC's mandate — but declined to say what it would contain.</p>

<p>As <a href="https://thelocal.to/school-board-takeover-questions-and-answers/">NDP education critic Chandra Pasma observed</a>, the supervisors' "only qualifications are that they are conservative insiders." MPP Peter Tabuns put it more directly, questioning whether Ford was imposing the takeover "to control the sale of real property owned by the TDSB for the benefit of his developer friends, the way he did with the Greenbelt."</p>`

  const rippling_effects = `<p>Once public land is sold, it is gone. As housing researcher Mark Richardson has noted, <a href="https://thelocal.to/tdsb-takeover-property/">"if we do try and get it back, it's going to be prohibitively expensive."</a> Toronto is a rapidly growing city with a documented shortage of school space in new communities — strategic land retention is essential to building new schools where families will live. Selling off school sites to developers now means communities may face permanent shortfalls of public facilities in the future.</p>

<p>The TDSB had been pioneering a different model: instead of outright sales, the Toronto Lands Corporation was developing partnerships that built schools <em>within</em> mixed-use housing projects — keeping land public while generating community benefit. That approach is now under threat. The appointed supervisor has signalled structural changes to how the TLC operates, and both the TDSB and TCDSB are <a href="https://www.jessicabellmpp.ca/schools_struggle">currently litigating at the Ontario Land Tribunal</a> to resist provincial moves permitting large-scale development on school properties near transit stations.</p>

<p>The pattern mirrors the Greenbelt scandal in structure: use an emergency or crisis narrative to claim oversight authority, install insiders with real estate backgrounds, reduce public transparency, and quietly rewrite the rules governing what happens to the land. With an estimated <strong>$60 billion</strong> in school board land across Ontario now subject to ministerial direction, the potential scale of this transfer of public wealth to private hands is enormous.</p>

<p>For students and families, the immediate consequences are already visible. <a href="https://www.jessicabellmpp.ca/schools_struggle">Two Toronto secondary schools</a> — Eastdale and Heydon Park — have been directed to close enrollment for incoming grade 9+ students, a precursor to closure. Special education programs have had class sizes increased unilaterally. The democratic check that elected trustees once provided — the ability of local communities to push back on decisions about their schools — has been suspended indefinitely.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'The School Lands Sell-Off',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2026-03-20',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Sources
  const sources = [
    {
      url: 'https://thelocal.to/tdsb-takeover-property/',
      title: "What Happens to TDSB's $20 Billion Worth of Land Under Provincial Supervision? — The Local",
    },
    {
      url: 'https://educationactiontoronto.com/articles/fords-school-board-takeover-a-real-estate-heist-disguised-as-education-reform/',
      title: "Ford's School Board Takeover: A Real Estate Heist Disguised as Education Reform? — Education Action Toronto",
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-government-supervisors-4-school-boards-1.7572705',
      title: 'Ontario Takes Control of 4 More School Boards, Including TDSB, Over Mismanagement — CBC News',
    },
    {
      url: 'https://thelocal.to/school-board-takeover-questions-and-answers/',
      title: 'Takeover of GTA School Boards — Your Questions Answered — The Local',
    },
    {
      url: 'https://hicksmorley.com/2023/07/05/bill-98-better-schools-and-student-outcomes-act-2023-receives-royal-assent/',
      title: 'Bill 98, Better Schools and Student Outcomes Act, 2023, Receives Royal Assent — Hicks Morley',
    },
    {
      url: 'https://www.jessicabellmpp.ca/schools_struggle',
      title: "Schools Struggle Under Ford's Supervisor Czar — Jessica Bell MPP",
    },
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
      date: '2023-04-17',
      icon: 'FileText',
      label: 'Bill 98 introduced, giving minister power to force school boards to sell land to private developers',
    },
    {
      date: '2023-06-08',
      icon: 'Gavel',
      label: 'Bill 98 receives Royal Assent — minister can now override trustees on school property sales',
    },
    {
      date: '2025-06-27',
      icon: 'AlertTriangle',
      label: 'Ford government seizes control of TDSB and three other school boards, citing financial mismanagement',
    },
    {
      date: '2025-12-12',
      icon: 'Lock',
      label: "TDSB director Clayton La Touche removed by Ford's appointed supervisor Rohit Gupta",
    },
    {
      date: '2026-03-20',
      icon: 'Newspaper',
      label: "Schools closing, land governance secretive: Ford's school board takeover tightens its grip",
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
