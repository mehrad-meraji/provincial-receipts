/**
 * Seed script: FOI Transparency Scandal
 * Ford government's systematic obstruction and legislative dismantling of Freedom of Information.
 * Uses neon() HTTP driver directly to avoid WebSocket/transaction issues.
 * Run with:
 *   DATABASE_URL="..." npx tsx scripts/seed-foi-scandal.ts
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

async function main() {
  const slug = 'foi-transparency-scandal'

  const existing = await sql`SELECT id FROM "Scandal" WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    console.log(`⚠️  Scandal already exists (id: ${existing[0].id}), skipping.`)
    return
  }

  const scandalId = cuid()

  const tldr = `After losing in court twice over his personal cellphone records, Doug Ford moved to retroactively rewrite Ontario's Freedom of Information law — exempting the Premier, all cabinet ministers, and their offices from public scrutiny, wiping out 38 years of access rights in one legislative stroke.`

  const summary = `Between 2022 and 2026, the Ford government systematically obstructed Ontario's Freedom of Information and Protection of Privacy Act (FIPPA) through a pattern of deleted emails, code-word communications, non-governmental devices, and deliberate delays — before moving in March 2026 to simply exempt itself from the law entirely. The Information and Privacy Commissioner (IPC) received 30 FOI appeals related to the Greenbelt scandal alone, documented systemic record-keeping violations, issued a legal summons to compel former chief of staff Ryan Amato to testify, and ordered the Premier to release government call logs from his personal cellphone. After a three-judge panel upheld that ruling in early 2026, Ford announced legislation to retroactively exclude all premier's and cabinet ministers' records from FIPPA back to 1988 — a move that would also extend response deadlines from 30 days to 45 business days (roughly 63 calendar days) and retroactively quash hundreds of active FOI requests.`

  const why_it_matters = `<p>Ontario's <a href="https://www.ontario.ca/laws/statute/90f31">Freedom of Information and Protection of Privacy Act (FIPPA)</a> has been the cornerstone of government accountability since 1988. It is the legal mechanism through which journalists, researchers, opposition politicians, and ordinary citizens can access records of how public decisions are made and public money is spent. The Ford government's systematic campaign to subvert, delay, and ultimately gut this law represents the most sweeping attack on government transparency in Ontario's modern history.</p>

<p>The pattern of obstruction began well before any legislation. The IPC's 2024 Annual Report — released June 12, 2025 — documented that during the Greenbelt land-removal process, Ford government staff routinely used personal email accounts and personal devices for official government business, employed code words like "G*," "GB," and "Special Project" that were deliberately designed to be unsearchable (the wildcard character "*" renders text search impossible), and deleted emails in violation of the <em>Archives and Recordkeeping Act</em>. The IPC found that officials broke their "legal record-keeping obligations" — a formal finding that the government had violated provincial law. Over 30 FOI appeals were filed on Greenbelt-related records alone, each requiring years of proceedings before the IPC.</p>

<p>The most egregious individual case involves Premier Ford's personal cellphone. Ford publicly distributes his personal number while his official government device sits largely unused — call logs from official periods were found to be blank. <a href="https://globalnews.ca/news/11597458/ontario-premier-doug-ford-cellphone-judicial-review-decision/">Global News filed an FOI request for government-related call logs</a> from that personal phone. The government denied it. The IPC ordered disclosure. The government appealed. A three-judge Divisional Court panel — appointed, not elected — upheld the IPC's order in January 2026, with government lawyers having admitted on the record that Ford uses his personal phone for official business. Ford then filed a further appeal, spending public funds to continue fighting disclosure of his own call logs, before pivoting entirely: announcing legislation that would make the question moot by retroactively exempting all such records from FIPPA.</p>

<p>The Skills Development Fund scandal was similarly exposed through FOI. <a href="https://www.thetrillium.ca/">The Trillium</a> obtained records showing that nearly two-thirds of $200 million in fifth-round grants went to organizations led by Progressive Conservative donors who had collectively given at least $1.3 million to the party since 2014. Separate FOI requests revealed the government awarded $17 million to train restaurant workers at a company connected to Ford even after public servants scored its application as low-quality. The Auditor General's October 2024 special report called the $2.5-billion fund's selection process "not fair, transparent or accountable." Labour Minister David Piccini is now under investigation by the Integrity Commissioner over his handling of the fund. An OPP anti-rackets investigation into one recipient company is also active. These investigations only exist because FOI worked.</p>

<p>Government advertising is another area where FOI has been essential. A CBC News FOI request revealed the Ford government spent <a href="https://www.cbc.ca/news/canada/toronto/ontario-ad-campaign-foi-1.7541383">$40 million on a pre-election advertising campaign</a> promoting Ontario to Ontarians — including prime placements during the Super Bowl and the Oscars. The Auditor General found the province spent a record $112 million on taxpayer-funded advertising in 2024–25, with 38% of campaigns designed to leave Ontarians with a positive impression of Ford's government ahead of the snap election. Without FOI, none of these figures would be public.</p>

<p>The proposed FIPPA legislation — set to be tabled March 23, 2026, when the legislature returns — would strip Ontarians of the right to access any record held in the offices of the Premier, all cabinet ministers, parliamentary assistants, and their political staff. This is not a minor administrative change. It would apply retroactively to 1988, voiding 38 years of legal access rights and immediately quashing hundreds of active FOI requests. The response deadline extension — from 30 calendar days to 45 business days (approximately 63 calendar days) — amounts to a more than doubling of the legally permitted delay. IPC Commissioner Patricia Kosseim was unambiguous: retroactively changing the law "sends a message that if oversight bodies get in the way, just change the rules."</p>`

  const rippling_effects = `<p>The most immediate and concrete harm is to the 30-plus active FOI requests that would be voided retroactively by the proposed legislation. Among them: requests for records about the Greenbelt decision-making process, requests related to the Skills Development Fund, and Global News's still-unresolved request for Ford's cellphone call logs. Ryan Amato — the former chief of staff to Housing Minister Steve Clark, at the centre of the Greenbelt land selection — has refused to cooperate with IPC investigators, failed to provide substantive responses to the adjudicator's requests, and challenged an IPC summons in Divisional Court in a judicial review filed January 9, 2026. His emails, which the IPC ordered produced by June 2026, may now never be disclosed if the FIPPA amendments pass.</p>

<p>The legislation would also formally remove the IPC's oversight role over data-integration provisions in FIPPA — provisions that give the government the ability to link personal records about every Ontarian across government departments, including health information. IPC Commissioner Kosseim warned that this creates an inherent conflict of interest: "Removing safeguards and oversight means that the government is effectively overseeing its own use of personal data." The government would gain the power to cross-reference Ontarians' health, tax, and social service records with no independent watchdog authorized to scrutinize how that power is used.</p>

<p>The proposed change to extend FOI response times from 30 days to 45 business days represents a structural disadvantage for journalists on deadline, researchers working on time-sensitive issues, and citizens trying to act on information about decisions that affect them. The current 30-day legal deadline is already routinely violated: in 2022, only 51.2% of provincial FOI requests were completed within 30 days. The figure improved to 67% in 2023 and 78% in 2024, suggesting the system was actually getting better at compliance — making the proposed extension appear less like a practical fix and more like institutionalized permission to delay. The IPC's average time to resolve FOI appeals remained 9.9 months in 2024, meaning Ontarians denied information often wait nearly a year before any resolution — a period that will effectively lengthen further under the new rules.</p>

<p>The proposed law would place Ontario in a category of minimal transparency shared primarily with jurisdictions known for limited accountability. Ontario has historically been one of only two provinces — alongside Nova Scotia — that subjects records from cabinet ministers' offices to FOI. The Ford government's own framing — that the change brings Ontario in line with other provinces — is contradicted by federal Information Commissioner Caroline Maynard, who told a House of Commons committee that records from the Prime Minister's and cabinet ministers' offices should be subject to federal access-to-information law. The Ford government is moving in the opposite direction from where federal accountability reformers want to go.</p>

<p>The chilling effects on journalism and public interest reporting are already visible. The Pointer, the Trillium, Global News, CBC News, the Toronto Star, and National Observer have all relied on FOI to break major Ford government stories. The Pointer filed FOI requests in November 2024 with the Cabinet Office seeking records from the Greenbelt decision period — and reported that the government deliberately delayed responses until after the February 27, 2025 provincial election, denying voters information directly relevant to the ballot. This is FOI used as a political delay tactic: slow-walk requests until they no longer matter electorally. The new law would effectively codify this: with no legal obligation to respond to ministerial office records at all, and 63 calendar days to respond to anything that is covered, the government gains near-complete control over the timing of any politically inconvenient disclosure.</p>

<p>Ford's stated justifications for the changes were publicly dismissed by experts. The government offered three rationales: protecting constituent privacy, preserving cabinet confidentiality, and shielding records from foreign actors including China. Veteran FOI journalist Dean Beeby called the privacy rationale "so much bull," noting that FIPPA already contains robust privacy protections for constituent information. The cabinet confidentiality argument was similarly dismissed: FIPPA already exempts Cabinet deliberations and advice given to ministers. As for foreign interference — the suggestion that China or other adversaries would exploit FIPPA to extract sensitive government information drew open derision from transparency experts, who noted that FIPPA already contains national security exemptions. "He's making a straw man argument," Beeby said. NDP Leader Marit Stiles was more direct: "The only person Doug Ford is protecting is himself."</p>`

  await sql`
    INSERT INTO "Scandal" (id, title, slug, tldr, summary, why_it_matters, rippling_effects, date_reported, published, "createdAt", "updatedAt")
    VALUES (
      ${scandalId},
      'The FOI Transparency Scandal',
      ${slug},
      ${tldr},
      ${summary},
      ${why_it_matters},
      ${rippling_effects},
      '2026-03-13',
      true,
      NOW(),
      NOW()
    )
  `
  console.log(`✅ Scandal inserted: ${scandalId}`)

  // Legal actions
  const legalActions = [
    {
      title: 'IPC Order: Ford Cellphone Call Logs (Global News FOI)',
      status: 'active',
      url: 'https://globalnews.ca/news/11597458/ontario-premier-doug-ford-cellphone-judicial-review-decision/',
      description: `<p>Global News filed an FOI request for government-related call logs from Premier Ford's personal cellphone — a device he publicly distributes while his official government phone sits unused. The government denied the request. The IPC ordered disclosure. The government challenged the order in Divisional Court. A three-judge panel upheld the IPC's ruling in January 2026, with government lawyers having admitted Ford uses his personal phone for official government business. Ford announced a further appeal. The Ford government subsequently announced legislation that would retroactively exempt all such records from FIPPA, effectively mooting the court ruling.</p>`,
    },
    {
      title: 'IPC Summons: Ryan Amato — Greenbelt Emails on Personal Account',
      status: 'active',
      url: 'https://globalnews.ca/news/11621605/ontario-greenbelt-emails-judicial-review/',
      description: `<p>The IPC received 30 FOI appeals related to Greenbelt land removal records. One key proceeding involves emails held on former chief of staff Ryan Amato's personal email account. After Amato failed to provide a substantive response to the adjudicator's August 2025 request, the IPC issued a legal summons in October 2025 requiring him to appear under oath. On January 9, 2026, Amato filed a judicial review application challenging the summons. A separate IPC ruling ordered the Ministry of Municipal Affairs and Housing to work with Amato to retrieve the emails; Amato has not complied. A 2025 IPC order requires Amato to hand over the emails or swear an affidavit that none exist by June 2026.</p>`,
    },
    {
      title: 'IPC 2024 Annual Report: Finding of Legal Record-Keeping Violations',
      status: 'settled',
      url: 'https://www.ipc.on.ca/en/2024-annual-report/ontarios-greenbelt-access-information-and-government-transparency',
      description: `<p>Released June 12, 2025, the IPC's 2024 Annual Report formally found that Ford government officials violated their legal record-keeping obligations during the Greenbelt removal process. The IPC documented use of personal devices and email accounts for official business; use of code words including "G*," "GB," and "Special Project" (the wildcard character "*" renders records unsearchable by standard text search); deletion of emails in violation of the <em>Archives and Recordkeeping Act</em>; and failure to properly document key government decisions. The IPC called for legislative amendments requiring a duty to document and prohibiting use of personal devices for official business — recommendations the Ford government has not adopted.</p>`,
    },
    {
      title: 'Ontario Integrity Commissioner Investigation: David Piccini — Skills Development Fund',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/integrity-commissioner-david-piccini-investigation-skills-development-fund-9.7021871',
      description: `<p>Ontario Integrity Commissioner Cathryn Motherwell confirmed in December 2025 that she will investigate Labour Minister David Piccini over his administration of the $2.5-billion Skills Development Fund. FOI requests by The Trillium revealed that nearly two-thirds of $200 million in fifth-round grants went to Progressive Conservative-connected organizations. The Auditor General's October 2024 special report found the fund's selection process "not fair, transparent or accountable." The investigation follows complaints from both the NDP and Liberal parties regarding Piccini's attendance at a lobbyist's Paris wedding and rinkside seats with a grant recipient at a Maple Leafs game.</p>`,
    },
    {
      title: 'OPP Anti-Rackets Investigation: Skills Development Fund Recipient',
      status: 'active',
      url: 'https://www.cbc.ca/news/canada/toronto/skills-development-fund-recipient-keel-digital-solutions-opp-audit-ontario-government-9.6976878',
      description: `<p>The OPP's anti-rackets branch opened a criminal investigation into at least one company that received Skills Development Fund grants following a forensic audit. The company has countersued the Ontario government for $100 million, alleging reputational harm. The investigation is ongoing as of early 2026. The original grants and their recipients were identified through FOI requests filed by journalists — the type of disclosure the proposed FIPPA amendments would prevent for ministerial office records.</p>`,
    },
    {
      title: 'Proposed FIPPA Amendments — Exempting Premier and Cabinet (March 2026)',
      status: 'pending',
      url: 'https://www.ipc.on.ca/en/media-centre/news-releases/statement-commissioner-patricia-kosseim-proposed-changes-ontarios-freedom-information-and-protection',
      description: `<p>On March 13, 2026, Minister of Public and Business Service Delivery Stephen Crawford announced the Ford government will table legislation when the legislature resumes March 23, 2026, to permanently exempt the offices of the Premier, all cabinet ministers, parliamentary assistants, and their political staff from FIPPA. The changes would apply retroactively to 1988 — the year FIPPA came into force — voiding 38 years of legal access rights and quashing hundreds of active requests. The bill also extends response timelines from 30 calendar days to 45 business days (approximately 63 calendar days). IPC Commissioner Patricia Kosseim issued a public statement condemning the proposed changes as a signal that "if oversight bodies get in the way, just change the rules." Opposition parties including the NDP and Liberals pledged to undo the changes if elected to government.</p>`,
    },
  ]

  for (const la of legalActions) {
    const id = cuid()
    await sql`
      INSERT INTO "LegalAction" (id, "scandalId", title, status, description, url, "createdAt", "updatedAt")
      VALUES (${id}, ${scandalId}, ${la.title}, ${la.status}, ${la.description}, ${la.url}, NOW(), NOW())
    `
  }
  console.log(`✅ ${legalActions.length} legal actions inserted`)

  // Sources
  const sources = [
    {
      url: 'https://www.nationalobserver.com/2026/03/13/news/doug-ford-freedom-of-information-law',
      title: 'Ford targets Ontario law that exposed his government\'s worst scandals — Canada\'s National Observer (March 13, 2026)',
    },
    {
      url: 'https://www.nationalobserver.com/2026/03/17/news/ford-foi-changes-confidentiality-bull',
      title: '\'So much bull\': Experts dismiss Ford\'s excuses for freedom of information overhaul — Canada\'s National Observer (March 17, 2026)',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-ford-changing-foi-rules-9.7127884',
      title: 'Ontario wants to change its FOI rules to keep some records secret. Here\'s what you need to know — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-foi-changes-9.7127380',
      title: 'Ford government proposes FOI law change that would keep premier\'s records secret — CBC News',
    },
    {
      url: 'https://globalnews.ca/news/11729518/ontario-freedom-information-changes/',
      title: 'Ford government moves to make all premier, minister records secret — Global News',
    },
    {
      url: 'https://globalnews.ca/news/11597458/ontario-premier-doug-ford-cellphone-judicial-review-decision/',
      title: 'Ontario court rules Doug Ford must turn over personal phone records — Global News',
    },
    {
      url: 'https://globalnews.ca/news/11733205/doug-ford-cellphone-new-foi-law/',
      title: 'Ford accused of limiting transparency law because of cellphone defeat in court — Global News',
    },
    {
      url: 'https://globalnews.ca/news/11734575/doug-ford-foi-personal-cellphone/',
      title: 'Doug Ford acknowledges transparency clamp-down is to protect his personal phone — Global News',
    },
    {
      url: 'https://www.theglobeandmail.com/canada/article-ontario-freedom-of-information-requests-premier-cabinet/',
      title: 'Ontario to introduce bill exempting Premier, cabinet from FOI requests — The Globe and Mail',
    },
    {
      url: 'https://www.theglobeandmail.com/opinion/article-ontario-steps-back-into-the-information-dark-ages/',
      title: 'Ontario steps back into the information dark ages — The Globe and Mail (Opinion)',
    },
    {
      url: 'https://www.ipc.on.ca/en/media-centre/news-releases/statement-commissioner-patricia-kosseim-proposed-changes-ontarios-freedom-information-and-protection',
      title: 'Statement from Commissioner Patricia Kosseim on proposed changes to Ontario\'s FIPPA — IPC Ontario (March 2026)',
    },
    {
      url: 'https://www.ipc.on.ca/en/2024-annual-report/ontarios-greenbelt-access-information-and-government-transparency',
      title: 'Ontario\'s Greenbelt: Access to information and government transparency — IPC 2024 Annual Report',
    },
    {
      url: 'https://www.ipc.on.ca/en/media-centre/news-releases/ipc-2024-annual-report-commissioner-urges-government-close-regulatory-gaps-and-secure-public-trust',
      title: 'IPC 2024 Annual Report: Commissioner urges government to close regulatory gaps and secure public trust — IPC Ontario (June 2025)',
    },
    {
      url: 'https://thepointer.com/article/2025-02-20/denials-and-delays-ontario-voters-will-cast-their-ballot-without-knowing-doug-ford-s-role-in-the-greenbelt-scandal',
      title: 'Denials and delays: Ontario voters will cast their ballot without knowing Doug Ford\'s role in the Greenbelt scandal — The Pointer (February 2025)',
    },
    {
      url: 'https://thepointer.com/article/2025-06-13/pc-government-broke-the-law-used-secret-codes-to-hide-records-related-to-greenbelt-land-grab-ipc-finds',
      title: 'PC government broke the law, used secret codes to hide records related to Greenbelt land grab, IPC finds — The Pointer (June 2025)',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ford-government-greenbelt-records-code-words-1.7559720',
      title: 'Ford government used code words to make it \'unduly difficult\' to search Greenbelt records: report — CBC News',
    },
    {
      url: 'https://globalnews.ca/news/11621605/ontario-greenbelt-emails-judicial-review/',
      title: 'Former Ford government staffer challenges watchdog order for Greenbelt interview under oath — Global News',
    },
    {
      url: 'https://globalnews.ca/news/11642086/ontario-government-personal-devices-court-cases/',
      title: 'Watchdog leans into \'firmer enforcement\' over Ford government personal devices — Global News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/integrity-commissioner-david-piccini-investigation-skills-development-fund-9.7021871',
      title: 'Integrity commissioner to probe Ontario labour minister\'s handling of controversial training fund — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-ad-campaign-foi-1.7541383',
      title: 'Ford\'s government spent $40M promoting Ontario to Ontarians — just before the election — CBC News',
    },
    {
      url: 'https://www.cbc.ca/news/canada/toronto/ontario-government-ad-spending-1.7399627',
      title: 'Ontario spent highest-ever amount on government ads, auditor says — CBC News',
    },
    {
      url: 'https://thenarwhal.ca/ontario-greenbelt-code-words/',
      title: 'Ontario staffers used \'G*\' code word for Greenbelt cuts — The Narwhal',
    },
    {
      url: 'https://www.cp24.com/politics/queens-park/2026/03/16/doug-ford-cites-threat-from-china-in-defending-increasing-government-secrecy/',
      title: 'Doug Ford cites threat from China in defending FOI changes — CP24 (March 16, 2026)',
    },
    {
      url: 'https://www.ipc.on.ca/sites/default/files/documents/ipc-2024-annual-report.pdf',
      title: 'Five Years of Privacy and Transparency in a Digital Ontario: IPC 2024 Annual Report (Full PDF)',
    },
    {
      url: 'https://www.ipc.on.ca/sites/default/files/documents/ipc-2024-statistical-report.pdf',
      title: 'IPC 2024 Statistical Report — FOI Request Volume and Compliance Data',
    },
    {
      url: 'https://www.villagereport.ca/village-picks/ontario-ndp-liberal-leaders-say-they-would-undo-pcs-planned-foi-changes-12020517',
      title: 'Ontario NDP and Liberals promise to undo Ford government FIPPA overhaul — Village Report',
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
  console.log(`\n🎉 FOI Transparency Scandal live at /scandals/${slug}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
