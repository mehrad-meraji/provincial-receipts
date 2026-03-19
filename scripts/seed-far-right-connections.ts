/**
 * Seed script: Ford Government Far-Right Connections (Ghamari/Robinson, Lawton, Goldy, Hillier)
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-far-right-connections.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'pc-far-right-connections'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `A documented pattern of Ontario PC associations with far-right figures: Ford personally appointed a Rebel Media host who defended Holocaust denial as a candidate (2018), posed for a photo with known white nationalist Faith Goldy and refused to denounce her by name for two days (2018), maintained a former MPP with documented Diagolon neo-fascist ties in his caucus until 2019 (Randy Hillier), and in June 2024 ejected MPP Goldie Ghamari after she publicized a meeting with Tommy Robinson — founder of the English Defence League — after months of documented Islamophobia within caucus.`

  const summary = `<p>Since Doug Ford became Premier in 2018, the Ontario Progressive Conservative caucus has experienced a documented pattern of associations with far-right, white nationalist, and anti-Muslim figures. The incidents span from Ford's own campaign decisions to the conduct of his elected MPPs — and in each case, Ford's response has been slow, insufficient, or absent until public pressure made action unavoidable.</p>
<p>In April 2018, Ford used his authority as party leader to hand-pick candidates in 11 ridings, bypassing local nomination processes. One of those appointees was <strong>Andrew Lawton</strong>, a former <a href="https://pressprogress.ca/doug-ford-appointed-a-far-right-former-rebel-media-host-to-run-as-an-ontario-pc-candidate/" target="_blank" rel="noopener noreferrer">Rebel Media host who had argued that Holocaust denial should be protected free speech</a> — that "every single question," including whether the Holocaust "actually happened," should be debatable. He had also made statements saying German women "deserve to have something happen" in response to refugee policies. When asked about Lawton's record, Ford said he was <a href="https://globalnews.ca/news/4194333/doug-ford-andrew-lawton-london-west/" target="_blank" rel="noopener noreferrer">"happy to have Andrew on as one of the candidates."</a> Lawton lost to the NDP incumbent in London West.</p>
<p>In September 2018, at Ford's annual "Ford Fest" barbecue, Faith Goldy — a far-right commentator who had been fired from Rebel Media the previous year after praising neo-Nazis at the Charlottesville rally and appearing on <em>The Daily Stormer</em> podcast — was photographed alongside Ford. During her 2018 Toronto mayoral campaign, Goldy posted the photo publicly. Ford refused for two days to denounce Goldy by name when asked directly by journalists, offering only general statements against "hate speech." <a href="https://www.nationalobserver.com/2018/09/27/news/we-asked-all-76-members-doug-fords-progressive-conservative-caucus-if-they-would" target="_blank" rel="noopener noreferrer">National Observer contacted all 76 members of Ford's PC caucus</a> — not one said Ford should apologize for the photo. Ford eventually issued a tweet condemning racism "from Faith Goldy or anyone else."</p>
<p>In June 2024, MPP <strong>Goldie Ghamari</strong> publicly posted a screenshot of a virtual meeting she had arranged with <strong>Tommy Robinson</strong> (Stephen Christopher Yaxley-Lennon), the founder of the English Defence League, a UK far-right street movement, who had been arrested in Calgary for misrepresenting himself to Canadian immigration officials while on a Rebel Media-sponsored tour. Ghamari claimed she hadn't known Robinson's history. Ford <a href="https://www.cbc.ca/news/canada/ottawa/goldie-ghamari-ousted-from-pc-caucus-after-meeting-with-anti-islam-campaigner-1.7249652" target="_blank" rel="noopener noreferrer">removed Ghamari from the PC caucus "effective immediately,"</a> calling her claim of ignorance a reflection of serious lapses in judgment. She sat as an independent MPP. This came months after the National Council of Canadian Muslims had already demanded Ghamari's removal from caucus over documented Islamophobic social media posts — which Ford had not acted on.</p>`

  const why_it_matters = `<p>The Ghamari case is notable not only for what happened in June 2024, but for what Ford failed to do in November 2023, when the National Council of Canadian Muslims and the Canadian Muslim Public Affairs Council sent an open letter to Ford demanding action after Ghamari described the Islamic phrase "Allahu Akbar" as a safety concern, called the hijab a "symbol of the subjugation of women," and accused an NDP Muslim MPP of being a "terrorist sympathizer." <a href="https://www.thetrillium.ca/queens-park-today-archive/ontario-mpp-goldie-ghamari-accused-of-islamophobia-again-11192861" target="_blank" rel="noopener noreferrer">The Trillium documented these incidents in detail.</a> Ford did not act. Only when Ghamari's conduct became internationally embarrassing — through the Robinson photo — did removal follow.</p>
<p>The pattern with <strong>Randy Hillier</strong> runs even deeper. Hillier served as an Ontario PC MPP from 2007 until Ford removed him from caucus in 2019 — not over far-right connections, but for making offensive comments directed at the parents of autistic children. Hillier continued as an independent MPP, became one of the primary political figures supporting the January–February 2022 Ottawa "Freedom Convoy" occupation, and was subsequently <a href="https://pressprogress.ca/photo-shows-ontario-mpp-randy-hillier-with-flag-of-group-linked-to-armed-freedom-convoy-plot/" target="_blank" rel="noopener noreferrer">photographed with a Diagolon flag</a>. Diagolon is a Canadian neo-fascist accelerationist movement whose members were linked to the Coutts, Alberta border blockade — where a cache of firearms, body armour, and Diagolon-patched gear was seized and four individuals were charged with conspiracy to murder RCMP officers. Hillier had appeared as a guest on livestreams hosted by Jeremy MacKenzie, Diagolon's de facto leader.</p>
<p>These incidents are not isolated errors by individual MPPs. They reflect a structural problem: the Ford PC party's coalition includes segments of the far-right, and the party's response to documented far-right conduct within its ranks has been consistently delayed, insufficient, and conditional on whether the conduct created political embarrassment rather than genuine harm. In Lawton's case, Ford knowingly appointed someone with documented extremist statements. In Goldy's case, Ford refused to denounce a white nationalist by name for two days. In Ghamari's case, Ford ignored months of documented Islamophobia before acting on the more internationally visible Robinson incident.</p>`

  const rippling_effects = `<p>The Rebel Media connection is a through-line in these incidents. Lawton was a Rebel Media host. Goldy was fired from Rebel Media. Robinson's Canadian tour was organized by Rebel Media's founder Ezra Levant. The Ford government's tolerance of far-right figures who circulate in Rebel Media networks — until international attention forces action — suggests the party has calculated that this segment of its base is politically valuable enough to accommodate until incidents become publicly untenable.</p>
<p>The broader Ontario context matters: the 2022 "Freedom Convoy" occupation of Ottawa was explicitly supported by Hillier, a former Ford PC MPP, and drew participation from documented far-right and white nationalist groups including Diagolon and the Three Percenters. Ford's own response to the occupation was widely criticized as slow and disengaged; the Emergencies Act inquiry found Ford's lack of engagement left Ottawa residents feeling "abandoned" by provincial authority. The connections between Ford's Ontario political world and the convoy's organizers were never formally investigated.</p>
<p>For Ontario's Jewish, Muslim, and racialized communities — which include some of Canada's largest and most established communities — the Ford government's pattern of accommodation, delayed response, and political calculation around far-right conduct represents a sustained failure of leadership. Each incident generates a cycle of demands from community organizations, non-response from the Premier, eventual minimal action, and a return to normalcy — until the next incident.</p>`

  console.log('Inserting PC Far-Right Connections scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'PC Far-Right Connections — Ghamari, Lawton, Goldy, Hillier'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2018-04-01'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Goldie Ghamari Ejected from PC Caucus After Tommy Robinson Meeting (June 2024)',
      status: 'Completed',
      description: `<p>In June 2024, Ford removed Goldie Ghamari from the PC caucus after she publicized a virtual meeting with Tommy Robinson — founder of the English Defence League and a convicted criminal with extensive ties to the UK far-right — who was in Canada on a Rebel Media-sponsored tour and had been arrested for misrepresenting himself to immigration officials. Ghamari had already been the subject of formal complaints from Muslim community organizations over documented Islamophobic social media posts in November 2023, which Ford's office had not acted on. Her removal came only after the Robinson meeting generated international media coverage.</p>`,
      url: 'https://www.cbc.ca/news/canada/ottawa/goldie-ghamari-ousted-from-pc-caucus-after-meeting-with-anti-islam-campaigner-1.7249652',
    },
    {
      title: 'Ford Appoints Holocaust-Denial-Adjacent Rebel Media Host as PC Candidate (2018)',
      status: 'Completed',
      description: `<p>In April 2018, Ford hand-picked Andrew Lawton — a former Rebel Media host who had argued Holocaust denial should be "debatable" as free speech and made statements expressing hostility toward German women and refugees — as the Ontario PC candidate for London West, bypassing the local nomination process. When the record was surfaced by media and community organizations, Ford said he was "happy to have Andrew on." Lawton lost to the NDP incumbent in the June 2018 election. The Ford government never formally addressed the standards applied to hand-picked candidates.</p>`,
      url: 'https://pressprogress.ca/doug-ford-appointed-a-far-right-former-rebel-media-host-to-run-as-an-ontario-pc-candidate/',
    },
    {
      title: 'Randy Hillier — Former Ford PC MPP Photographed with Diagolon Flag (2022)',
      status: 'Completed',
      description: `<p>Randy Hillier, a former Ontario PC MPP who Ford removed from caucus in 2019 (over unrelated offensive comments), became one of the primary political supporters of the 2022 Ottawa Freedom Convoy occupation. PressProgress published a photo of Hillier posing with a Diagolon flag at a gathering — Diagolon being a Canadian neo-fascist organization whose members were linked to the Coutts, Alberta convoy blockade where four individuals were charged with conspiracy to murder RCMP officers. Hillier also appeared on livestreams hosted by Diagolon's de facto leader, Jeremy MacKenzie. Hillier faced nine criminal charges related to convoy activities; these were ultimately stayed by a judge in 2024 due to trial delay.</p>`,
      url: 'https://pressprogress.ca/photo-shows-ontario-mpp-randy-hillier-with-flag-of-group-linked-to-armed-freedom-convoy-plot/',
    },
  ]

  for (const la of legalActions) {
    const laId = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${laId}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, ${now}, ${now})
    `
    console.log(`  ✅ Legal action: ${la.title.substring(0, 65)}...`)
  }

  const sources = [
    { title: 'CBC — Ghamari ousted from PC caucus after meeting with Tommy Robinson', url: 'https://www.cbc.ca/news/canada/ottawa/goldie-ghamari-ousted-from-pc-caucus-after-meeting-with-anti-islam-campaigner-1.7249652' },
    { title: 'Global News — Ontario PC MPP kicked out of caucus over far-right meeting', url: 'https://globalnews.ca/news/10594060/goldie-ghamari-tommy-robinson-kicked-from-caucus/' },
    { title: 'Globe and Mail — Ford kicks backbencher out of Ontario PC caucus', url: 'https://www.theglobeandmail.com/canada/article-ford-kicks-backbencher-out-of-ontario-pc-caucus-after-she-met-with-far/' },
    { title: 'The Trillium — Ghamari accused of Islamophobia, again (November 2023)', url: 'https://www.thetrillium.ca/queens-park-today-archive/ontario-mpp-goldie-ghamari-accused-of-islamophobia-again-11192861' },
    { title: 'PressProgress — Ford appointed a far-right Rebel Media host as PC candidate', url: 'https://pressprogress.ca/doug-ford-appointed-a-far-right-former-rebel-media-host-to-run-as-an-ontario-pc-candidate/' },
    { title: 'PressProgress — Ontario PC candidate: Let students debate whether Holocaust "actually happened"', url: 'https://pressprogress.ca/ontario-pc-candidate-let-students-debate-whether-the-holocaust-actually-happened/' },
    { title: 'Global News — Ford "happy to have" Lawton despite past statements', url: 'https://globalnews.ca/news/4194333/doug-ford-andrew-lawton-london-west/' },
    { title: 'HuffPost Canada — Doug Ford embracing Faith Goldy at Ford Fest', url: 'https://www.huffpost.com/archive/ca/entry/doug-ford-faith-goldy-photo_a_23542836' },
    { title: 'National Observer — We asked all 76 members of Ford\'s PC caucus to denounce Faith Goldy', url: 'https://www.nationalobserver.com/2018/09/27/news/we-asked-all-76-members-doug-fords-progressive-conservative-caucus-if-they-would' },
    { title: 'Vice Canada — Premier Ford still won\'t disavow white nationalist Faith Goldy', url: 'https://www.vice.com/en/article/premier-doug-ford-still-wont-disavow-white-nationalist-faith-goldy/' },
    { title: 'PressProgress — Photo shows Ontario MPP Randy Hillier with Diagolon flag', url: 'https://pressprogress.ca/photo-shows-ontario-mpp-randy-hillier-with-flag-of-group-linked-to-armed-freedom-convoy-plot/' },
    { title: 'CBC — Hillier arrested on nine convoy-related charges', url: 'https://www.cbc.ca/news/canada/ottawa/randy-hillier-arrest-protest-convoy-ottawa-mpp-1.6399669' },
    { title: 'Global News — Hillier\'s Freedom Convoy charges stayed by judge', url: 'https://globalnews.ca/news/10872300/randy-hillier-freedom-convoy-charges-stayed/' },
    { title: 'Global News — Opposition moves to remove Ghamari from committee chair role', url: 'https://globalnews.ca/news/10627614/ontario-goldie-ghamari-justice-committee-chair-removal-motion/' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 PC Far-Right Connections scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
