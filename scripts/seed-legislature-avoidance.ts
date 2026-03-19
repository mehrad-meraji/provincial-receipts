/**
 * Seed script: Legislature Avoidance — Ford's Accountability Deficit
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-legislature-avoidance.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'legislature-avoidance'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `The Ford government has systematically minimized time spent in the Ontario Legislature — the only venue where the Premier faces mandatory daily questioning. In 2019, Ford took the longest legislative break in 25 years. In 2024, sitting days were cancelled so the legislature didn't return until six weeks after the scheduled date. In all of 2025, the government sat just 51 days out of 365. Ford then called a snap election in January 2025 — well ahead of the scheduled June 2026 date — dissolving the legislature while RCMP investigations, Auditor General findings, and FOI battles were all active.`

  const summary = `<p>Question Period is the only mechanism in Ontario's parliamentary system that compels the Premier and cabinet to face daily public questioning from elected opposition members. It cannot happen when the legislature is not sitting. Ford's government has used every available tool — extended summer recesses, cancelled fall sitting days, strategic prorogations, and a snap election — to minimize the time it spends subject to that scrutiny.</p>
<p>The pattern began in 2019, when Ford took a five-month summer recess — <a href="https://globalnews.ca/news/6090854/ontario-legislature-resumes/" target="_blank" rel="noopener noreferrer">the longest legislative break Ontario had seen in almost 25 years</a>. In 2024, the legislature rose early for summer break and then cancelled the scheduled September sitting days entirely, with MPPs not returning until October 21 — <a href="https://globalnews.ca/news/10550552/ontario-legislature-summer-break-2024/" target="_blank" rel="noopener noreferrer">six weeks after the originally agreed return date of September 9</a>. Critics noted that this extended absence came while the Greenbelt RCMP investigation was active, Auditor General reports were being prepared, and multiple FOI battles over the government's own conduct were playing out in court.</p>
<p>In all of 2025, after the snap election returned Ford to power with a third majority, the Ontario Legislature <a href="https://globalnews.ca/news/11573994/ford-government-winter-break-end-of-session/" target="_blank" rel="noopener noreferrer">sat just 51 days out of 365</a> — roughly 14% of the year. The government had only 28 sitting days in the fall of 2024, 28 in the spring of 2025, and 28 again in the fall of 2025. Each session was among the shortest in recent provincial memory.</p>`

  const why_it_matters = `<p>The snap election call of January 2025 — dissolving the legislature 18 months before it was scheduled — was the most consequential accountability avoidance mechanism of the Ford era. Ford asked Lieutenant Governor Edith Dumont to dissolve the legislature on January 29, 2025, triggering a February 27 vote. The timing was striking: the <a href="https://www.cbc.ca/news/canada/toronto/ontario-election-questions-1.7443931" target="_blank" rel="noopener noreferrer">Auditor General's bombshell Ontario Place/Therme report had been released just weeks earlier in December 2024</a>, finding the province's $2.24 billion deal with the Austrian spa company "not fair, transparent or accountable." The RCMP Greenbelt criminal investigation was ongoing with no charges yet laid. FOI litigation over Ford's personal cellphone records was unresolved. Multiple Integrity Commissioner investigations were active. An election reset the political clock on all of them.</p>
<p>A legislature that rarely sits is a legislature that passes fewer laws — but the Ford government has found a workaround: <strong>omnibus bills</strong>. When the government does sit, it typically passes massive multi-subject bills under time allocation motions that limit debate. Bills 5, 60, 212, and 257 — each of which made sweeping changes to environmental, water, transportation, and planning law — were pushed through with minimal committee study and limited opposition speaking time. The combination of few sitting days and truncated debate when the House is in session means major legislation passes with less public scrutiny than almost any period in recent Ontario history.</p>
<p>The Globe and Mail's analysis found that <a href="https://www.theglobeandmail.com/canada/article-provincial-and-territorial-legislatures-spend-fewer-days-in-session/" target="_blank" rel="noopener noreferrer">provincial legislatures across Canada have been spending fewer days in session</a> over the past decade — but Ontario's decline under Ford has been steeper than most. Critics including the Ontario NDP noted that 51 sitting days in a full calendar year means Ford faced mandatory public questioning from the legislature for less than one day in seven — in a year when his government passed legislation on water privatization, highway construction, homelessness criminalization, endangered species protection, and post-secondary funding.</p>`

  const rippling_effects = `<p>The accountability gap created by minimal sitting time is compounding. Each question period missed is a day's worth of documented government positions, forced clarifications, and public record that doesn't exist. Each cancelled sitting week is committee hearings that don't happen, witnesses who aren't called, documents that aren't tabled. Ontario's parliamentary record for the Ford years is thinner than it should be — not because the government is governing less, but because the formal mechanisms of accountability have been systematically reduced while government activity (and its controversies) have continued unabated.</p>
<p>The 2025 snap election illustrated how the avoidance strategy interacts with democratic timing. Ford called the election citing federal uncertainty under the Liberal government — but the practical effect was to go to voters before the Greenbelt RCMP investigation concluded, before a reckoning with the Ontario Place costs was fully absorbed, and before the FOI legislation stripping the Premier's office of accountability obligations had been introduced (it came in March 2026, after the election). He won a third majority. The scandals that were live during the election campaign were not fully adjudicated by voters because the full information was not yet public — partly because his own government had been fighting to suppress it.</p>
<p>Ford's approach to legislative accountability represents a coherent theory of minority-time governance: the less time spent in the chamber, the fewer the opportunities for the opposition to force accountability, the freer the government is to act between sessions. When combined with the proposed FOI changes that would exempt the Premier's and cabinet ministers' offices from public records law entirely, the picture that emerges is of a government that has systematically dismantled each mechanism — legislative sitting time, Freedom of Information, Integrity Commissioner referrals — through which citizens might hold it accountable.</p>`

  console.log('Inserting Legislature Avoidance scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Legislature Avoidance — Ford\'s Accountability Deficit'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2019-10-28'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: '2019 — Five-Month Recess: Longest Break in 25 Years',
      status: 'Completed',
      description: `<p>In 2019, Ford's government took a summer recess that extended to five months — the longest legislative break Ontario had seen in almost 25 years. The extended recess drew criticism from opposition parties and accountability advocates who noted the legislature is the only venue where the Premier faces mandatory daily questioning. Ford's government offered no explanation for the extended absence beyond standard scheduling.</p>`,
      url: 'https://globalnews.ca/news/6090854/ontario-legislature-resumes/',
    },
    {
      title: '2024 — September Sitting Days Cancelled; Six-Week Extension of Summer Break',
      status: 'Completed',
      description: `<p>In 2024, the legislature rose early for the summer and then cancelled the scheduled September sitting days entirely, with MPPs not returning until October 21 — six weeks after the agreed return date of September 9. The extended absence came while the Greenbelt RCMP investigation was active, the Ontario Place Auditor General report was being prepared, and multiple FOI court battles were underway. Opposition parties accused the government of deliberate accountability avoidance. The government offered no public explanation for cancelling the September sittings.</p>`,
      url: 'https://globalnews.ca/news/10550552/ontario-legislature-summer-break-2024/',
    },
    {
      title: 'January 2025 — Snap Election Called 18 Months Early, Dissolving All Accountability Processes',
      status: 'Completed',
      description: `<p>On January 29, 2025, Ford asked Lieutenant Governor Edith Dumont to dissolve the legislature 18 months before the scheduled June 2026 election date, triggering a February 27 vote. The snap election came weeks after the Auditor General's Ontario Place bombshell report, while the Greenbelt RCMP criminal investigation was ongoing, while FOI litigation over Ford's personal cellphone records was unresolved, and while multiple Integrity Commissioner investigations were active. Calling the election reset the political clock before these accountability processes could conclude. Ford won a third majority on February 27, 2025.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-election-questions-1.7443931',
    },
    {
      title: '2025 — Legislature Sits Just 51 Days out of 365',
      status: 'Completed',
      description: `<p>In 2025, following the snap election that returned Ford with a third majority, the Ontario Legislature sat for just 51 days out of 365 — approximately 14% of the year. The government sat roughly 28 days each in the fall 2024, spring 2025, and fall 2025 sessions. Ontario NDP critics publicly documented the figure: "51 out of 365 days." The government passed major legislation on water privatization, endangered species, housing, homelessness, and highway construction during this period, often under time allocation motions that limited opposition debate to hours per bill.</p>`,
      url: 'https://globalnews.ca/news/11573994/ford-government-winter-break-end-of-session/',
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
    { title: 'Global News — Ontario legislature resumes after longest break in almost 25 years (2019)', url: 'https://globalnews.ca/news/6090854/ontario-legislature-resumes/' },
    { title: 'CTV News — Ontario legislature resumes after longest break in nearly 25 years', url: 'https://www.ctvnews.ca/canada/ontario-legislature-resumes-with-new-tone-after-longest-break-in-nearly-25-years-1.4659155' },
    { title: 'Global News — Ontario legislature rises early for extended summer break (2024)', url: 'https://globalnews.ca/news/10550552/ontario-legislature-summer-break-2024/' },
    { title: 'CBC — Ontario legislature resumes; critics say Ford keener on electioneering (2024)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-legislature-resumes-monday-1.7357749' },
    { title: 'Global News — After sitting 51 days in 2025, Ford government embarks on winter break', url: 'https://globalnews.ca/news/11573994/ford-government-winter-break-end-of-session/' },
    { title: 'Ontario NDP — Ford government sat 51 out of 365 days', url: 'https://www.facebook.com/OntarioNDP/posts/why-do-you-think-doug-fords-government-has-only-sat-for-51-out-of-365-days-this-/1397462831740868/' },
    { title: 'CBC — What you need to know about Ontario\'s early election call (January 2025)', url: 'https://www.cbc.ca/news/canada/toronto/ontario-election-questions-1.7443931' },
    { title: 'Globe and Mail — Provincial legislatures spend fewer days in session than a decade ago', url: 'https://www.theglobeandmail.com/canada/article-provincial-and-territorial-legislatures-spend-fewer-days-in-session/' },
    { title: 'Legislative Assembly of Ontario — Parliamentary Calendars', url: 'https://www.ola.org/en/legislative-business/parliamentary-calendars' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 Legislature Avoidance scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
