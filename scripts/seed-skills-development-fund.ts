/**
 * Seed script: Skills Development Fund Patronage Scandal
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-skills-development-fund.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'skills-development-fund'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()
  const now = new Date().toISOString()

  const tldr = `Ontario's Auditor General found that $750 million in Skills Development Fund grants were awarded in a process that was "not fair, transparent or accountable." Ford's own campaign manager Kory Teneycke runs a lobbying firm whose clients received over $100 million — nearly 3x any other firm. The Premier's nephew's former chief of staff registered as a lobbyist immediately after leaving the Premier's office, and his clients received grants. Labour Minister David Piccini's office overrode civil servants' recommendations in over half of cases reviewed.`

  const summary = `<p>Ontario's Skills Development Fund (SDF) was created as a pandemic-era employment training program, ultimately disbursing over $750 million to train workers across the province. In October 2025, the Auditor General released a <a href="https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-skills-training-funding-1.7648124" target="_blank" rel="noopener noreferrer">special report finding the program was "not fair, transparent or accountable."</a> The report found that the Labour Minister's office overrode the recommendations of non-partisan civil servants in more than half of the cases examined — directing millions in grants to applications that the ministry's own scoring process had ranked low or rejected outright.</p>
<p>The patterns the Auditor General identified were consistent with a patronage system rather than a merit-based training program. Applications backed by lobbyists connected to the Premier's inner circle were dramatically overrepresented among the funded projects. One application — <a href="https://globalnews.ca/news/11458333/ontario-auditor-general-special-report-release/" target="_blank" rel="noopener noreferrer">scored at 41% by civil servants and flagged for conflicts of interest</a>, designed to train a single person (the applicant themselves), was funded anyway. Applications with PC-connected lobbyists routinely received grants despite below-threshold scores.</p>
<p>The Integrity Commissioner opened an investigation into Labour Minister <strong>David Piccini</strong> following the Auditor General's findings, and the opposition called for his resignation. The OPP was referred at least one case for potential criminal investigation — the recipient Keel Digital Solutions, which received a grant and was subsequently the subject of an audit leading to OPP referral.</p>`

  const why_it_matters = `<p>The most striking finding involves <strong>Kory Teneycke</strong> — Doug Ford's own campaign manager for the 2018, 2022, and 2024 provincial elections, and the person most credited with Ford's electoral success. Teneycke owns <strong>Rubicon Strategy</strong>, a government relations firm. <a href="https://www.thetrillium.ca/news/politics/clients-of-lobby-firms-connected-to-premier-his-nephew-given-tens-of-millions-in-training-funds-11312462" target="_blank" rel="noopener noreferrer">Rubicon's clients received over $100 million in SDF grants</a> — nearly three times the next highest-performing lobbying firm. Teneycke simultaneously manages Ford's political campaigns and operates a lobbying business whose clients are funded by Ford government programs. This conflict of interest was not disclosed to applicants or to the public during the program's operation.</p>
<p><strong>David DiPaul</strong>, who served as chief of staff to <strong>Michael Ford</strong> — the Premier's nephew and a Ford cabinet minister — registered as a lobbyist in June 2024, immediately after leaving the Premier's nephew's office. His clients subsequently received SDF grants. The revolving door between the Premier's family's offices and the lobbying industry — with the SDF program as the financial intermediary — demonstrates the systemic nature of the problem: it is not one bad actor but a network operating with apparent impunity.</p>
<p>The Auditor General's findings on the SDF mirror the documented pattern from the Greenbelt scandal: insider access to political staff determines outcomes, while the formal merit-based process is treated as advisory or easily overridden. In the Greenbelt case, Housing Minister Steve Clark's chief of staff directed billions in land-value windfalls to politically connected developers. In the SDF case, the Labour Minister's office directed hundreds of millions in grants to clients of the Premier's campaign manager. In both cases, the independent audit process caught what the government's own controls did not prevent.</p>`

  const rippling_effects = `<p>The Skills Development Fund scandal matters beyond its immediate dollar figures. Training programs are supposed to help the workers who need it most — those being displaced by automation, those without post-secondary credentials, those in declining industries. When the selection process is captured by lobbyists with political connections, the workers who benefit from grants are those whose employers can afford Rubicon Strategy retainers, not those most in need of retraining support.</p>
<p>The Integrity Commissioner and OPP investigations remain active as of early 2026. If criminal charges arise from the Keel Digital Solutions referral or the broader investigation, this scandal would become the most directly criminal element of the Ford government's record — with the potential to reach the Premier's own campaign infrastructure. Teneycke's role is particularly combustible: as the architect of three Ford election wins, a finding of systematic grant-steering to his clients would blur the line between governance and campaign finance in Ontario in ways that have few recent precedents.</p>
<p>The SDF scandal also reveals the inadequacy of Ontario's lobbying disclosure system. Teneycke's dual role as campaign manager and lobbyist with SDF-funded clients is legal under current rules — illustrating how the formal ethics architecture fails to capture the most significant conflicts of interest in Ontario politics. The Auditor General's report recommended systemic reforms to the application and oversight process, but as of early 2026, the Ford government had not committed to implementing them.</p>`

  console.log('Inserting Skills Development Fund scandal...')

  await sql`
    INSERT INTO "Scandal" (
      id, title, slug, tldr, summary, why_it_matters, rippling_effects,
      date_reported, published, "createdAt", "updatedAt"
    ) VALUES (
      ${scandalId},
      ${'Skills Development Fund — $750M Patronage Scandal'},
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      ${'2025-10-01'},
      ${true},
      ${now},
      ${now}
    )
  `
  console.log(`✅ Scandal inserted (id: ${scandalId})`)

  const legalActions = [
    {
      title: 'Auditor General Special Report — SDF "Not Fair, Transparent or Accountable" (October 2025)',
      status: 'Completed',
      description: `<p>Ontario's Auditor General Shelley Spence released a special report in October 2025 finding that over $750 million in Skills Development Fund grants were awarded through a process that was "not fair, transparent or accountable." The report found that the Labour Minister's office overrode civil servants' recommendations in more than half of cases, that low-scoring applications backed by politically connected lobbyists received funding while higher-scoring applications were rejected, and that one application scored 41% and flagged for conflicts of interest was funded anyway. The AG recommended systemic reforms to application processes, conflict-of-interest controls, and ministerial oversight.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-skills-training-funding-1.7648124',
    },
    {
      title: 'Integrity Commissioner Investigation into Labour Minister David Piccini',
      status: 'In Progress',
      description: `<p>Following the Auditor General's findings, Ontario's Integrity Commissioner opened a formal investigation into Labour Minister David Piccini over his office's role in directing SDF grants against the recommendations of non-partisan civil servants. Opposition parties called for Piccini's resignation. The investigation was ongoing as of early 2026, with no findings publicly released. The Commissioner's jurisdiction covers whether Piccini breached the Members' Integrity Act in the exercise of his ministerial powers.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/integrity-commissioner-david-piccini-investigation-skills-development-fund-9.7021871',
    },
    {
      title: 'OPP Referral — Keel Digital Solutions Grant Investigation',
      status: 'In Progress',
      description: `<p>At least one SDF grant recipient — Keel Digital Solutions — was referred to the OPP for criminal investigation following an audit of its grant usage. Keel had received a Skills Development Fund grant, and the audit found irregularities sufficient to warrant a police referral. The specifics of the referral were not fully disclosed by the government. The OPP investigation was ongoing as of early 2026. Critics noted the referral illustrated that the SDF's oversight failures were not merely administrative but potentially criminal in specific cases.</p>`,
      url: 'https://www.cbc.ca/news/canada/toronto/skills-development-fund-recipient-keel-digital-solutions-opp-audit-ontario-government-9.6976878',
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
    { title: 'CBC — Ontario auditor says skills training funding not fair, transparent or accountable', url: 'https://www.cbc.ca/news/canada/toronto/ontario-auditor-general-skills-training-funding-1.7648124' },
    { title: 'Global News — Ford government picked low-scoring lobbyist-backed projects for SDF grants', url: 'https://globalnews.ca/news/11458333/ontario-auditor-general-special-report-release/' },
    { title: 'The Trillium — Clients of lobby firms connected to Premier and his nephew given tens of millions', url: 'https://www.thetrillium.ca/news/politics/clients-of-lobby-firms-connected-to-premier-his-nephew-given-tens-of-millions-in-training-funds-11312462' },
    { title: 'Globe and Mail — Skills Development Fund lobbyists', url: 'https://www.theglobeandmail.com/canada/article-ontario-skills-development-fund-lobbyists/' },
    { title: 'CP24 — Auditor General: $750M in grants not fair, transparent or accountable', url: 'https://www.cp24.com/politics/queens-park/2025/10/01/not-fair-transparent-or-accountable-ontario-auditor-weighs-in-on-750m-in-skills-development-fund-grants/' },
    { title: 'CBC — Integrity Commissioner to probe Piccini over Skills Development Fund', url: 'https://www.cbc.ca/news/canada/toronto/integrity-commissioner-david-piccini-investigation-skills-development-fund-9.7021871' },
    { title: 'CBC — OPP referral for Keel Digital Solutions SDF audit', url: 'https://www.cbc.ca/news/canada/toronto/skills-development-fund-recipient-keel-digital-solutions-opp-audit-ontario-government-9.6976878' },
  ]

  for (const src of sources) {
    const srcId = cuid()
    await sql`
      INSERT INTO "ScandalSource" (id, "scandalId", title, url, "createdAt", "updatedAt")
      VALUES (${srcId}, ${scandalId}, ${src.title}, ${src.url}, ${now}, ${now})
    `
    console.log(`  ✅ Source: ${src.title.substring(0, 65)}...`)
  }

  console.log('\n🎉 Skills Development Fund scandal seeded successfully.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
