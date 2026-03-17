/**
 * Seed script: Long-Term Care COVID Deaths
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-ltc-covid.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'long-term-care-covid-deaths'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `3,758 Ontario long-term care residents died of COVID-19 — many from neglect, not the virus itself. Ford's government had promised to fix the chronically understaffed, underfunded sector before the pandemic, did nothing, had no emergency plan when outbreaks began, delayed calling in the military, and then shielded the for-profit operators responsible from any legal accountability.`

  const summary = `Ontario's long-term care homes became death traps during the COVID-19 pandemic. By the end of the first two waves, 3,758 residents had died — by far the worst LTC death toll of any Canadian province. When the Canadian Armed Forces were deployed in May 2020 to five overwhelmed homes, their internal report documented conditions so horrific it shocked the country: residents dying of dehydration, left in soiled diapers for hours, cockroaches in food preparation areas, staff not wearing PPE. Doug Ford had campaigned in 2018 on a promise to improve long-term care, raise staffing standards, and hold for-profit operators accountable. He kept none of those promises. A public commission in 2021 found Ontario had no pandemic plan for LTC homes and the government "made up its emergency response as it went along." Ford then passed legislation shielding operators from civil liability — protecting the institutions responsible for the deaths from the families of those who died.`

  const why_it_matters = `<p>When the pandemic hit, Ontario's long-term care sector was already broken. Chronic understaffing, underfunding, and a decades-long permissiveness toward for-profit operators had created conditions where basic care was routinely inadequate. Doug Ford had won the 2018 election in part by promising to fix this — to add 15,000 new LTC beds, raise the standard of care, and hold negligent operators accountable. Once in power, he did none of it.</p>

<p>When COVID-19 reached Ontario's LTC homes in March and April 2020, <a href="https://www.cbc.ca/news/canada/toronto/long-term-care-ontario-plan-1.6010266">the government had no plan</a>. The province's Long-Term Care COVID-19 Commission — a formal public inquiry that heard from more than 700 witnesses — found that Ontario was "making up its emergency response as it went along" and that LTC homes had been entirely absent from the province's pandemic planning. When Minister Merrilee Fullerton's own notes on April 17 read "Military plan needed, get them in within 24-48 hours," it took <strong>12 more days</strong> before troops were actually deployed — a delay the commission called tragic.</p>

<p>The <a href="https://www.cbc.ca/news/politics/long-term-care-pandemic-covid-coronavirus-trudeau-1.5584960">military's internal report</a>, leaked in May 2020, documented conditions inside five Ontario homes that constituted elder abuse. At <strong>Orchard Villa</strong> in Pickering — where <strong>77 of 233 residents died</strong> — troops found residents left for hours in soiled diapers, severely dehydrated and malnourished, being fed while lying flat (a practice that contributed to at least one choking death), cockroaches and flies near food preparation areas, and staff unable or unwilling to follow basic infection control. The report found that many residents had not died of COVID-19 itself, but of dehydration and neglect. As one nurse put it: <em>"All they needed was water and a wipe down."</em></p>

<p>For-profit ownership was central to the crisis. <a href="https://globalnews.ca/news/6998665/long-term-care-homes-ownership-coronavirus/">All five homes named in the military report</a> were owned by for-profit corporations. Research showed consistently that investor-owned homes had higher COVID death rates than non-profit or municipally run facilities — the inevitable outcome of a model that treats staffing as a cost to minimize. Ford's government knew this and did nothing to change the incentive structure. Instead, they passed the <strong>Liability for Damages Relating to COVID-19 Act</strong>, shielding long-term care operators from civil lawsuits — protecting the corporations, not the families.</p>

<p>By the end of the pandemic's first two waves, <a href="https://www.cbc.ca/news/canada/toronto/military-long-term-care-home-report-covid-ontario-1.5585844">3,758 Ontario LTC residents had died of COVID-19</a> — the worst toll in Canada, accounting for roughly half of all Ontario COVID deaths at one point. Ontario's rate of LTC COVID deaths was among the worst in the developed world.</p>`

  const rippling_effects = `<p>The Ontario government's response to the crisis — even after the military report shocked the country — was slow and insufficient. Ford announced a goal of 4 hours of direct daily care per resident (a standard advocates had sought for years) but <a href="https://www.globenewswire.com/news-release/2020/11/02/2118776/0/en/Ford-s-4-hour-long-term-care-announcement-too-late-Need-commitment-to-deal-with-staffing-crisis-now.html">committed only to reaching it by 2024-25</a>, four years later and after another provincial election. The Canadian Union of Public Employees surveyed LTC workplaces and found that <a href="https://cupe.ca/94-workplace-leaders-long-term-care-say-staffing-has-worsened-premier-ford-promised-act-crisis">94% of workplace leaders reported staffing had actually worsened</a> since Ford promised to act.</p>

<p>The Ford government's response to the Orchard Villa scandal was particularly revealing. Despite 77 deaths and a devastating military report, the province allowed <a href="https://www.cbc.ca/news/canada/toronto/orchard-villa-licence-renewal-1.6119717">Southbridge Care Homes to renew Orchard Villa's licence</a> and later <a href="https://beta.ctvnews.ca/local/toronto/2021/10/25/1_5637018.amp.html">awarded the company millions of dollars for new beds</a>. Families who had lost loved ones inside the home fought the licence renewal in court, arguing the province was rewarding failure. The government pressed ahead regardless.</p>

<p>The Long-Term Care COVID-19 Commission's final 322-page report in April 2021 made 85 recommendations. The Ford government accepted them in principle while implementing few substantively. Staffing levels remained dangerously low. The structural reliance on for-profit operators was unchanged. The liability shield for operators remained in place.</p>

<p>The deaths in Ontario's LTC homes during COVID-19 were not an unforeseeable tragedy. They were the predictable result of decades of neglect, accelerated by a government that had promised reform, delivered nothing, and then protected the responsible parties from accountability. No one was charged. No operator lost their licence over the deaths. The sector that killed 3,758 Ontarians emerged from the pandemic largely intact.</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'Long-Term Care COVID Deaths',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2020-05-26',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  const legalActions = [
    {
      title: "Long-Term Care COVID-19 Commission — Final Report",
      status: 'settled',
      url: 'https://www.cbc.ca/news/canada/toronto/long-term-care-ontario-plan-1.6010266',
      description: `<p>Established in June 2020, the Long-Term Care COVID-19 Commission was a formal public inquiry that heard from more than 700 witnesses over nearly a year. Its 322-page final report, released April 30, 2021, found that Ontario had <strong>no pandemic plan for long-term care homes</strong>, that the government's response was characterized by a "lack of urgency," and that the province was effectively improvising as homes descended into crisis. The commission made 85 recommendations covering staffing, accountability, and structural reform. The Ford government accepted the recommendations in principle while implementing few of the most consequential ones.</p>`,
    },
    {
      title: "Liability for Damages Relating to COVID-19 Act — Shielding Operators",
      status: 'settled',
      url: 'https://www.ontario.ca/laws/statute/20l44',
      description: `<p>Rather than holding for-profit long-term care operators accountable, the Ford government passed legislation shielding them from civil liability for COVID-19-related deaths and injuries. The law effectively barred families of deceased residents from suing the operators whose negligence contributed to their loved ones' deaths. Critics called it a sweeping protection for corporations at the expense of victims' families — written in broad terms that covered not just good-faith pandemic decisions but systematic negligence.</p>`,
    },
    {
      title: "Orchard Villa Licence Renewal Court Challenge",
      status: 'dismissed',
      url: 'https://www.cbc.ca/news/canada/toronto/orchard-villa-licence-renewal-1.6119717',
      description: `<p>Families of residents who died at Orchard Villa — where 77 of 233 residents perished and the Canadian military documented horrific neglect — challenged the Ford government's decision to renew the home's operating licence. They argued the province was rewarding a facility that had been the site of one of the worst LTC COVID outbreaks in Canada. Despite the military's damning report and the families' legal fight, the government renewed the licence and later <a href="https://beta.ctvnews.ca/local/toronto/2021/10/25/1_5637018.amp.html">approved millions in new beds for the same operator</a>.</p>`,
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
    { url: 'https://www.cbc.ca/news/politics/long-term-care-pandemic-covid-coronavirus-trudeau-1.5584960', title: "Military alleges horrific conditions, abuse in pandemic-hit Ontario nursing homes — CBC News" },
    { url: 'https://www.theglobeandmail.com/canada/article-canadian-military-report-documents-deplorable-conditions-at-two/', title: "Patients died from neglect, not COVID-19, in Ontario LTC homes, military report finds — The Globe and Mail" },
    { url: 'https://www.cbc.ca/news/canada/toronto/long-term-care-ontario-plan-1.6010266', title: "Ontario had no plan to address pandemic or protect residents in long-term care, final commission report says — CBC News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/military-long-term-care-home-report-covid-ontario-1.5585844', title: "Military report reveals what sector has long known: Ontario's nursing homes are in trouble — CBC News" },
    { url: 'https://globalnews.ca/news/6998665/long-term-care-homes-ownership-coronavirus/', title: "Who owns the 5 Ontario long-term care homes cited by military for extreme neglect, abuse? — Global News" },
    { url: 'https://www.cbc.ca/news/canada/toronto/orchard-villa-licence-renewal-1.6119717', title: "Families fight against licence renewal for LTC home that saw one of worst COVID-19 outbreaks in Ontario — CBC News" },
    { url: 'https://cupe.ca/94-workplace-leaders-long-term-care-say-staffing-has-worsened-premier-ford-promised-act-crisis', title: "94% of workplace leaders in long-term care say staffing has worsened since Premier Ford promised to act — CUPE" },
    { url: 'https://www.globenewswire.com/news-release/2020/11/02/2118776/0/en/Ford-s-4-hour-long-term-care-announcement-too-late-Need-commitment-to-deal-with-staffing-crisis-now.html', title: "Ford's 4-hour long-term care announcement too late — Ontario Health Coalition" },
    { url: 'https://www.nationalobserver.com/2020/05/26/news/military-report-finds-gruesome-conditions-abuse-inside-5-ontario-long-term-care', title: "Military report finds gruesome conditions, abuse inside 5 Ontario long-term care homes — National Observer" },
    { url: 'https://beta.ctvnews.ca/local/toronto/2021/10/25/1_5637018.amp.html', title: "Ontario long-term care company accused of leaving residents 'soiled in diapers' will get millions for new beds — CTV News" },
  ]

  for (const s of sources) {
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", url, title, "createdAt", "updatedAt")
      VALUES (${cuid()}, ${scandalId}, ${s.url}, ${s.title}, NOW(), NOW())
    `
  }
  console.log(`✅ ${sources.length} sources inserted`)
  console.log(`\n🎉 LTC COVID scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
