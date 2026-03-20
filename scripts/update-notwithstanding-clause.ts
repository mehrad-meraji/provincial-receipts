/**
 * Update script: Notwithstanding Clause scandal — add SCC ruling on Bill 307,
 * bike lane threat timeline event, and additional sources
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/update-notwithstanding-clause.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'notwithstanding-clause'
  const now = new Date().toISOString()

  const rows = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (rows.length === 0) {
    console.error('❌ Scandal not found. Run seed-notwithstanding-clause.ts first.')
    process.exit(1)
  }
  const scandalId = rows[0].id
  console.log(`Found scandal id: ${scandalId}`)

  // Update the Bill 307 legal action to include the full court record (CoA 2023 + SCC 2025)
  const la307 = await sql`
    SELECT id FROM "LegalAction"
    WHERE "scandalId" = ${scandalId}
    AND title LIKE '%Bill 307%'
    LIMIT 1
  `
  if (la307.length > 0) {
    const newDesc = `<p>In June 2021, the Ford government passed Bill 307 — the Protecting Elections and Defending Democracy Act — reinstating third-party election advertising spending limits that a court had already struck down as a Section 2(b) violation. Rather than revise the limits to pass constitutional scrutiny, the government pre-emptively embedded Section 33 directly in the bill's text, shielding it from Charter review for five years. It was <strong>Ontario's first actual invocation of the notwithstanding clause in provincial history</strong> — Ontario had never used Section 33 in 39 years before Ford. No court had ruled on this new bill; the government used the clause as insurance against a challenge it expected to lose. Critics including the Ontario Federation of Labour and Elementary Teachers' Federation argued the restrictions were designed to silence union-funded advertising critical of the Ford government before the 2022 election.</p>
<p><strong>The notwithstanding clause failed.</strong> In March 2023, the Ontario Court of Appeal struck down Bill 307, ruling it "unjustifiably infringed" on rights to meaningfully participate in provincial elections. Critically, the Court found the law violated <strong>Section 3 of the Charter — the right to vote — which is expressly excluded from Section 33's reach.</strong> The notwithstanding clause cannot override Section 3. The Ford government appealed to the Supreme Court of Canada. On March 28, 2025, the Supreme Court upheld the Court of Appeal's ruling in a 5-4 decision, definitively striking down the election advertising restrictions. Ford's government lost the case at every appellate level, and the notwithstanding clause provided no protection because the wrong rights were infringed.</p>`
    await sql`
      UPDATE "LegalAction"
      SET description = ${newDesc},
          status = ${'Struck Down — Court of Appeal 2023, SCC 2025'},
          url = ${'https://www.cbc.ca/news/canada/toronto/ontario-election-advertising-supreme-court-ruling-1.7477371'},
          "updatedAt" = ${now}
      WHERE id = ${la307[0].id}
    `
    console.log('✅ Updated Bill 307 legal action with full court outcomes (CoA 2023 + SCC 2025)')
  }

  // Add a new legal action for Bill 212 / bike lane threat (2024)
  const existingBike = await sql`
    SELECT id FROM "LegalAction"
    WHERE "scandalId" = ${scandalId}
    AND title LIKE '%212%'
    LIMIT 1
  `
  if (existingBike.length === 0) {
    const bikeId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (
        ${bikeId},
        ${scandalId},
        ${'Bill 212 — Bike Lane Removal Struck Down; Ford Threatens Section 33 Again (2024-2025)'},
        ${'Court of Appeal Pending'},
        ${'<p>In November 2024, Ford\'s government passed Bill 212 — the Reducing Gridlock, Saving You Time Act — requiring the Transportation Minister to remove protected bike lanes on Bloor Street, Yonge Street, and University Avenue in Toronto. Ontario Superior Court Justice Paul Schabas struck down the bike lane removal provisions, finding they would put people at "increased risk of harm and death" and violated the Charter. Ford called the ruling "ridiculous" and publicly floated the possibility of invoking the notwithstanding clause to override it — the fourth time his government had threatened or used Section 33. As of early 2026, the matter was before the Court of Appeal for Ontario. Ford had not formally invoked Section 33, but his willingness to raise it as a response to a court ruling on public safety demonstrated the degree to which the clause had become a reflexive political instrument under his government.</p>'},
        ${'https://thenarwhal.ca/ford-notwithstanding-toronto-bike-lanes/'},
        ${now},
        ${now}
      )
    `
    console.log('✅ Added Bill 212 / bike lane threat legal action')
  } else {
    console.log('⚠️  Bill 212 legal action already exists, skipping')
  }

  // Add additional sources from research
  const newSources = [
    { title: 'CBC News — Ontario election advertising spending limits unconstitutional, Supreme Court finds (March 2025)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-election-advertising-supreme-court-ruling-1.7477371' },
    { title: 'ETFO — Supreme Court confirms Ford government\'s attack on democracy was unconstitutional', url: 'https://www.etfo.ca/news-publications/media-releases/supreme-court-confirms-ford-government%E2%80%99s-attack-on-democracy-was-unconstitutional' },
    { title: 'Court of Appeal for Ontario — Bill 307 Declared Unconstitutional (March 2023)', url: 'https://www.sherrardkuzz.com/newsblast/court-of-appeal-for-ontario-declares-bill-307-unconstitutional/' },
    { title: 'CBC News — Ford invokes notwithstanding clause to push through Toronto council reduction (September 2018)', url: 'https://www.cbc.ca/news/canada/toronto/judge-ruling-city-council-bill-election-1.4816664' },
    { title: 'The Narwhal — Doug Ford floats notwithstanding clause in Toronto bike lanes case (2025)', url: 'https://thenarwhal.ca/ford-notwithstanding-toronto-bike-lanes/' },
    { title: 'Amnesty International Canada — Welcomes repeal of \'chilling\' Ontario anti-strike Bill 28', url: 'https://amnesty.ca/press-releases/ontario-bill-28/' },
    { title: 'Canadian Civil Liberties Association — Bill 28 and the Notwithstanding Clause', url: 'https://ccla.org/major-cases-and-reports/bill-28/' },
    { title: 'CP24 — Ford says he won\'t use notwithstanding clause for Bill 124 (contrast case)', url: 'https://www.cp24.com/news/ford-says-he-won-t-use-notwithstanding-clause-to-fight-bill-124-after-court-ruling-1.6177033' },
    { title: 'The Conversation — Doug Ford uses the notwithstanding clause for political benefit', url: 'https://theconversation.com/doug-ford-uses-the-notwithstanding-clause-for-political-benefit-162594' },
  ]

  let addedSources = 0
  for (const src of newSources) {
    const existing = await sql`SELECT id FROM "ScandalSource" WHERE "scandalId" = ${scandalId} AND url = ${src.url} LIMIT 1`
    if (existing.length === 0) {
      await sql`
        INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
        VALUES (${cuid()}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
      `
      addedSources++
    }
  }
  console.log(`✅ Added ${addedSources} new sources`)

  // Add timeline events for Bill 212 bike lane and SCC ruling
  const newTimelines = [
    {
      date: '2023-03-01',
      label: 'Court of Appeal strikes down Bill 307 — notwithstanding clause cannot protect Section 3 violations',
      icon: 'Gavel',
      url: 'https://www.sherrardkuzz.com/newsblast/court-of-appeal-for-ontario-declares-bill-307-unconstitutional/',
    },
    {
      date: '2024-11-01',
      label: 'Bill 212 passes — Ford threatens Section 33 after court strikes down Toronto bike lane removals',
      icon: 'AlertTriangle',
      url: 'https://thenarwhal.ca/ford-notwithstanding-toronto-bike-lanes/',
    },
    {
      date: '2025-03-28',
      label: 'Supreme Court strikes down Bill 307 election ad limits 5-4 — Ford\'s notwithstanding clause fails',
      icon: 'Gavel',
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-election-advertising-supreme-court-ruling-1.7477371',
    },
  ]

  let addedTimelines = 0
  for (const te of newTimelines) {
    const existing = await sql`SELECT id FROM "TimelineEvent" WHERE label = ${te.label} LIMIT 1`
    if (existing.length === 0) {
      await sql`
        INSERT INTO "TimelineEvent" (id, date, label, icon, url, published, "createdAt", "updatedAt")
        VALUES (${cuid()}, ${te.date}, ${te.label}, ${te.icon}, ${te.url}, ${true}, ${now}, ${now})
      `
      addedTimelines++
    }
  }
  console.log(`✅ Added ${addedTimelines} new timeline events`)

  // Update the rippling_effects to mention the SCC ruling and bike lane threat
  const updatedRipplingEffects = `<p>CUPE education workers struck on November 4, 2022 — defying Bill 28 and its fines. The Ontario Federation of Labour announced a general strike for November 14. Unions representing millions of Canadian workers mobilized: Unifor, the BC Teachers' Federation, national CUPE, and others. The BC Teachers' Federation sent $1 million in strike support. What Ford had characterized as a dispute over 55,000 education support workers became the largest labour mobilization Canada had seen in decades. Facing a general strike, Ford held a press conference and announced he would repeal the bill "as a sign of good faith." Bill 35 — the repeal — passed unanimously on November 14, the same day it was introduced. CUPE National President Mark Hancock stood with other labour leaders and said: <em>"The government blinked."</em></p>
<p>Ford's first formal invocation of Section 33 — Bill 307 on election advertising — also failed, though by a different mechanism. In March 2023, the Ontario Court of Appeal struck down Bill 307, finding it violated Section 3 of the Charter — the right to vote. Section 3 is expressly excluded from the notwithstanding clause's reach: Ford's government had invoked Section 33, but invoked it against the wrong rights. The government appealed. In March 2025, the Supreme Court of Canada upheld the ruling in a 5-4 decision. Every court above the Superior Court that considered Bill 307 found it unconstitutional. The notwithstanding clause provided no protection. The law was void.</p>
<p>By 2024, Ford had threatened Section 33 a fourth time — after an Ontario Superior Court justice struck down provisions of Bill 212 requiring the removal of protected bike lanes in Toronto, finding they posed risks to public safety. Ford called the ruling "ridiculous" and raised the possibility of invoking the clause. The case was before the Court of Appeal as of early 2026. The pattern — court strikes down legislation, Ford threatens or uses Section 33 — had by then repeated itself enough times that constitutional scholars were describing it as a governing reflex rather than an exceptional constitutional response.</p>
<p>The constitutional implications of Ford's notwithstanding clause pattern extend beyond the individual bills. Legal scholars have noted that the Ford government has used the clause not in response to profound conflicts between legislative will and judicial overreach — the circumstances the clause was designed for — but as a pre-emptive shield for legislation the government expects to lose in court. This use has been called "weaponization" of Section 33 by constitutional law experts. It treats the clause not as an extraordinary override of last resort but as a routine policy insulation tool — or, when that fails, a political threat. Ontario had never used Section 33 in its 39-year history before Ford. He has invoked or threatened it four times in seven years. Both formal invocations have been reversed — one by the general strike threat that made it politically untenable, one by courts that found the clause couldn't protect the rights it claimed to override.</p>`

  await sql`
    UPDATE "Scandal"
    SET rippling_effects = ${updatedRipplingEffects}, "updatedAt" = ${now}
    WHERE id = ${scandalId}
  `
  console.log('✅ Updated rippling_effects with SCC ruling and bike lane context')

  console.log('\n🎉 Notwithstanding Clause scandal updated successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
