/**
 * Seed script: Ford's iGaming Expansion and the Rise of Online Gambling Addiction
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-igaming-expansion-gambling-addiction.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'igaming-expansion-gambling-addiction'

  // Idempotent: skip if already exists
  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Doug Ford's government launched Canada's first private online gambling market in 2022 — having first eliminated Ontario's only independent gambling research body in 2019, and immediately after handing lucrative lobbying contracts to his own campaign manager and vice-chair. A 2026 peer-reviewed study found a 317% surge in young men aged 15–24 seeking help for gambling addiction, while the province collects a quarter-billion dollars a year in gaming revenue.`

  const summary = `In April 2022, the Ford government launched iGaming Ontario — Canada's first open, privately operated online gambling market. The move came three years after Ford eliminated the Gambling Research Exchange Ontario (GREO), the province's only independent gambling research body, in 2019 while the iGaming expansion was being planned. Ford's own campaign vice-chair and campaign manager had already set up lobbying shops for online gambling companies within months of the Tories taking power. By 2024, the province was collecting approximately $253 million per year in iGaming revenue. A peer-reviewed study published in the Canadian Medical Association Journal in March 2026 found a 317% increase in gambling helpline contacts among boys and men aged 15–24 since the market launched. Meanwhile, gambling ads had come to occupy over one-fifth of every televised sporting event in Ontario.`

  const why_it_matters = `<p>The Ford government did not stumble into this. <a href="https://www.theglobeandmail.com/politics/article-internet-gambling-interests-bet-on-lobbyists-with-pc-ties-for-a-quick/">Within months of the Tories taking power in 2018, Doug Ford's campaign vice-chair Chris Froggatt had set up a lobbying firm — Loyalist Public Affairs — and registered Stars Group (operators of PokerStars) as a client.</a> Ford's campaign manager Kory Teneycke set up Rubicon Strategy; his associate <strong>Patrick Harris</strong>, the 4th Vice-President of the PC Party, registered to lobby for the Canadian Online Gaming Alliance, representing three offshore gambling companies — Bet365, GVS, and Microgaming — operating from Gibraltar and the Isle of Man. The province's gambling regulator was being shaped, in part, by the people who had just run the winning campaign.</p>

<p>In May 2019 — while that same government was designing the new iGaming market — <a href="https://www.cbc.ca/news/canada/toronto/gambling-research-exchange-ontario-cut-1.5123316">Ford cut the entire $2.5 million annual budget of the Gambling Research Exchange Ontario (GREO)</a>, an independent research clearinghouse that had operated for 20 years and employed 14 people. The stated reason was a "focus on front-line services." The actual effect was to eliminate the province's only source of independent, publicly funded research into gambling harm — precisely as the government was planning to dramatically expand gambling. Carleton University researchers later noted that the Ford government <strong>"has not announced any funding for independent research"</strong> to monitor iGaming's impact.</p>

<p>The iGaming Ontario market launched on April 4, 2022, with 50 licensed operators and a 20% gross revenue tax — less than half the 55% tax imposed on land-based casinos. What followed was an advertising explosion: a peer-reviewed analysis of Ontario sports broadcasts in 2023 found <a href="https://www.cbc.ca/news/marketplace/sports-betting-gambling-advertisements-1.7086400">3,537 gambling messages across five NHL and two NBA games — an average of 2.8 per minute, occupying 21.7% of total broadcast time.</a> Fewer than 3% of those messages contained any responsible gambling messaging. When the AGCO eventually banned athletes from iGaming ads in February 2024, public health advocates called it a cosmetic fix that left the underlying saturation untouched.</p>

<p>The province now earns approximately <strong>$253 million per year</strong> from iGaming operator revenue — up from $87 million in year one. <a href="https://www.theglobeandmail.com/opinion/editorials/article-ontarios-addiction-to-online-gambling-revenue/">The Globe and Mail's editorial board named this directly: Ontario has a financial addiction to gambling revenue</a> that creates a structural conflict of interest in regulating the same market it profits from. The province's own Auditor General flagged five major recommendations on iGaming governance in 2022; none were fully implemented by the 2023 follow-up.</p>`

  const rippling_effects = `<p>The human cost became measurable in March 2026, when a peer-reviewed study in the <em>Canadian Medical Association Journal</em> analyzed 745,700 contacts to Ontario's 24-hour mental health helpline from 2012 to 2025. <a href="https://www.cbc.ca/news/health/online-gambling-ontario-9.7112838">It found a 317% increase in gambling-related contacts among boys and men aged 15–24, and a 108% increase among men 25–44</a> — comparing the pre-iGaming era to the post-privatization period. By 2025, 76% of all gambling helpline contacts were specifically for online gambling. The lead author, Dr. Daniel Myran of the University of Toronto, noted that most people with gambling disorders never seek help — meaning helpline data significantly underestimates the true scale.</p>

<p>The financial harms are documented and severe. <a href="https://www.cardus.ca/research/work-economics/reports/the-hidden-harms-of-single-event-sports-betting-in-ontario/">A Cardus report found the average Ontario sports betting account spends $283 per month</a> — more than three times the $89/month safe threshold set by the Canadian Centre on Substance Use and Addiction. Players exceeding that threshold are 4.3× more likely to experience financial harm, 4.7× more likely to experience relationship harm, and 3.9× more likely to experience emotional harm. <a href="https://www.ccsa.ca/en/almost-1-4-young-people-who-gamble-online-report-experiencing-high-levels-gambling-related-harm-new">Nearly 1 in 4 young online gamblers report high levels of gambling-related harm</a>, including depleted savings, credit card debt, and compromised wellbeing. <a href="https://www.mhrc.ca/gambling-report">Mental Health Research Canada found that 22% of high-risk gamblers have planned suicide.</a></p>

<p>The political response has been negligible. The NDP introduced <strong>Bill 126</strong> in 2023 — the Ban iGaming Advertising Act — which would have fined operators up to $1 million for targeted advertising. It died at first reading without a government vote. Ahead of the 2025 provincial election, all four major parties declined to answer questions about gambling harm policy. The province continues to collect its quarter-billion annually while <a href="https://www.ccsa.ca/en/call-national-strategy-address-gambling-related-harms-wake-sports-betting-boom">the Canadian Centre on Substance Use and Addiction has called for a national strategy to address what it describes as a public health crisis driven by provincial governments that both profit from and are expected to regulate gambling.</a></p>

<p>Ontario's 11–16% problem gambling rate — up from 1.1% in 2018 — is not a side effect of a policy that otherwise worked. It is the foreseeable consequence of a market designed by and for the people who stood to profit from it, stripped of independent research oversight, and left to advertise without meaningful restriction to the young men who are now flooding the province's helplines.</p>`

  // Insert scandal
  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Ford''s iGaming Expansion and the Rise of Online Gambling Addiction',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2026-03-02',
      false,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions — none confirmed filed; no entry warranted

  // Sources
  const sources = [
    { url: 'https://www.cmaj.ca/content/198/8/E281', title: 'Help-seeking for gambling problems following expansion of Ontario\'s online gambling market — Canadian Medical Association Journal (March 2026)' },
    { url: 'https://www.cbc.ca/news/health/online-gambling-ontario-9.7112838', title: 'Sharp rise in young men contacting Ontario gambling helpline, researchers find — CBC News' },
    { url: 'https://www.cbc.ca/news/marketplace/sports-betting-gambling-advertisements-1.7086400', title: 'You spend up to 20% of every game watching gambling advertising — CBC Marketplace' },
    { url: 'https://www.theglobeandmail.com/politics/article-internet-gambling-interests-bet-on-lobbyists-with-pc-ties-for-a-quick/', title: 'Internet-gambling interests bet on lobbyists with PC ties for a quick win in Ontario — The Globe and Mail' },
    { url: 'https://www.theglobeandmail.com/politics/article-gambling-lobbyist-pushed-for-attendance-at-fundraising-event-where/', title: 'Gambling lobbyist pushed for attendance at fundraising event where Ontario Treasury President was expected — The Globe and Mail' },
    { url: 'https://www.cbc.ca/news/canada/toronto/gambling-research-exchange-ontario-cut-1.5123316', title: 'Ontario stops funding problem gambling research agency, orders closure — CBC News' },
    { url: 'https://globalnews.ca/news/5240402/ontario-government-cuts-problem-gambling-research-organization/', title: 'Ontario eliminates funding for problem gambling research, agency to close by summer — Global News' },
    { url: 'https://www.ccsa.ca/en/almost-1-4-young-people-who-gamble-online-report-experiencing-high-levels-gambling-related-harm-new', title: 'Almost 1 in 4 Young People Who Gamble Online Report High Levels of Gambling-Related Harm — CCSA' },
    { url: 'https://www.cardus.ca/research/work-economics/reports/the-hidden-harms-of-single-event-sports-betting-in-ontario/', title: 'The Hidden Harms of Single-Event Sports Betting in Ontario — Cardus' },
    { url: 'https://www.mhrc.ca/gambling-report', title: 'High Stakes: A Mental Health Perspective on Gambling in Canada — Mental Health Research Canada' },
    { url: 'https://www.theglobeandmail.com/opinion/editorials/article-ontarios-addiction-to-online-gambling-revenue/', title: 'Ontario\'s addiction to online gambling revenue — The Globe and Mail (Editorial)' },
    { url: 'https://www.auditor.on.ca/en/content/news/22_summaries/2022_summary_AR_OLG.pdf', title: 'Casinos, Lotteries and Internet Gaming: Value-for-Money Audit — Office of the Auditor General of Ontario (2022)' },
    { url: 'https://www.ccsa.ca/en/call-national-strategy-address-gambling-related-harms-wake-sports-betting-boom', title: 'Call for a National Strategy to Address Gambling-Related Harms — Canadian Centre on Substance Use and Addiction' },
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
      date: '2019-05-01',
      icon: 'AlertTriangle',
      label: 'Ford government eliminates GREO, Ontario\'s only independent gambling research body, while planning iGaming expansion',
    },
    {
      date: '2022-04-04',
      icon: 'Globe',
      label: 'iGaming Ontario launches: Canada\'s first private online gambling market opens with 50 licensed operators',
    },
    {
      date: '2024-02-28',
      icon: 'Newspaper',
      label: 'AGCO bans athletes from iGaming ads — public health advocates call it insufficient',
    },
    {
      date: '2026-03-02',
      icon: 'FileText',
      label: 'CMAJ study finds 317% surge in young men aged 15–24 contacting Ontario gambling helpline since iGaming launch',
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
