/**
 * Seed script: Starlink Secret Payout Scandal
 * Ford government cancels $100M Starlink deal, refuses to disclose cost to taxpayers.
 *
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-starlink-secret-payout.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'starlink-secret-payout'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Doug Ford signed a $100-million Starlink broadband deal to appeal to Trump's inner circle, then abruptly cancelled it in response to Trump's tariffs. He then negotiated a confidential settlement to pay Elon Musk an undisclosed sum — and refuses to tell Ontario taxpayers how much public money they're handing over to the world's richest person, citing a confidentiality clause that he could have negotiated away.`

  const summary = `<p>In late 2024, Premier Doug Ford announced Ontario would spend $100 million to expand Starlink satellite internet service across rural parts of the province. Senior government sources told media in November 2024 that the deal was "part of a positive move designed to appease Trump's inner circle" — a bid to curry favour with the incoming U.S. administration. Ford's approach was transactional: offer big contracts to Trump-connected companies in exchange for leverage on tariffs and trade.</p>
<p>That calculation changed in January 2025, when incoming President Donald Trump announced punishing 25% tariffs on Canadian goods. Ford's government suddenly cancelled the Starlink deal. Two days later, they lifted restrictions on U.S. booze imports (reversing previous tariff countermeasures), placed a one-day surcharge on power exported to Michigan, Minnesota, and New York (then reversed it), and by late January had cancelled the Starlink contract entirely. The flip-flop was so rapid and transparent — deal announced to appeal to Trump, then cancelled days after Trump's tariff threats — that it exposed Ford's strategy as pure political opportunism rather than a coherent broadband policy.</p>
<p>When the cancellation became public, the Ford government negotiated a confidential settlement with SpaceX over the cancelled contract. On March 13, 2026, CBC News and other outlets reported that Ontario had reached a settlement agreement with "significantly less" than the full $100-million contract value — but the province's government refused to disclose the actual payout amount. Premier Ford told reporters he "didn't know" the cost of the settlement his own government had negotiated. His office then clarified that the amount "cannot be publicly released" due to confidentiality clauses in the settlement agreement.</p>
<p>The secrecy is remarkable for its scope: the Ford government agreed to pay an undisclosed sum of public money to Elon Musk's company for cancelling a deal that Ford's government had proposed. The confidentiality clause — which Ford's negotiators could have refused or negotiated around — now serves as a shield against public accountability. Ontarians do not know whether they're paying $10 million, $50 million, or somewhere in between. Opposition parties pointed out the obvious: the agreement was negotiated on behalf of Ontario citizens using Ontario taxpayer money, and those citizens have a right to know the cost.</p>`

  const why_it_matters = `<p>The Starlink deal cancellation and secret payout reveal the Ford government's approach to public money: it is theirs to spend, negotiate away, or conceal as they see fit. The confidentiality clause may be legally binding, but Ford's government agreed to it. They chose secrecy over transparency. They chose to shield themselves from accountability over serving the public's right to know.</p>
<p>The original deal itself was problematic — a $100-million broadband contract justified on grounds of currying favour with Trump rather than serving Ontario's actual broadband needs. Rural broadband access is a real policy challenge, and it deserves to be funded based on engineering assessments of where service gaps exist and cost-benefit analyses of different solutions. Instead, Ford used a $100-million public contract as a political tool, offered it to signal deference to a foreign leader, then cancelled it when that political calculation changed. The settlement that followed — an undisclosed cost to make the problem disappear — represents the logical endpoint of that approach: when the political cost of transparency exceeds the government's tolerance, simply hide it.</p>
<p>The pattern is consistent with the broader FOI scandal. When the Ford government faces accountability mechanisms — courts, watchdogs, legislatures with subpoena power, or confidentiality clauses in contracts — its instinct is to eliminate, evade, or exploit them. The Starlink agreement shows this pattern in action: a contract and settlement negotiated without competitive bidding, a payout to one of the world's richest people funded by taxpayers, and the actual cost concealed from the public through a confidentiality clause the government could have challenged or refused.</p>`

  const rippling_effects = `<p>The immediate rippling effect is on Ontario's rural broadband strategy. The $100-million Starlink deal is gone. No alternative broadband expansion program has been announced. Rural Ontario's broadband gap — which was purportedly the justification for the Starlink deal — remains unfilled. Whatever amount the province ultimately paid to cancel the deal is money that cannot be spent on actual broadband infrastructure.</p>
<p>The precedent set by the confidentiality clause is also troubling. If the Ford government can negotiate public contracts with confidentiality clauses that prevent disclosure of the settlement amount, then future deals — for infrastructure, services, land, or anything else — could similarly be shielded from public scrutiny. The principle that public money should be subject to public accounting is eroded when the government agrees to spend that money in secret.</p>
<p>The incident also illustrates the risks of using government contracts as tools for foreign policy or personal favour-currying. The Starlink deal was never a serious broadband policy; it was a signal to Trump. When Trump's tariff threats made the signal counterproductive, the deal was cancelled. That approach to public money — as a tool for political messaging rather than public benefit — costs Ontario taxpayers in the form of settlement payments for deals that should never have been made in the first place.</p>
<p>Finally, the refusal to disclose the settlement amount adds to the broader erosion of government transparency that the FOI scandal represents. The government claims confidentiality clauses prevent disclosure. What it does not say is that those clauses were drafted by the government's negotiators, and those negotiators could have drafted differently. The choice to conceal the cost was a choice.</p>`

  console.log('Inserting Starlink Secret Payout scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Starlink Secret Payout — Ford Cancels Deal, Refuses to Disclose Cost to Taxpayers'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2026-03-13'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Ford Announces $100M Starlink Deal to "Appease Trump\'s Inner Circle" (November 2024)',
      status: 'Completed',
      description: `<p>Premier Doug Ford announced Ontario would spend $100 million to expand Starlink satellite broadband across rural portions of the province. Senior government sources told media the deal was "part of a positive move designed to appease Trump's inner circle" — a explicit acknowledgement that the contract was intended as a political signal to the incoming Trump administration rather than a broadband infrastructure decision grounded in engineering or cost-benefit analysis. The deal was announced without competitive bidding or public consultation on alternatives.</p>`,
      url: 'https://www.cp24.com/local/toronto/2024/11/19/ontario-to-invest-100-million-in-starlink-broadband-expansion/',
    },
    {
      title: 'Ford Cancels Starlink Deal Following Trump Tariff Threats (January 2025)',
      status: 'Completed',
      description: `<p>After Donald Trump announced incoming 25% tariffs on Canadian goods, Ford's government abruptly cancelled the Starlink deal. The timing made clear the deal had been political theater: when the political calculation changed, the contract was abandoned within days. Ford's government simultaneously reversed previous tariff countermeasures, briefly imposed a surcharge on power exports to U.S. states, then reversed that as well — all within a window of days, signalling chaotic responsiveness to Trump's moves rather than coherent economic policy.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ford-government-cancels-starlink-broadband-deal-1.7471329',
    },
    {
      title: 'Ford Government Reaches Confidential Settlement; Refuses to Disclose Payout Amount (March 13, 2026)',
      status: 'Active',
      description: `<p>Ontario negotiated a confidential settlement with SpaceX to terminate the $100-million Starlink contract. The government stated the settlement cost was "significantly less" than the contract value but refused to disclose the actual amount to taxpayers. Premier Ford told reporters he "didn't know" the cost. His office then clarified that the confidentiality clause in the settlement agreement prevented public disclosure. Opposition Leader John Fraser noted taxpayers deserved to know how much their government was paying to Elon Musk's company. The government did not challenge or negotiate around the confidentiality clause; it invoked the clause as justification for secrecy.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/spacex-deal-ontario-settlement-9.7127757',
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
    { title: 'CBC News — Confidential settlement for scuttled Starlink deal means Ontarians kept in dark on payout', url: 'https://www.cbc.ca/news/canada/toronto/spacex-deal-ontario-settlement-9.7127757' },
    { title: 'CP24 — Ontario\'s payout to Elon Musk over cancelled Starlink contract to remain secret', url: 'https://www.cp24.com/local/toronto/2026/03/13/ontarios-payout-to-elon-musk-over-cancelled-starlink-contract-to-remain-secret/' },
    { title: 'Global News — Ontario\'s payout to Elon Musk over cancelled Starlink contract to remain secret', url: 'https://globalnews.ca/news/11729944/ontarios-payout-to-elon-musk-over-cancelled-starlink-contract-to-remain-secret/' },
    { title: 'iPhone in Canada — Ontario Hides Secret Payout to Elon Musk\'s SpaceX Over Failed Starlink Deal', url: 'https://www.iphoneincanada.ca/2026/03/14/ontario-hides-secret-payout-to-elon-musks-spacex-over-failed-starlink-deal/' },
    { title: 'Mobile Syrup — Ontario, Starlink won\'t disclose payout over cancelled contract', url: 'https://mobilesyrup.com/2026/03/13/ontario-starlink-payout-secret/' },
    { title: 'The Trillium — Ontario\'s payout to Elon Musk over cancelled Starlink contract to remain secret', url: 'https://www.thetrillium.ca/news/politics/ontarios-payout-to-elon-musk-over-cancelled-starlink-contract-to-remain-secret-12003253' },
    { title: 'CBC News — Ford government cancels $100-million Starlink broadband deal', url: 'https://www.cbc.ca/news/canada/toronto/ford-government-cancels-starlink-broadband-deal-1.7471329' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 70)}...`)
  }

  // Timeline events
  const timelineEvents = [
    {
      date: '2024-11-15',
      label: 'Ford announces $100M Starlink deal to "appease Trump\'s inner circle"',
      icon: 'Megaphone',
    },
    {
      date: '2025-01-20',
      label: 'Ford abruptly cancels Starlink deal days after Trump announces tariffs',
      icon: 'AlertTriangle',
    },
    {
      date: '2026-03-13',
      label: 'Ford settlement with SpaceX: cost to be kept secret from taxpayers',
      icon: 'Lock',
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
    console.log(`  ✅ Timeline: ${evt.date} — ${evt.label.substring(0, 60)}...`)
  }

  console.log('\n🎉 Starlink Secret Payout scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
