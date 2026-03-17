/**
 * Seed script: MZO (Minister's Zoning Orders) Scandal
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-mzo.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'mzo-ministers-zoning-orders'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `Ford's government issued 114 Minister's Zoning Orders between 2019 and 2023 — a 17-fold increase over the previous 20 years — disproportionately benefiting politically connected developers, overriding municipal planning, paving protected wetlands and farmland, and prompting a court ruling that Ford broke the law, an Auditor General finding of "preferential treatment," and an active RCMP criminal investigation.`

  const summary = `Minister's Zoning Orders (MZOs) are a power under Ontario's Planning Act allowing the Housing Minister to override local zoning for projects of provincial significance — historically used about once per year for genuine emergencies. The Ford government converted MZOs into a routine patronage mechanism, issuing 114 between 2019 and 2023. Developers who attended Ford's daughter's wedding collectively received more MZOs than the entire Liberal government issued in 15 years. The beneficiaries included the largest donors to the PC Party and Ford's personal social circle. In September 2021, the Ontario Divisional Court ruled Ford's government had broken the law by amending MZO powers without required environmental consultation. The Auditor General's December 2024 performance audit found the process gave "the appearance of preferential treatment" and lacked any structured rationale — rezoned agricultural land increased in value by 46% on average. The same network of developers threads through MZOs, the Greenbelt scandal, and Highway 413 corridor approvals.`

  const why_it_matters = `<p>Minister's Zoning Orders have existed since 1946. For most of that history they were used sparingly — roughly <a href="https://thenarwhal.ca/ministers-zoning-order-ontario-explainer/">once per year</a>, in genuine emergencies where provincial speed was necessary. The Liberal government issued 18 in 15 years. Doug Ford's government issued <a href="https://www.cbc.ca/news/canada/toronto/ontario-mzo-process-overhaul-1.7399671"><strong>114 between 2019 and 2023</strong></a> — a 17-fold increase. They were not issued because Ontario faced 114 planning emergencies. They were issued because connected developers asked for them.</p>

<p>The <a href="https://www.auditor.on.ca/en/content/annualreports/arreports/en24/pa_MZOs_en24.pdf">Auditor General's December 2024 performance audit</a> documented what critics had alleged for years: the MZO process had <strong>no structured rationale</strong>, no criteria for prioritization, and no assessment of whether an MZO was actually necessary over normal planning. None of the ministry information packages reviewed by the AG evaluated whether the tool was appropriate for the project at hand. Agricultural land that received MZOs increased in value by an average of <strong>46 per cent</strong>. That wealth transfer — from the public interest to private landowners — was engineered by a ministerial signature.</p>

<p>The political connections are not alleged — they are documented. <a href="https://globalnews.ca/news/10056992/ford-zoning-orders-ndp/">Developers who attended Ford's daughter's wedding</a> received 18 MZOs — equivalent to the Liberals' entire 15-year output. <strong>Shakir Rehmatullah</strong> of Flato Developments, who sat at Table 12 at the wedding, received <strong>nine MZOs</strong> between 2020 and 2022 — the single largest haul of any developer. <strong>Mario Cortellucci</strong> of Cortel Group, who sat at Table 10 with Ford at the same event and whose family donated over $12,000 to Ford's PC leadership campaign, received <strong>six MZOs</strong>, including one for "The Orbit" — a proposed development of 150,000 residents dropped onto prime farmland in rural Innisfil, a town of under 40,000, with no plan for water or sewage. A <a href="https://www.nationalobserver.com/2021/02/16/investigations/ford-government-mzo-fast-tracked-developments-by-donors">National Observer investigation</a> found that 14 MZOs involved sites with environmental concerns, and nine of those 14 went to developers who had donated a combined $262,915 to the PCs and Ontario Proud.</p>

<p>The most egregious single case is the Duffins Creek wetland in Pickering. In October 2020, Ford's government granted an MZO to allow construction of a massive logistics warehouse on a <a href="https://www.cbc.ca/news/canada/toronto/doug-ford-duffins-creek-wetland-pickering-ajax-warehouse-amazon-1.5942938">designated provincially significant wetland</a> — land Ontario's own rules were supposed to protect. The prospective tenant was Amazon Canada, planning what would have been the country's largest retail warehouse. When CBC revealed this, Amazon <a href="https://www.cbc.ca/news/canada/toronto/amazon-warehouse-duffins-creek-wetland-pickering-1.5947252">withdrew within two days</a>. But before pulling back, the Ford government had already introduced <a href="https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzo-pickering-duffins-creek-1.5937584">retroactive legislation to repeal the law protecting that wetland</a> — changing the rules after the fact to make the MZO legally defensible. The government also used Bill 229 to order the Toronto and Region Conservation Authority to issue a development permit on a fixed deadline, stripping environmental regulators of their ability to refuse.</p>

<p>That last point is critical. Bill 229, passed in December 2020, contained a provision <strong>forcing conservation authorities to issue development permits wherever an MZO existed</strong> — even if construction would cause flooding, erosion, or risk human safety. Conservation authorities, which exist precisely to prevent flood-risk development, were legally chained to the minister's decisions. The Ontario Divisional Court later ruled that the process used to amend MZO powers through Bill 197 was <a href="https://www.cbc.ca/news/canada/toronto/ont-mzo-court-1.6169105"><strong>unlawful</strong></a> — the government had bypassed mandatory environmental consultation requirements under the Environmental Bill of Rights. The court declared the minister had acted "unreasonably and unlawfully." Ontario Nature, which brought the challenge, had warned the government before the bill passed that consultation was legally required.</p>`

  const rippling_effects = `<p>The environmental damage is ongoing and compounding. Ontario was already losing <a href="https://thepointer.com/article/2023-10-08/despite-reversal-of-greenbelt-swaps-ford-government-doubling-down-on-projects-that-put-ontario-farmland-at-risk">319 acres of farmland per day</a> as of the 2021 census — nearly double the rate recorded five years earlier. MZOs accelerated the conversion of Class I and II agricultural land to industrial and residential sprawl across the Greenbelt's edge: in Innisfil, Beeton, Pickering, and along the Lake Simcoe watershed. Bill 229 remains on the books. Conservation authorities, whose entire mandate is to prevent flood-risk development, still cannot refuse to issue permits where an MZO exists — regardless of what their technical assessment says about flooding, erosion, or ecosystem damage.</p>

<p>The MZO scandal is not separate from the Greenbelt scandal — it is the same scandal with a different tool. The same developer network appears in both. Flato's Shakir Rehmatullah received nine MZOs and had Greenbelt land connections. TACC Developments' De Gasperis family donated over $50,000 to the PC Party and benefited from both MZO approvals and Greenbelt removals. The Duffins Rouge Agricultural Preserve — 4,700 acres of the province's highest-quality farmland, protected by a dedicated Act since 2005 — was first targeted by an MZO for the Amazon warehouse, then stripped from the Greenbelt the day after the October 2022 municipal elections. These tools worked in concert: MZOs fast-tracked development outside the Greenbelt; Greenbelt removals opened protected land to the same MZO pipeline.</p>

<p>The institutional damage extends to municipal planning. MZOs override all local zoning, all official plan policies, all community consultation, and — crucially — <strong>all rights of appeal</strong>. A municipality whose residents fought for years to protect a wetland, a floodplain, or a rural edge can do nothing when a minister signs an order. The only recourse is an expensive judicial review that falls on the municipality or an environmental organization, not the developer. Ajax spent years developing environmental policies protecting the Duffins Creek wetland; those policies were rendered meaningless overnight. The cost of challenging the MZO in court was borne by the municipality's taxpayers, not by the government that issued it.</p>

<p>The legal consequences have accumulated. Beyond the September 2021 Divisional Court ruling that Ford broke the law, the Auditor General's December 2024 report made 19 recommendations — which the government accepted in language identical to its response to every other critical audit: "in principle." Meanwhile, <a href="https://www.cbc.ca/news/canada/toronto/rcmp-criminal-investigation-ford-greenbelt-1.6991595">the RCMP's criminal investigation</a> — launched in October 2023 into the Greenbelt land swaps and the conduct of Ford government officials — explicitly encompasses the MZO approval culture that enabled it. A <a href="https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251">$2.2-million civil lawsuit</a> filed in 2025 alleges that former Ford staffers Ryan Amato and Shiv Raj promised to use "backchannel contacts" in the housing ministry and premier's office to fast-track rezoning approvals for a developer, in exchange for payment. The lawsuit describes what critics had alleged for years: a transactional culture around planning approvals in which political access was the deciding factor.</p>

<p>No developer lost an MZO they received. No MZO beneficiary was required to return the windfall from rezoning. The average 46% increase in agricultural land value represents wealth that flowed permanently to private parties based on ministerial signatures with no transparent rationale. As of early 2026, 22 Ford-era MZOs remain under active review. The RCMP investigation continues with no charges announced. The province, having entered its third Ford term, has proposed modest procedural reforms to the MZO process — none of which would make approvals appealable, require public justification, or claw back the wealth already transferred.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'MZO (Minister''s Zoning Orders) Scandal',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2021-02-16',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: "Ontario Divisional Court — Government Broke Environmental Law",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/ont-mzo-court-1.6169105',
      description: `<p>On September 3, 2021, the Ontario Divisional Court ruled that the Ford government had acted <strong>"unreasonably and unlawfully"</strong> by amending the Planning Act's MZO powers through Bill 197 without conducting mandatory consultation required under the <em>Environmental Bill of Rights, 1993</em>. The court found the Minister had failed to post the proposed changes to the Environmental Registry, depriving the public of notice and the chance to comment. Ontario Nature — which brought the challenge after warning the government before the bill passed — called the ruling a landmark protection of environmental consultation rights. The government subsequently posted the changes to the registry retroactively, but the underlying MZOs issued under the unlawfully amended powers remained in effect.</p>`,
    },
    {
      title: "Auditor General Performance Audit — MZO Process (December 2024)",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-mzo-process-overhaul-1.7399671',
      description: `<p>The Auditor General's December 2024 performance audit of the MZO process found that Ford's government issued <strong>114 MZOs between 2019 and 2023</strong> — a 17-fold increase over the previous 20 years. The AG found the process gave <strong>"the appearance of preferential treatment,"</strong> had no structured rationale or criteria for prioritizing requests, never assessed whether an MZO was actually necessary over normal planning, and lacked transparency. Agricultural land that received MZOs increased in value by an average of 46 per cent. The AG made 19 recommendations. The Ford government accepted them "in principle" with no commitment to substantive structural change, including no commitment to make MZO decisions appealable.</p>`,
    },
    {
      title: "RCMP Criminal Investigation — Greenbelt/MZO Approval Culture",
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/rcmp-criminal-investigation-ford-greenbelt-1.6991595',
      description: `<p>In October 2023, the RCMP's Sensitive and International Investigations Unit — which handles financial crimes, fraud, corruption, and illegal lobbying — launched a criminal investigation into the Ford government's Greenbelt land removals and the conduct of officials involved in planning approvals. The investigation explicitly encompasses the culture of MZO issuance and the relationships between government officials and developers who received approvals. RCMP investigators conducted interviews with people connected to the premier's office in 2024. As of early 2026, no charges have been publicly announced and the investigation remains active.</p>`,
    },
    {
      title: "Civil Lawsuit — Amato & Raj Rezoning Scheme ($2.2M)",
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251',
      description: `<p>A $2.2-million civil lawsuit filed in early 2025 alleges that former Ford housing ministry staffers <strong>Ryan Amato</strong> (who orchestrated the Greenbelt land selections) and <strong>Shiv Raj</strong> leveraged their positions in the premier's office and housing ministry to promise a developer fast-tracked rezoning approvals for three properties, in exchange for $1.5 million in payments routed through a company called Frontier "to conceal their involvement." The lawsuit describes a transactional culture in which political access — not planning merit — determined which projects received approvals, and uses the phrase "backchannel contacts" to describe how the scheme operated.</p>`,
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
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-mzo-process-overhaul-1.7399671', title: "Ontario's new housing minister to overhaul controversial MZO process after scathing auditor general report — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ont-mzo-court-1.6169105', title: "Ontario court says Ford government broke the law when it changed MZO rules — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzos-land-zoning-orders-greenbelt-1.7010332', title: "Ford government MZOs come under fresh scrutiny in wake of Greenbelt scandal — CBC News" },
    { url: 'https://www.nationalobserver.com/2021/02/16/investigations/ford-government-mzo-fast-tracked-developments-by-donors', title: "Ford government fast-tracked developments by donors through MZOs — Canada's National Observer" },
    { url: 'https://globalnews.ca/news/10056992/ford-zoning-orders-ndp/', title: "Ford wedding guests received more zoning orders than Liberals gave out in 15 years, NDP says — Global News" },
    { url: 'https://globalnews.ca/news/10899005/ontario-auditor-general-minister-zoning-orders-report/', title: "Worries of 'preferential treatment' in Ontario government's use of zoning orders: AG — Global News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/amazon-warehouse-duffins-creek-wetland-pickering-1.5947252', title: "Amazon pulls out of plan to build warehouse on protected Ontario wetland — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-mzo-pickering-duffins-creek-1.5937584', title: "Ford government retroactively changing law to allow developer to build on protected wetland — CBC News" },
    { url: 'https://www.nationalobserver.com/2021/03/09/news/doug-ford-government-approves-6-new-zoning-orders-backlash', title: "Doug Ford government approves 6 new zoning orders as backlash grows — Canada's National Observer" },
    { url: 'https://thenarwhal.ca/ministers-zoning-order-ontario-explainer/', title: "What is a minister's zoning order and why is it so controversial? — The Narwhal" },
    { url: 'https://www.auditor.on.ca/en/content/annualreports/arreports/en24/pa_MZOs_en24.pdf', title: "Performance Audit: Use of Minister's Zoning Orders — Auditor General of Ontario (December 2024)" },
    { url: 'https://ontarionature.org/news-release/court-declares-ontario-government-broke-the-law/', title: "Court declares Ontario government broke the law — Ontario Nature" },
    { url: 'https://www.cbc.ca/news/canada/toronto/lawsuit-rezoned-land-amato-raj-ford-government-1.7452251', title: "Lawsuit alleges former Ford staffers promised to use 'backchannel contacts' to get land rezoned — CBC News" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 MZO scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
