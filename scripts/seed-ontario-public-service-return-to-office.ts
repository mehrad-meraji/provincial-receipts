/**
 * Seed script: Ontario Public Service Return-to-Office Mandate
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-ontario-public-service-return-to-office.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ontario-public-service-return-to-office'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford's government ordered 60,000 Ontario public servants back to the office full-time with little notice, no new office space secured, and no evidence of productivity gains — then told unhappy workers to "get another job."`

  const summary = `In August 2025, Treasury Board President Caroline Mulroney announced that all Ontario Public Service employees, along with staff at provincial agencies, boards, and commissions, would be required to work four days per week in-office starting October 20, 2025, transitioning to full-time five-day attendance by January 5, 2026. The mandate ended hybrid work arrangements that had been in place since April 2022. The government provided unions with approximately one hour's notice before the announcement — far short of the two-week minimum required under collective agreements. No new office space was leased or purchased to accommodate the returning 60,000 workers, leaving employees crowded into shared spaces, sent home for lack of seating, and facing a backlog of thousands of accommodation requests. Premier Ford, responding to a public servant who texted him concerns about the policy's impact on caregivers and disabled workers, left a voicemail advising the worker to "get another job."`

  const why_it_matters = `<p>The Ford government's back-to-office mandate affects <strong>60,000 Ontario Public Service workers</strong> and represents one of the most sweeping unilateral changes to public sector working conditions in recent Ontario history. <a href="https://www.cbc.ca/news/canada/toronto/ontario-public-service-work-from-office-mandate-remote-1.7608742">The announcement came with roughly one hour's notice</a> to unions — despite collective agreements requiring a minimum of two weeks — raising serious questions about whether the government followed its own legal obligations.</p>

<p>The mandate disproportionately harms workers with disabilities, caregivers, and employees who relocated during the pandemic based on the expectation of continued hybrid work. <strong>AMAPCEO</strong>, which represents Ontario's professional and management crown employees, reported that its <strong>16,000 members needed office seating, but only 13,000 seats existed</strong> across provincial facilities. Workers were either sent home because no space was available or crowded eight people into boardrooms not designed for that use. The Ministry of Infrastructure confirmed the government had <a href="https://www.cbc.ca/news/canada/toronto/ontario-return-to-office-plan-9.7099817">not signed a single new lease or purchase agreement</a> to accommodate the returning workforce.</p>

<p>Ford's stated rationale — that in-person work boosts productivity and supports downtown small businesses — was offered without supporting evidence. When a public servant texted the Premier expressing concern about the policy's impact on working parents, disabled workers, and the environment, Ford responded with a voicemail: <a href="https://pressprogress.ca/public-servant-voicemail-doug-ford-get-another-job/">"You don't like it, go get another job."</a> The remark encapsulated the government's posture toward its own workforce throughout the dispute.</p>`

  const rippling_effects = `<p>The immediate operational fallout was severe. <strong>Approximately 6,000 accommodation requests</strong> from workers citing medical needs or caregiving responsibilities were filed, but processing times stretched from the standard 20 days to months, leaving workers in limbo. Morale across the public service was described by union leaders as <a href="https://www.cbc.ca/news/canada/toronto/ontario-return-to-office-plan-9.7099817">"at an all time low,"</a> with managers privately opposing the policy while enforcing it under pressure.</p>

<p><strong>AMAPCEO filed a formal policy dispute on September 3, 2025</strong>, alleging the government violated its collective agreement by providing inadequate notice. The union also launched a <a href="https://www.cbc.ca/news/canada/toronto/remote-work-rally-ontario-1.7637419">province-wide day of action on September 18, 2025</a>, with roughly 200 workers rallying outside Queen's Park and delivering a petition signed by over 13,000 people. In subsequent collective bargaining for the 2025–2028 agreement, the government attempted to eliminate flexible work provisions entirely; AMAPCEO successfully defended the right to request alternative work arrangements and to file a dispute if those requests are unreasonably denied.</p>

<p>The episode revealed a pattern of the Ford government treating its own workforce as an afterthought — announcing major policy changes without adequate planning, ignoring contractual obligations, and dismissing worker concerns. <strong>OPSEU</strong> argued the mandate constituted a unilateral change to working conditions in violation of the <em>Labour Relations Act</em>. The space crisis, the accommodation backlog, and the Premier's "get another job" voicemail together document a government more interested in political signalling than in effectively managing the public service it relies on.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ontario Public Service Return-to-Office Mandate',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2025-08-14',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'AMAPCEO Policy Dispute Over Inadequate Notice',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/amapceo-ontario-employees-policy-dispute-review-office-space-1.7625748',
      description: `<p><strong>AMAPCEO</strong> filed a policy dispute against the Ontario Public Service Employer on September 3, 2025, alleging the government violated its collective agreement by providing approximately one hour's notice of the return-to-office mandate — far short of the two-week minimum required under the agreement. The union requested that the August 14 announcement memo be rescinded and that the employer provide advance notice consistent with their contractual obligations. The government stated it was "disappointed" with the action, arguing it had communicated expectations during bargaining. The dispute remained active through collective bargaining for the 2025–2028 agreement, in which the union successfully preserved the right to seek exceptions and to file disputes over unreasonably denied requests.</p>`,
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
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-public-service-work-from-office-mandate-remote-1.7608742',
      title: 'Ontario ordering public servants back into office full time — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-return-to-office-plan-9.7099817',
      title: 'Ontario has not purchased or leased new space for thousands of returning civil servants — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/amapceo-ontario-employees-policy-dispute-review-office-space-1.7625748',
      title: 'Union files dispute over Ontario government policy requiring workers back in office full-time — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/remote-work-rally-ontario-1.7637419',
      title: "'Return to the Stone Age': Ontario public servants rally against Ford's return-to-office order — CBC News",
    },
    {
      url: 'https://pressprogress.ca/public-servant-voicemail-doug-ford-get-another-job/',
      title: "Public Servant Surprised by Voicemail from Doug Ford Suggesting They 'Get Another Job' — PressProgress",
    },
    {
      url: 'https://www.theglobeandmail.com/canada/article-doug-ford-unions-back-to-work-order-ontario-civil-servants-office-wfh/',
      title: "Unions hit out at Doug Ford's 'ridiculous' back-to-work order as Ontario civil servants return to office — The Globe and Mail",
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-civil-servants-return-to-office-9.6955285',
      title: "Return to office for Ontario civil servants 'unnecessarily confusing,' unions say — CBC News",
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
      date: '2025-08-14',
      icon: 'Megaphone',
      label: 'Ford government orders 60,000 Ontario public servants back to office full-time',
    },
    {
      date: '2025-09-03',
      icon: 'Gavel',
      label: 'AMAPCEO files policy dispute over inadequate notice of return-to-office mandate',
    },
    {
      date: '2025-09-18',
      icon: 'Megaphone',
      label: 'Ontario public servants rally at Queen\'s Park against return-to-office order',
    },
    {
      date: '2025-10-20',
      icon: 'Flag',
      label: 'Four-day in-office phase begins for Ontario public servants',
    },
    {
      date: '2026-01-05',
      icon: 'AlertTriangle',
      label: 'Full-time five-day mandate takes effect amid office space crisis',
    },
    {
      date: '2026-02-04',
      icon: 'Newspaper',
      label: 'Ford tells unhappy public servant to "get another job" in personal voicemail',
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
