/**
 * Seed script: The Ticket Scalping Reversal
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-ticket-scalping-reversal.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'ticket-scalping-reversal'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford killed Ontario's anti-scalping price cap in 2019, calling it "unenforceable" — then seven years later announced a stricter version of the same policy while posturing as a champion of fans.`

  const summary = `In 2017, the Liberal government passed the Ticket Sales Act with a provision capping ticket resale prices at 50% above face value. Within days of taking office in 2018, Doug Ford's government suspended that cap — a move praised by Ticketmaster as "very rational and prudent." By April 2019, the cap was formally cancelled in the provincial budget. For years, Ontario fans paid uncapped resale prices. Then, following public outrage over sky-high Blue Jays World Series ticket prices in 2025, Ford reversed course — announcing in March 2026 a new, stricter ban on resales above the original purchase price, presenting the policy reversal as his own consumer protection initiative.`

  const why_it_matters = `<p>When Doug Ford's government <a href="https://www.cbc.ca/news/canada/toronto/ontario-ticket-resale-cap-ontario-1.4732867">suspended Ontario's ticket resale price cap</a> in July 2018, it did so within days of the cap taking effect — after <strong>Ticketmaster</strong> called the decision "very rational and prudent" and <strong>StubHub</strong> had previously warned that price controls would push tickets to the black market. The Ford government's official rationale was that the 50% cap was "unenforceable." Millions of Ontario fans spent the next seven years paying whatever the secondary market would bear.</p>

<p>Consumer Services Minister <strong>Bill Walker</strong> made the cancellation official on <a href="https://globalnews.ca/news/5169204/ontario-ticket-resale-cap/">April 15, 2019</a>, dismissing the Liberal-era cap as "a nice soundbite, but there was no enforcement." No replacement consumer protection was introduced. No alternative enforcement mechanism was proposed. The cap was simply gone.</p>

<p>The about-face arrived only after the political cost became impossible to ignore. During Toronto's 2025 World Series run, Ford himself publicly called out Ticketmaster for "gouging" Jays fans — the same platform that had cheered his 2018 decision. On <a href="https://www.cbc.ca/news/canada/toronto/ford-ticket-resale-price-cap-ontario-9.7135950">March 20, 2026</a>, Ford announced plans to amend the <em>Ticket Sales Act, 2017</em> to ban resales above the original purchase price, penalties up to $10,000 for violators — a stricter rule than the one he killed, presented as a fresh idea.</p>`

  const rippling_effects = `<p>The seven years between Ford killing the price cap and restoring it weren't neutral. Ontario fans paid inflated prices throughout that window with no legal recourse. The scalping industry that flourished under Ford's policy was not an accident — it was the direct result of a deliberate government choice made shortly after <a href="https://www.theglobeandmail.com/canada/article-ontario-scraps-part-of-law-that-would-have-capped-ticket-resale-prices/">industry players signalled their approval</a>.</p>

<p>The 2026 reversal also carries a structural irony: <strong>Ticketmaster</strong> and parent company <strong>Live Nation</strong> now support the new cap, while <strong>StubHub</strong> opposes it. Critics have noted that a ban on above-face-value resale consolidates power with primary sellers like Ticketmaster — which controls both the primary market and its own resale platform, Fan Exchange. A cap that eliminates competitor resellers while leaving Ticketmaster's own secondary market intact may benefit the company more than consumers.</p>

<p>Ford's reversal also sets a pattern visible across his tenure: consumer protections are stripped, industry profits, public pressure eventually mounts, and Ford re-announces a version of what he dismantled — taking credit for the fix while avoiding accountability for the harm caused in between. The <a href="https://globalnews.ca/news/11739355/ontario-ticket-resale-legislation/">Global News coverage of the 2026 announcement</a> noted directly that it "represents a reversal from a government that killed a similar idea shortly after taking power."</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'The Ticket Scalping Reversal',
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

  // No legal actions — this is a legislative hypocrisy story with no formal proceedings

  // Sources
  const sources = [
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-ticket-resale-cap-ontario-1.4732867',
      title: 'New Ontario government puts brakes on anti-scalping law — CBC News',
    },
    {
      url: 'https://globalnews.ca/news/5169204/ontario-ticket-resale-cap/',
      title: 'Ontario cancels ticket resale price cap, increasing fines for disobeying ticket law — Global News',
    },
    {
      url: 'https://www.theglobeandmail.com/canada/article-ontario-scraps-part-of-law-that-would-have-capped-ticket-resale-prices/',
      title: 'Ontario government scraps ticket resale price cap, increases fines for violating ticket law — The Globe and Mail',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ford-ticket-resale-price-cap-ontario-9.7135950',
      title: 'Ontario proposing to cap ticket resale prices at original value — CBC News',
    },
    {
      url: 'https://globalnews.ca/news/11739355/ontario-ticket-resale-legislation/',
      title: 'Ford government unveils plans to ban ticket resales at higher prices — Global News',
    },
    {
      url: 'https://www.theglobeandmail.com/culture/article-ontario-resale-tickets-price-caps-original-value-events-concerts/',
      title: 'Ontario to introduce legislation capping ticket resale prices at original value — The Globe and Mail',
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
      date: '2017-01-01',
      icon: 'FileText',
      label: 'Liberal government passes Ticket Sales Act with 50% resale price cap',
    },
    {
      date: '2018-07-03',
      icon: 'AlertTriangle',
      label: 'Ford suspends ticket resale price cap days after it takes effect — Ticketmaster calls it "rational"',
    },
    {
      date: '2019-04-15',
      icon: 'Gavel',
      label: 'Ford officially cancels ticket resale cap in provincial budget, minister calls it "a nice soundbite"',
    },
    {
      date: '2026-03-20',
      icon: 'Megaphone',
      label: 'Ford announces stricter ticket resale ban — seven years after killing the original cap',
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
