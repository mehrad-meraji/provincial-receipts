/**
 * Seed script: Ford Government's Failed Injunction Against Al-Quds Day Rally
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-ford-alquds-injunction.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ford-alquds-injunction'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Two-and-a-half hours before a rally held annually for 30 years, Doug Ford's government rushed a 109-page emergency injunction to shut it down — citing terrorism links and antisemitism. A judge dismissed it, finding no police support, no evidence linking the rally to recent violence, and that the government had come "dangerously close" to holding protesters accountable for others' acts.`

  const summary = `On March 13, 2026, Premier Doug Ford announced he had directed Attorney General Doug Downey to seek an emergency injunction to block Toronto's annual Al-Quds Day rally. The AG filed a 109-page brief just 2.5 hours before the event was scheduled to begin. Ontario Superior Court Justice Robert Centa rejected the application outright, finding the government had not met the legal threshold for an injunction on Charter-protected rights of assembly and expression. The rally proceeded peacefully — approximately 4,500 people attended; two counter-protesters, not rally participants, were arrested. Five days later, the Al-Quds Committee sent Ford a cease-and-desist letter threatening a defamation suit over his social media posts. Ford refused to comply.`

  const why_it_matters = `<p>The Ford government attempted to use a last-minute court injunction to shut down a political demonstration that had been held in Toronto for <strong>30 consecutive years without criminal incident</strong>. Justice Robert Centa found that the Attorney General's 109-page brief lacked even basic support from the institution responsible for public safety: <a href="https://www.cbc.ca/news/canada/toronto/ontario-al-quds-decision-9.7128964">Toronto Police filed no affidavit supporting the injunction</a> and had in fact been coordinating with organizers on safety logistics.</p>

<p>The judge directly rejected the government's core terrorism-link argument, finding that <a href="https://globalnews.ca/news/11731100/ontario-loses-injunction-al-quds/">"just because unsavoury persons promote a rally on social media does not mean that they are organizing that event."</a> A single social media post from a designated entity was the entirety of that evidence. Centa also refused to connect the rally to recent violence — synagogue shootings and a consulate shooting — finding the government's approach "comes dangerously close to asking me to hold some people accountable for the conduct of others."</p>

<p>The <a href="https://ccla.org/press-release/ccla-reacts-to-the-premier-announcing-that-ontario-is-seeking-an-injunction-to-stop-the-annual-al-quds-rally/">Canadian Civil Liberties Association called the move "an extraordinary and dangerous step"</a> — a sweeping pre-emptive attack on freedoms of expression and peaceful assembly protected under sections 2(b) and 2(c) of the <em>Canadian Charter of Rights and Freedoms</em>. The CCLA noted that police already held broad Criminal Code powers to address any unlawful conduct at the event.</p>

<p>The government filed its 109-page brief at 12:30 PM — 2.5 hours before the 3:00 PM rally. The timing alone signals this was designed more for political optics than a genuine legal remedy: a last-minute filing that courts could not meaningfully review and that organizers had no realistic time to respond to.</p>`

  const rippling_effects = `<p>The rally proceeded on March 14, 2026, with approximately <strong>4,500 attendees</strong>. Zero rally participants were arrested. Two counter-protesters were arrested on assault charges — the inverse of what the government's brief had warned. The spectacle of the state's 109-page argument collapsing in under two hours reinforced, rather than undermined, the organizers' legitimacy.</p>

<p>On March 18, the Al-Quds Committee, through lawyer Stephen Ellis, sent Ford a <a href="https://www.cp24.com/local/toronto/2026/03/18/toronto-al-quds-day-organizers-send-ford-cease-and-desist-letter-over-social-media-posts/">cease-and-desist letter demanding he remove all social media posts about the rally and issue a public apology within seven days</a>, warning that failure to comply would result in a defamation claim against Ford personally. Ford's office refused to retract anything.</p>

<p>The episode sets a troubling precedent for how Ontario's government treats politically inconvenient protest. Civil liberties organizations warned that if an injunction had been granted — on this evidence, against this rally — the same legal tool could be deployed against any demonstration the government labels dangerous. The failure here was a court firewall, not a government restraint.</p>

<p>Attorney General Doug Downey's office expended significant resources on a filing that a judge dismissed within hours. No accountability has followed for that use of the province's legal apparatus.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ford Government''s Failed Injunction Against Al-Quds Day Rally',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2026-03-14',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'Cease-and-Desist / Threatened Defamation Suit Against Ford',
      status: 'pending',
      url: 'https://www.cp24.com/local/toronto/2026/03/18/toronto-al-quds-day-organizers-send-ford-cease-and-desist-letter-over-social-media-posts/',
      description: `<p>On March 18, 2026, the Al-Quds Committee — through lawyer Stephen Ellis — sent Premier Doug Ford a cease-and-desist letter demanding he remove all social media posts about the rally and issue a public apology within seven days. The letter alleged Ford's statements were "reckless and malicious" and constitute defamation, falsely characterizing the committee as antisemitic and as a clear and present danger. Ford's office refused to comply, stating the premier "stands by" his remarks.</p>`,
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
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-al-quds-decision-9.7128964', title: 'Al-Quds Day rally proceeds in Toronto after judge rules against Ford government\'s injunction request — CBC News' },
    { url: 'https://www.cbc.ca/news/canada/toronto/ford-al-quds-day-injunction-toronto-9.7128008', title: 'Al-Quds Day rally to proceed in Toronto despite call by premier for injunction, lawyer says — CBC News' },
    { url: 'https://globalnews.ca/news/11731100/ontario-loses-injunction-al-quds/', title: 'Al-Quds Day protest proceeds after court rejects Ford\'s injunction bid — Global News' },
    { url: 'https://www.cp24.com/local/toronto/2026/03/18/toronto-al-quds-day-organizers-send-ford-cease-and-desist-letter-over-social-media-posts/', title: 'Toronto Al-Quds Day organizers send Ford cease-and-desist letter over social media posts — CP24' },
    { url: 'https://ccla.org/press-release/ccla-reacts-to-the-premier-announcing-that-ontario-is-seeking-an-injunction-to-stop-the-annual-al-quds-rally/', title: 'CCLA Reacts to the Premier Announcing that Ontario Is Seeking an Injunction to Stop the Annual Al Quds Rally — CCLA' },
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
      date: '2026-03-13',
      icon: 'AlertTriangle',
      label: 'Ford directs AG to seek emergency injunction against Al-Quds Day rally',
    },
    {
      date: '2026-03-14',
      icon: 'Gavel',
      label: 'Judge rejects Ford government\'s injunction; Al-Quds rally proceeds with 4,500 attendees',
    },
    {
      date: '2026-03-18',
      icon: 'FileText',
      label: 'Al-Quds Committee sends Ford cease-and-desist letter, threatens defamation suit',
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
