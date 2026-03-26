/**
 * Seed script: Ontario's Nurse Practitioner Funding Delay
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-nurse-practitioner-funding-delay.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'nurse-practitioner-funding-delay'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ontario Health Minister Sylvia Jones spent 2024 demanding Ottawa close a loophole that let private clinics charge patients for nurse practitioner care — then refused to implement the fix once the federal government delivered it, leaving Ontarians paying $70–$90 per appointment for services that should be publicly funded.`

  const summary = `In April 2024, Ontario Health Minister Sylvia Jones personally wrote to the federal government demanding it close what she called a "loophole" in the Canada Health Act that allowed private nurse practitioner clinics to charge patients out-of-pocket fees for medically necessary primary care. Ottawa responded in January 2025, issuing an interpretation letter confirming that nurse practitioner services equivalent to physician care must be publicly funded under the Act, with a compliance deadline of April 1, 2026. Ontario spent the following 15 months doing nothing, missed the deadline, and blamed the federal government for not creating a national standard. Ontario remains the only province that has not moved to implement public funding for nurse practitioners, leaving patients — many of whom cannot find a family doctor — continuing to pay $70–$90 per visit at private clinics for care that is publicly funded elsewhere in Canada. Financial penalties could begin clawing back Ontario's federal health transfer payments starting April 1, 2027.`

  const why_it_matters = `<p>Ontario is in the grip of a primary care crisis. Millions of residents lack access to a family doctor. Nurse practitioners are qualified primary care providers who can diagnose, treat, and prescribe — but in Ontario, they <strong>cannot independently bill OHIP</strong>. Private clinics have filled the gap by charging subscription or per-visit fees to patients who have nowhere else to turn. When Ontario Health Minister <strong>Sylvia Jones</strong> wrote to Ottawa in April 2024 urging the federal government to <a href="https://globalnews.ca/news/10427245/ontario-nurse-practitioner-letter-federal-government-ontario/">close this "loophole"</a>, she framed it as a threat to public health care that Ontario could not address alone.</p>

<p>The federal government took her at her word. In January 2025, Health Minister Mark Holland issued a binding interpretation of the <em>Canada Health Act</em> confirming that medically necessary nurse practitioner services must be publicly funded, effective April 1, 2026. What happened next was the opposite of what Jones had demanded: Ontario went silent. A ministry spokesperson's only comment was that the province was <a href="https://www.cbc.ca/news/canada/toronto/ontario-nurse-practitioners-9.7135820">"actively reviewing and engaged in ongoing discussions."</a> The April 1, 2026 deadline passed with no implementation plan.</p>

<p>Liberal health critic <strong>Dr. Adil Shamji</strong> called the inaction "hypocritical," arguing that <a href="https://www.ctvnews.ca/toronto/politics/queens-park/article/ontario-to-miss-federal-deadline-for-publicly-funding-nurse-practitioners/">"it has always been more convenient for this government to allow patients to pay out of pocket."</a> Jones, for her part, blamed Ottawa for not establishing a national standard: <a href="https://www.ctvnews.ca/toronto/politics/queens-park/article/ontario-health-minister-disappointed-in-feds-approach-to-nurse-practitioner-rules/">"What (the federal government has) said is, 'It's your problem. You fix it.'"</a> — a striking reversal from the minister who had told the federal government exactly the same thing a year earlier.</p>

<p><strong>Michelle Acorn</strong>, CEO of the Nurse Practitioners' Association of Ontario, noted that <a href="https://www.theglobeandmail.com/politics/article-ontario-publicly-funding-nurse-practitioners/">"the lack of easily accessible funding models has historically limited the number of public positions"</a> for nurse practitioners in the province — meaning Ontario's delay isn't just a policy gap, it's actively suppressing the supply of publicly funded primary care providers.</p>`

  const rippling_effects = `<p>Ontario has committed to compliance by <strong>April 1, 2027</strong> — one day before federal financial penalties begin clawing back money from the Canada Health Transfer. If the province misses that deadline too, it could face retroactive deductions dating back to April 2026. The federal government clawed back <strong>$62.2 million</strong> nationally from provinces for improper patient charges in 2024–25; non-compliance on nurse practitioners could dwarf that figure given the scale of Ontario's private NP clinic sector.</p>

<p>The delay has a direct human cost. Patients who cannot find a family doctor — a <a href="https://www.theglobeandmail.com/politics/article-ontario-publicly-funding-nurse-practitioners/">documented crisis across Ontario</a> — are being steered toward private nurse practitioner clinics and charged $70–$90 per appointment for care that is now publicly funded in other provinces. This is not a gap that affects everyone equally: it falls hardest on those least able to afford it, in communities already underserved by the public system.</p>

<p>The February 2024 bilateral health accord between Ford and Prime Minister Trudeau committed Ontario to <strong>$3.1 billion</strong> over three years (part of an $8.6 billion, 10-year deal) that explicitly included a requirement to build primary care teams incorporating nurse practitioners. Ontario's failure to establish a public billing model for NPs puts the provincial government in tension with the terms of a deal it signed and publicly celebrated.</p>

<p>The broader pattern is one of Ontario using federal health policy as a political prop — loudly demanding federal action while resisting the administrative and fiscal responsibility that comes with it. Jones's 2024 letter to Ottawa was covered extensively as evidence of Ontario standing up for patients. The quiet non-compliance that followed received a fraction of that attention, and patients are paying the price.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ontario''s Nurse Practitioner Funding Delay',
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
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-nurse-practitioners-9.7135820',
      title: 'Ontario to blow past federal deadline to publicly fund nurse practitioners — CBC News',
    },
    {
      url: 'https://globalnews.ca/news/11739684/ontario-nursing-loophole-feds-deadline/',
      title: 'Ontario to miss federal deadline for publicly funding nurse practitioners — Global News',
    },
    {
      url: 'https://www.ctvnews.ca/toronto/politics/queens-park/article/ontario-to-miss-federal-deadline-for-publicly-funding-nurse-practitioners/',
      title: 'Ontario to miss federal deadline for publicly funding nurse practitioners — CTV News',
    },
    {
      url: 'https://www.theglobeandmail.com/politics/article-ontario-publicly-funding-nurse-practitioners/',
      title: 'Ontario to miss deadline to fund nurse practitioners, leaving some patients paying out of pocket — The Globe and Mail',
    },
    {
      url: 'https://www.ctvnews.ca/toronto/politics/queens-park/article/ontario-health-minister-disappointed-in-feds-approach-to-nurse-practitioner-rules/',
      title: "Ontario health minister 'disappointed' in feds' approach to nurse practitioner rules — CTV News",
    },
    {
      url: 'https://globalnews.ca/news/10427245/ontario-nurse-practitioner-letter-federal-government-ontario/',
      title: "Nurse practitioner fees could 'undermine' Ontario public health investment: minister — Global News",
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
      date: '2024-04-16',
      icon: 'Megaphone',
      label: 'Health Minister Sylvia Jones writes to Ottawa demanding closure of nurse practitioner billing "loophole"',
    },
    {
      date: '2025-01-10',
      icon: 'FileText',
      label: 'Federal government issues Canada Health Act interpretation: NP services must be publicly funded by April 1, 2026',
    },
    {
      date: '2026-03-20',
      icon: 'Newspaper',
      label: 'Ontario confirmed to miss April 1 federal deadline to publicly fund nurse practitioners',
    },
    {
      date: '2026-04-01',
      icon: 'AlertTriangle',
      label: 'Federal compliance deadline passes — Ontario non-compliant; patients still paying $70–$90/visit at private NP clinics',
    },
    {
      date: '2026-03-25',
      icon: 'Flag',
      label: 'Jones says Ontario committed to compliance by April 1, 2027 — one day before federal financial penalties begin',
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
