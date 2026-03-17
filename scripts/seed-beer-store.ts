/**
 * Seed script: Beer Store Privatization
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-beer-store.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'beer-store-privatization'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford broke a legally binding provincial contract to give grocery giants and convenience store chains the right to sell alcohol — handing corporations billions in new revenue while costing Ontario taxpayers $225 million upfront and a projected $1.4 billion in lost tax revenue by 2030.`

  const summary = `In 2024, Doug Ford's government broke Ontario's legally binding 10-year agreement with The Beer Store — paying $225 million to exit the contract early — and expanded alcohol sales to every convenience store, grocery store, and big-box retailer in the province by October 2024. The Financial Accountability Office calculated the total cost to Ontario taxpayers at $1.4 billion by 2030, primarily from lost tax revenues as alcohol sales shifted from publicly regulated retailers to private stores not subject to the same tax structure. The deal triggered the first-ever strike by LCBO workers, who walked off the job for two weeks over job security fears. The primary winners were the province's largest grocery and convenience store chains — Loblaws, Metro, Sobeys, Walmart, Costco, and Circle K — whose industry lobby groups had pushed hard for the change.`

  const why_it_matters = `<p>The Beer Store contract was not a vague policy commitment Ford could quietly abandon. It was a <strong>legally binding 10-year agreement</strong>, signed by the previous Liberal government in 2015, that gave The Beer Store (jointly owned by Molson, Labatt, and Sleeman) exclusive rights to sell 12- and 24-packs of beer until 2025. Ford broke it in 2024 and wrote a cheque for <a href="https://www.theglobeandmail.com/opinion/article-ontario-blowing-225-million-to-cancel-its-beer-store-contract-is-a/">$225 million of public money</a> — the equivalent of $382,653 per day — to exit the agreement 18 months early. No voter asked for this. No emergency required it. It was a political choice to accelerate a policy benefiting specific corporate interests on an arbitrary timeline, at a cost of a quarter-billion dollars.</p>

<p>The framing was always about consumer convenience — beer in corner stores, wine with your groceries. But the financial reality, documented by the province's independent <a href="https://fao-on.org/en/report/alcohol-sales-expansion/">Financial Accountability Office</a> in January 2025, is a <strong>$1.4 billion net cost to Ontario taxpayers by 2030</strong>. The largest component — $1.28 billion — is lost tax revenue. Alcohol sold through the LCBO and Beer Store was subject to significant provincial markups and taxes that funded public services. Alcohol sold through Loblaws, Circle K, and Costco is not. Every bottle of wine sold at a grocery store instead of an LCBO is a bottle of foregone public revenue.</p>

<p>The beneficiaries of this arrangement are not hard to identify. The <a href="https://opencouncil.ca/ford-government-alcohol-expansion/">Retail Council of Canada</a> — whose members include Loblaws, Metro, Sobeys, Walmart, and Costco — had lobbied intensively for expanded alcohol retail access. The Convenience Industry Council of Canada, representing Circle K and oil company-owned convenience chains, had done the same. These corporations now capture the profit margin on alcohol sales that previously supported Ontario's public finances. The Ford government accelerated their windfall by 18 months and billed taxpayers $225 million for the privilege.</p>

<p>The LCBO itself, in confidential corporate projections, forecast losing <a href="https://www.cbc.ca/news/canada/toronto/ontario-beer-wine-corner-stores-cost-taxpayers-1.7215839">$600 million to $915 million in annual retail sales</a> as a direct result of the privatization. As a Crown corporation whose profits flow to the provincial treasury, every dollar lost at the LCBO is a dollar not available for hospitals, schools, or transit.</p>`

  const rippling_effects = `<p>The immediate human cost fell on LCBO workers. In July 2024, more than <a href="https://www.cbc.ca/news/canada/toronto/ontario-lcbo-workers-opseu-union-strike-1.7255031">9,000 LCBO employees walked off the job</a> in the first strike in the Crown corporation's 98-year history. They were fighting for job security in the face of a privatization plan that everyone understood would eventually mean fewer LCBO stores and fewer LCBO jobs. The two-week strike ended with a contract, but the underlying threat — the systematic hollowing out of a public retail network — remained intact.</p>

<p>Beer Store locations began <a href="https://www.cbc.ca/news/canada/london/london-beer-store-latest-to-close-as-union-calls-on-ontario-voters-to-make-alcohol-sales-an-issue-1.7444834">closing across Ontario</a> as the business case for standalone alcohol retail collapsed. Communities that had relied on Beer Store locations — particularly in smaller towns where they were the only nearby option — lost them with no public consultation.</p>

<p>The FAO's $1.4 billion figure only covers impacts to December 2030. The long-term structural shift — permanently redirecting alcohol tax revenue from the public treasury to private retailers — will compound for decades. Ontario is not just losing $1.4 billion; it is permanently restructuring who profits from alcohol sales in the province, in favour of some of the country's wealthiest corporations.</p>

<p>Ford celebrated the policy as a victory for "the people" who wanted to buy beer at a corner store. The people who actually benefited were the shareholders of Loblaws, Sobeys, and Costco — who received a regulated market handed to them by government decree, at public expense, without competitive tender.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Beer Store Privatization',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2024-05-24',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: "Financial Accountability Office Report — $1.4B Net Cost",
      status: 'settled',
      url: 'https://fao-on.org/en/report/alcohol-sales-expansion/',
      description: `<p>The Financial Accountability Office of Ontario — the province's independent budget watchdog — released a comprehensive analysis in January 2025 finding that Ford's decision to expand and accelerate alcohol sales privatization would cost Ontario a <strong>net $1.4 billion by December 2030</strong>. The breakdown: $1.28 billion in lower tax revenues from the shift of alcohol sales to non-taxed private retailers, and $489 million in compensation to the wine industry and large breweries. The FAO found that $612 million of the total cost was specifically attributable to Ford's decision to <em>accelerate</em> the timeline — meaning the province paid extra to do this faster, generating no additional benefit.</p>`,
    },
    {
      title: "Beer Store Contract Termination — $225M Public Payout",
      status: 'settled',
      url: 'https://www.theglobeandmail.com/opinion/article-ontario-blowing-225-million-to-cancel-its-beer-store-contract-is-a/',
      description: `<p>In May 2024, the Ford government paid $225 million — $382,653 per day — to Molson and Labatt to exit Ontario's legally binding 10-year Beer Store agreement 18 months ahead of schedule. The contract had been signed in 2015 and represented a formal legal commitment by the province. No competitive process was run for the new arrangement; the province unilaterally broke the existing contract, absorbed the full financial penalty, and proceeded with the expansion. The payment was made without legislative approval or public consultation.</p>`,
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
    { url: 'https://fao-on.org/en/report/alcohol-sales-expansion/', title: "The Financial Impact of Expanding the Beverage Alcohol Marketplace in Ontario — Financial Accountability Office of Ontario" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-beer-wine-corner-stores-cost-taxpayers-1.7215839', title: "Why Doug Ford's booze sales plan could cost Ontario taxpayers far more than $225M — CBC News" },
    { url: 'https://www.theglobeandmail.com/opinion/article-ontario-blowing-225-million-to-cancel-its-beer-store-contract-is-a/', title: "Ontario blowing $225-million to cancel its Beer Store contract is a scandal, not something to celebrate — The Globe and Mail" },
    { url: 'https://opencouncil.ca/ford-government-alcohol-expansion/', title: "Ford's government pays $225M to Molson and Labatt to allow lobbyists' clients to sell beer ahead of schedule — Open Council" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-lcbo-workers-opseu-union-strike-1.7255031', title: "Thousands of LCBO workers on strike for 1st time after midnight deadline passes — CBC News" },
    { url: 'https://pressprogress.ca/doug-fords-alcohol-privatization-plan-will-cost-ontario-taxpayers-hundreds-of-millions-of-dollars-now-its-forcing-lcbo-workers-to-go-on-strike/', title: "Doug Ford's Alcohol Privatization Plan Will Cost Ontario Taxpayers Hundreds of Millions of Dollars — Press Progress" },
    { url: 'https://nupge.ca/2025/privatizing-liquor-sales-costs-1-4b/', title: "Privatizing the sale of some alcoholic beverages will cost Ontarians $1.4 billion — NUPGE" },
    { url: 'https://www.cbc.ca/news/canada/london/london-beer-store-latest-to-close-as-union-calls-on-ontario-voters-to-make-alcohol-sales-an-issue-1.7444834', title: "London Beer Store latest to close as union calls on Ontario voters to make alcohol sales an issue — CBC News" },
    { url: 'https://globalnews.ca/news/10758979/ontario-alcohol-expansion-financial-audit-announced/', title: "Ontario budget watchdog to probe cost of Doug Ford's alcohol expansion plan — Global News" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 Beer Store scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
