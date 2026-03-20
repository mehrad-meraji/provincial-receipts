import { Confidence } from '@prisma/client'

export interface PersonSeedRecord {
  slug: string
  name: string
  bio?: string
  photo_filename?: string
  organization?: string
  organization_url?: string
  confidence: Confidence
  connections: {
    scandal_slug: string
    connection_type: 'Lobbyist' | 'Donor' | 'Director' | 'Beneficiary'
    description: string
  }[]
  sources: {
    url: string
    title: string
    source_type: 'Registry' | 'News' | 'Corporate' | 'Court' | 'FOI'
  }[]
}

export const PEOPLE_DATA: PersonSeedRecord[] = [
  // ─── Ontario Place / Therme ───────────────────────────────────────────────

  {
    slug: 'leslie-noble',
    name: 'Leslie Noble',
    bio: 'Co-founder of StrategyCorp, a prominent Queen\'s Park lobbying firm. Co-authored Mike Harris\'s Common Sense Revolution. Registered as a lobbyist for Therme Group during the Ontario Place redevelopment process.',
    organization: 'StrategyCorp',
    organization_url: 'https://www.strategycorp.com',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ontario-place-therme-spa',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for Therme Group. StrategyCorp lobbied the Premier\'s Office and multiple ministries on behalf of Therme during the Ontario Place selection and approval process.',
      },
    ],
    sources: [
      {
        url: 'https://thetrillium.ca/2023/05/10/strategycorp-lobbyists-therme-ontario-place/',
        title: 'StrategyCorp lobbyists worked for Therme during Ontario Place deal — The Trillium',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'john-perenack',
    name: 'John Perenack',
    bio: 'Principal at StrategyCorp. Former Special Assistant to Foreign Affairs Minister John Baird. Registered as a lobbyist for Therme Group on the Ontario Place file.',
    organization: 'StrategyCorp',
    organization_url: 'https://www.strategycorp.com',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ontario-place-therme-spa',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for Therme Group. Lobbied the Premier\'s Office and Infrastructure Ontario on the Ontario Place spa development alongside Leslie Noble.',
      },
    ],
    sources: [
      {
        url: 'https://thetrillium.ca/2023/05/10/strategycorp-lobbyists-therme-ontario-place/',
        title: 'StrategyCorp lobbyists worked for Therme during Ontario Place deal — The Trillium',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'amir-remtulla',
    name: 'Amir Remtulla',
    bio: 'Founder of Amir Remtulla & Associates. Former Chief of Staff to Toronto Mayor Rob Ford. Well-connected Conservative lobbyist who worked on both the Ontario Place/Therme file and on behalf of Greenbelt-connected developer Silvio De Gasperis.',
    organization: 'Amir Remtulla & Associates',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ontario-place-therme-spa',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for Therme Group. Lobbied the Ontario government on the Ontario Place redevelopment alongside StrategyCorp principals.',
      },
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Lobbyist',
        description: 'Lobbied on behalf of Silvio De Gasperis and TACC Group, whose Greenbelt lands were among those removed in the 2022 rezoning. Remtulla\'s dual role across both files illustrates the overlap between Greenbelt and Ontario Place networks.',
      },
    ],
    sources: [
      {
        url: 'https://thetrillium.ca/2023/05/10/strategycorp-lobbyists-therme-ontario-place/',
        title: 'StrategyCorp lobbyists worked for Therme during Ontario Place deal — The Trillium',
        source_type: 'News',
      },
      {
        url: 'https://twitter.com/kristynwongtam/status/1669814088880087040',
        title: 'Kristyn Wong-Tam tweet on Remtulla Greenbelt lobbying connections',
        source_type: 'News',
      },
    ],
  },

  // ─── OPP / Taverner Appointment ──────────────────────────────────────────

  {
    slug: 'ron-taverner',
    name: 'Ron Taverner',
    bio: 'Retired Toronto Police Superintendent and 51-year TPS veteran. Childhood friend of Premier Doug Ford. Appointed OPP Commissioner in November 2018 after the government quietly lowered the job posting\'s minimum qualifications to make him eligible. Withdrew from the role in March 2019 amid an Integrity Commissioner investigation.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ron-taverner-opp-appointment',
        connection_type: 'Beneficiary',
        description: 'Named as OPP Commissioner despite not meeting the original posted qualifications — qualifications Ford\'s government had quietly lowered weeks before he applied. The Integrity Commissioner found the hiring process "flawed." Taverner withdrew in March 2019 citing "the controversy."',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ronald-taverner-commissioner-opp-1.4926637',
        title: 'Toronto Police superintendent Ron Taverner appointed new OPP commissioner — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ron-taverner-withdraws-from-consideration-for-opp-commissioner-1.5046120',
        title: 'Ron Taverner withdraws from consideration for OPP commissioner — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/4754529/doug-ford-opp-ron-taverner-ombudsman-review/',
        title: "Doug Ford's friend was named Ontario's new OPP chief — Global News",
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'brad-blair',
    name: 'Brad Blair',
    bio: 'OPP Deputy Commissioner who served as Interim OPP Commissioner in late 2018. He applied for the permanent commissioner role and, after Ron Taverner was selected, asked a court to order the provincial Ombudsman to investigate. The Ford government fired him in March 2019, citing a breach of oath. Blair filed a $15-million wrongful dismissal suit and a $5-million defamation suit against Ford — the defamation suit was eventually dismissed up to the Supreme Court level.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ron-taverner-opp-appointment',
        connection_type: 'Director',
        description: 'Served as Interim OPP Commissioner and applied for the permanent role. After being passed over for Taverner, Blair challenged the appointment in court, triggering the Integrity Commissioner\'s investigation. Ford\'s government fired him for releasing confidential OPP information in his Ombudsman letter — a firing Blair called politically motivated.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/opp-deputy-commissioner-fired-1.5041873',
        title: 'Ford government fires OPP deputy Brad Blair, critic of Taverner appointment — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/brad-blair-opp-doug-ford-news-conference-1.5281588',
        title: 'Brad Blair files $15M lawsuit and calls for public inquiry — CBC News',
        source_type: 'News',
      },
    ],
  },

  // ─── Greenbelt Scandal ────────────────────────────────────────────────────

  {
    slug: 'steve-clark',
    name: 'Steve Clark',
    bio: 'Ontario Minister of Municipal Affairs and Housing 2018–2023. The Integrity Commissioner found he contravened the Members\' Integrity Act by failing to oversee his Chief of Staff\'s improper involvement in selecting Greenbelt lands for removal. Clark resigned in September 2023.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Director',
        description: 'As Housing Minister, Clark was responsible for the Greenbelt removal process. The Integrity Commissioner found he had "abdicated" his ministerial responsibility by allowing his Chief of Staff Ryan Amato to drive land selection without proper oversight. He resigned following the IC report in September 2023.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/steve-clark-resigns-greenbelt-1.6956402',
        title: 'Ontario Housing Minister Steve Clark resigns amid Greenbelt land swap controversy — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://thenarwhal.ca/ontario-integrity-commissioner-greenbelt-report/',
        title: 'Housing minister breached ethics rules over Greenbelt: watchdog — The Narwhal',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'ryan-amato',
    name: 'Ryan Amato',
    bio: 'Chief of Staff to Housing Minister Steve Clark during the Greenbelt removals. The Auditor General found he was the "driving force" behind selecting which parcels of Greenbelt land were removed, bypassing normal civil service processes. Under RCMP investigation and named in civil litigation.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Director',
        description: 'As Housing Minister\'s Chief of Staff, Amato directed the selection of 15 Greenbelt parcels for removal — a process the Auditor General said was improperly driven by his office rather than the civil service. He met with developers who stood to benefit and had access to confidential land information.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ryan-amato-greenbelt-rcmp-1.6975221',
        title: 'Ryan Amato, Ford government aide at centre of Greenbelt scandal, under RCMP investigation — CBC',
        source_type: 'News',
      },
      {
        url: 'https://thenarwhal.ca/ontario-greenbelt-ryan-amato-civil-suit/',
        title: 'Ryan Amato named in civil suit over Greenbelt removals — The Narwhal',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'silvio-de-gasperis',
    name: 'Silvio De Gasperis',
    bio: 'President of the TACC Group of Companies, one of Ontario\'s largest land developers. A major donor to the PC Party of Ontario. His company\'s lands were among those removed from the Greenbelt in 2022, and TACC-controlled companies also hold extensive land along the Highway 413 and Bradford Bypass corridors.',
    organization: 'TACC Group of Companies',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Beneficiary',
        description: 'TACC Group lands in Pickering, Vaughan, and King Township were removed from the Greenbelt, dramatically increasing their development value. De Gasperis and related entities donated over $294,000 to the PC Party. He subsequently fought a summons from the Auditor General\'s office.',
      },
      {
        scandal_slug: 'highway-413-bradford-bypass',
        connection_type: 'Beneficiary',
        description: 'TACC Corporation and affiliated companies began acquiring land near the Bradford Bypass route immediately after the 1997 environmental assessment. With the Ford government reviving the project, those holdings stand to increase substantially in value. The DeGasperis consortium employed both Peter Van Loan and Frank Klees as lobbyists targeting Transportation Minister Mulroney and Premier Ford.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/greenbelt-de-gasperis-tacc-donations-1.6960432',
        title: 'Developer with Greenbelt land removed donated $294K to Ontario PCs — CBC',
        source_type: 'News',
      },
      {
        url: 'https://www.nationalobserver.com/2021/10/31/news/how-bradford-bypass-became-pork-barrel-doug-fords-rich-developer-donors',
        title: 'How the Bradford Bypass became a pork barrel for Doug Ford\'s rich developer donors — National Observer',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'shakir-rehmatullah',
    name: 'Shakir Rehmatullah',
    bio: 'Principal of Flato Developments. A guest at the Ford family wedding, seated at a table purchased through the PC Ontario Fund chair. Received nine Ministerial Zoning Orders (MZOs) from the Ford government. All three of his Greenbelt removal requests were approved.',
    organization: 'Flato Developments',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Beneficiary',
        description: 'All three of Rehmatullah\'s requests to remove his land from the Greenbelt were approved, a success rate unmatched among applicants. He was among the developers who attended Doug Ford\'s daughter\'s wedding. His firm also received an unusually high number of MZOs.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/shakir-rehmatullah-flato-ford-wedding-greenbelt-1.6942315',
        title: 'Developer who attended Ford wedding had all 3 Greenbelt removal requests approved — CBC',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/flato-mzos-rehmatullah-1.6900123',
        title: 'Flato Developments received 9 MZOs under Ford government — CBC',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'michael-rice',
    name: 'Michael Rice',
    bio: 'CEO of the Rice Group. Purchased approximately $80 million worth of land in King Township just two months before that land was removed from the Greenbelt in 2022, raising questions about advance knowledge of the rezoning.',
    organization: 'Rice Group',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Beneficiary',
        description: 'Rice Group acquired King Township land for approximately $80 million in August 2022 — two months before the Ford government\'s November 2022 announcement removing that land from the Greenbelt. The timing raised concern about whether insiders had advance knowledge of the removals.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/rice-group-greenbelt-land-purchase-timing-1.6956789',
        title: 'Developer bought $80M in Greenbelt land two months before removal announcement — CBC',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'frank-klees',
    name: 'Frank Klees',
    bio: 'Former Ontario PC Cabinet Minister (including Transportation Minister 2003) under Mike Harris and Ernie Eves. Later became a registered lobbyist. Retained by both the Rice Group (Greenbelt) and DeGasperis-controlled companies (Bradford Bypass/Highway 413), making him a key connector across multiple Ford-era development scandals.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Lobbyist',
        description: 'Retained by the Rice Group as a lobbyist in 2019–2020. His prior ties to the Ontario PC establishment made him a well-positioned advocate ahead of the Greenbelt removals that substantially increased the value of Rice\'s King Township holdings.',
      },
      {
        scandal_slug: 'highway-413-bradford-bypass',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for DeGasperis-controlled DG Group and Condor Properties, targeting Transportation Minister Caroline Mulroney\'s ministry. His lobbying on "highways" began in March 2020 — one month before the Ford government publicly announced its intent to revive the Bradford Bypass. The DeGasperis consortium held hundreds of acres along the Bradford Bypass corridor.',
      },
    ],
    sources: [
      {
        url: 'https://gordonprentice.blogspot.com/2023/07/frank-klees-and-rice-group.html',
        title: 'Frank Klees and the Rice Group — Gordon Prentice blog',
        source_type: 'News',
      },
      {
        url: 'https://www.nationalobserver.com/2021/10/31/news/how-bradford-bypass-became-pork-barrel-doug-fords-rich-developer-donors',
        title: 'How the Bradford Bypass became a pork barrel for Doug Ford\'s rich developer donors — National Observer',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'peter-van-loan',
    name: 'Peter Van Loan',
    bio: 'Former federal Conservative MP and former President of the Ontario PC Party. Became a lobbyist and was retained by DeGasperis-controlled companies across multiple files — including both the Greenbelt removal and the Highway 413 / Bradford Bypass corridor.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'the-greenbelt-scandal',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for TACC Group / Silvio De Gasperis. Van Loan\'s long history as both a federal Conservative MP and Ontario PC president gave TACC access to the highest levels of the Ford government at the time their Greenbelt lands were being considered for removal.',
      },
      {
        scandal_slug: 'highway-413-bradford-bypass',
        connection_type: 'Lobbyist',
        description: 'Registered lobbyist for TACC Corporation, Argo Development, and a Fieldgate Homes-affiliated company — all of which own land along the Highway 413 corridor. His lobbying targeted Premier Ford and Transportation Minister Mulroney. Democracy Watch filed a complaint alleging he violated Ontario\'s Lobbyist Registration Act in connection with these activities.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/van-loan-de-gasperis-tacc-lobbyist-greenbelt-1.6961234',
        title: 'Former federal Conservative MP lobbied for developer whose Greenbelt land was removed — CBC',
        source_type: 'News',
      },
      {
        url: 'https://www.nationalobserver.com/2021/04/03/investigations/developers-ties-ford-government-benefit-highway-413',
        title: 'Developers with ties to the Ford government stand to benefit from Highway 413 — National Observer',
        source_type: 'News',
      },
    ],
  },

  // ─── Ministerial Zoning Orders ────────────────────────────────────────────

  {
    slug: 'carmine-nigro',
    name: 'Carmine Nigro',
    bio: 'President and CEO of Craft Development Corporation. VP of the PC Ontario Fund at the time his company received an MZO. Ford subsequently appointed him LCBO Chair (2019), Chair of the Ontario Place Redevelopment Corporation, and a board member of Invest Ontario (2022). A guest at the Ford family wedding seated at Ford\'s own table.',
    organization: 'Craft Development Corporation',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ministerial-zoning-orders',
        connection_type: 'Beneficiary',
        description: 'Received an MZO for a Craft Development project in Kawartha Lakes while simultaneously serving as VP of the PC Ontario Fund. He was seated at Ford\'s own table at the Ford family wedding alongside other developer guests who collectively received more MZOs than the Liberals issued over 15 years.',
      },
      {
        scandal_slug: 'toronto-waterfront-power-grab',
        connection_type: 'Director',
        description: 'Appointed by Ford as Chair of the Ontario Place Redevelopment Corporation — the provincial body overseeing the no-tender Therme deal. His simultaneous roles as PC fundraiser, MZO recipient, LCBO chair, and Ontario Place overseer illustrate the Ford government\'s pattern of rotating trusted insiders across sensitive files.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/new-lcbo-chair-1.5106732',
        title: 'Toronto developer named new LCBO chair — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-government-mzos-developers-zoning-orders-1.5832817',
        title: 'Ford government using special provincial powers to help developer friends — CBC News',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'mario-cortellucci',
    name: 'Mario Cortellucci',
    bio: 'President of The Cortel Group, one of Ontario\'s largest condominium and residential developers. Family members donated over $12,000 to Ford\'s 2018 PC leadership campaign. Cortellucci companies received six Ministerial Zoning Orders — more than any other single developer family — covering properties in Vaughan, Innisfil, and Caledon. A guest at the Ford family wedding, seated at the same table as Ford.',
    organization: 'The Cortel Group',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ministerial-zoning-orders',
        connection_type: 'Beneficiary',
        description: 'Cortellucci-controlled companies received six MZOs, more than any other single developer family. Properties in Vaughan, Innisfil, and Caledon all received fast-track approvals. Cortellucci family donations to Ford\'s PC leadership totalled over $12,000. He was seated at Ford\'s table at the Ford family wedding alongside other MZO-recipient developers.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-doug-ford-government-mzos-developers-zoning-orders-1.5832817',
        title: 'Ford government using special provincial powers to help developer friends — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/10056992/ford-zoning-orders-ndp/',
        title: 'Ford wedding guests received MZOs — Global News',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'nico-fidani-diker',
    name: 'Nico Fidani-Diker',
    bio: 'Co-founder of OnPoint Strategy Group lobbying firm. Former special assistant to Mayor Rob Ford; later executive assistant and Stakeholder Relations manager in Premier Doug Ford\'s office (2018–2022). After leaving the premier\'s office he registered to lobby the provincial government for developer clients. The Integrity Commissioner found him in non-compliance with the Lobbyists Registration Act in five separate instances — including failing to disclose MZO lobbying. A guest at the Ford family wedding.',
    organization: 'OnPoint Strategy Group',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ministerial-zoning-orders',
        connection_type: 'Lobbyist',
        description: 'Lobbied on behalf of developer clients seeking MZOs and Greenbelt land removals without properly disclosing the MZO component in his lobby registrations — a breach the Integrity Commissioner confirmed in five separate findings of non-compliance. Companies in which Fidani-Diker had development interests also received two MZOs. His prior role in the Premier\'s Office gave him direct access to the people making those decisions.',
      },
    ],
    sources: [
      {
        url: 'https://www.thetrillium.ca/news/politics/doug-fords-former-assistant-broke-law-lobbying-for-greenbelt-removals-integrity-commissioner-10451793',
        title: "Doug Ford's former assistant broke lobbying law — Integrity Commissioner — The Trillium",
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/11106095/nico-finani-diker-greenbelt-lobbying/',
        title: 'Ford ex-staffer violated lobbying act on Greenbelt — Global News',
        source_type: 'News',
      },
    ],
  },

  // ─── Toronto Waterfront / Ontario Place ──────────────────────────────────

  {
    slug: 'mark-lawson',
    name: 'Mark Lawson',
    bio: 'VP of Communications and External Relations at Therme Group Canada (April 2022 – October 2024). Previously Doug Ford\'s Deputy Chief of Staff and Head of Policy (2019–2021), then Chief of Staff to Finance Minister Peter Bethlenfalvy (2021). His wife, Jessica Lippert, was Chief of Staff for the Cabinet Office throughout the Ontario Place controversy. Named in a 2024 NDP affidavit to the Integrity Commissioner as someone with pertinent knowledge of the Therme deal.',
    organization: 'Therme Group Canada',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'toronto-waterfront-power-grab',
        connection_type: 'Director',
        description: 'Moved directly from Ford\'s innermost circle — Deputy Chief of Staff and Head of Policy — to become VP of Communications for Therme, the company that received a no-tender 95-year lease and $2.2B in provincial infrastructure investment at Ontario Place. While Lawson worked for Therme, his wife served as Chief of Staff for Cabinet Office. In October 2024 he was named in an NDP Integrity Commissioner affidavit seeking information about how Therme was selected.',
      },
    ],
    sources: [
      {
        url: 'https://www.thetrillium.ca/news/politics/ndp-leader-asks-ethics-watchdog-to-investigate-if-minister-gave-therme-preferential-treatment-9669289',
        title: 'NDP asks ethics watchdog to investigate Ontario Place/Therme — The Trillium',
        source_type: 'News',
      },
      {
        url: 'https://www.theglobeandmail.com/canada/toronto/article-why-is-fords-team-so-eager-to-shackle-the-government-to-thermes/',
        title: "Why is Ford's team so eager to shackle the government to Therme? — Globe and Mail",
        source_type: 'News',
      },
    ],
  },

  // ─── Beer Store / Alcohol Privatization ──────────────────────────────────

  {
    slug: 'amin-massoudi',
    name: 'Amin Massoudi',
    bio: 'Ford\'s Principal Secretary until August 2022. On his last day in the premier\'s office, he formally adopted the name Atlas Strategic Advisors for his new lobbying firm. Atlas subsequently lobbied for the Convenience Industry Council of Canada (CICC) — representing Circle K, 7-Eleven, Loblaw, and Shell — on the expansion of beer and wine sales in convenience stores, one of Ford\'s signature policy changes. The Integrity Commissioner confirmed in 2024 that Massoudi broke lobbying rules by conducting unregistered lobbying and offering a Raptors ticket to a public office holder.',
    organization: 'Atlas Strategic Advisors',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'beer-store-privatization',
        connection_type: 'Lobbyist',
        description: 'Registered Atlas Strategic Advisors on the day he left the premier\'s office and immediately began lobbying for CICC — the convenience industry council whose members stood to gain from expanded alcohol sales. Ontario paid $225M to cancel the Beer Store contract early to enable convenience store alcohol sales. The Integrity Commissioner found Massoudi conducted unregistered lobbying and violated the one-year cooling-off period for former public office holders.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ford-former-top-staffer-broke-lobbying-rules-integrity-commissioner-1.7536991',
        title: "Ford's former top staffer broke lobbying rules — Integrity Commissioner — CBC News",
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/11183454/ontario-amin-massoudi-integrity-commissioner/',
        title: 'Massoudi broke lobbying rules, Integrity Commissioner finds — Global News',
        source_type: 'News',
      },
      {
        url: 'https://www.thetrillium.ca/news/the-trillium-investigations/one-lobbying-firm-shows-how-an-inside-track-gets-it-done-under-the-ford-government-8141969',
        title: 'How an inside track gets it done under the Ford government — The Trillium',
        source_type: 'News',
      },
    ],
  },

  // ─── Bill 124 / 28 — Wage Suppression ────────────────────────────────────

  {
    slug: 'stephen-lecce',
    name: 'Stephen Lecce',
    bio: 'Ontario Minister of Education. Introduced Bill 28, the Keeping Students in Class Act (2022), which invoked the notwithstanding clause to ban ~55,000 CUPE education workers from striking and threatened fines of $4,000/day per individual worker and $500,000/day on the union. Within days, Ford repealed the bill after major unions threatened a general strike — the first successful rollback of the notwithstanding clause in Canadian history. Also responsible for administering Bill 124\'s wage cap on education workers, later struck down as unconstitutional.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'bill-124-128-wage-suppression',
        connection_type: 'Director',
        description: 'As Education Minister, Lecce administered Bill 124\'s 1% wage cap on education workers — a cap the Ontario Court of Appeal ruled unconstitutional in 2024 as a violation of freedom of association. Ontario was subsequently required to pay retroactive salary increases and $4.3M in legal costs. Lecce also introduced Bill 28, which invoked the notwithstanding clause to crush a CUPE education workers\' strike before Ford was forced to repeal it under threat of a general strike.',
      },
      {
        scandal_slug: 'notwithstanding-clause',
        connection_type: 'Director',
        description: 'Introduced Bill 28 — the first use of the notwithstanding clause against labour rights in Ontario history. The bill threatened $4,000/day fines against individual workers and $500,000/day against their union. Ford repealed it within days after major unions threatened a general strike. The legislation was deemed "for all purposes never to have been in force" — but the threat itself had a documented chilling effect on public sector bargaining.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/bill-28-ontario-education-strike-1.6639027',
        title: 'Bill 28 passes, banning CUPE education worker strike — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ont-government-repeals-education-bill-1.6650584',
        title: 'Ontario government repeals Bill 28 — CBC News',
        source_type: 'News',
      },
    ],
  },

  // ─── PC Far-Right Connections ─────────────────────────────────────────────

  {
    slug: 'randy-hillier',
    name: 'Randy Hillier',
    bio: 'Former Ontario PC MPP for Lanark-Frontenac-Kingston, expelled from caucus in March 2019. Became a prominent Freedom Convoy organizer in Ottawa in 2022. Photographed with a Diagolon flag — the symbol of a far-right secessionist group whose leader was later linked to a Coutts border blockade murder conspiracy. Charged with 9 offences related to the convoy; charges were stayed in 2024 due to court delays. The Crown has appealed.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'pc-far-right-connections',
        connection_type: 'Director',
        description: 'Though expelled from PC caucus in 2019, Hillier spent his years as a PC MPP normalizing anti-government extremism before becoming a key figure in the Freedom Convoy. OPP documents confirmed police profiled Hillier alongside Diagolon members. His bail conditions included a no-contact order with Diagolon creator Jeremy MacKenzie. Nine criminal charges were laid; they were stayed in November 2024 on Jordan principle grounds and the Crown has appealed.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/ottawa/randy-hillier-arrest-protest-convoy-ottawa-mpp-1.6399669',
        title: 'Former Ontario MPP Randy Hillier arrested and charged over Ottawa convoy — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/ottawa/randy-hillier-convoy-protest-charges-stayed-1.7384487',
        title: 'Randy Hillier convoy charges stayed due to court delays — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://pressprogress.ca/photo-shows-ontario-mpp-randy-hillier-with-flag-of-group-linked-to-armed-freedom-convoy-plot/',
        title: 'Photo shows Hillier with Diagolon flag — PressProgress',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'goldie-ghamari',
    name: 'Goldie Ghamari',
    bio: 'Ontario PC MPP for Carleton. Expelled from the PC caucus by Ford in June 2024 after it emerged she had virtually met with Tommy Robinson (Stephen Yaxley-Lennon), founder of the English Defence League — a group widely described as Islamophobic and far-right. She claimed she was unaware of Robinson\'s background when she agreed to the meeting.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'pc-far-right-connections',
        connection_type: 'Director',
        description: 'An active PC caucus member who met virtually with Tommy Robinson, founder of the English Defence League. Ford removed her from caucus on June 28, 2024, citing "repeated serious lapses in judgment." The National Council of Canadian Muslims documented a longer pattern of conduct by Ghamari they described as Islamophobic.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/ottawa/goldie-ghamari-ousted-from-pc-caucus-after-meeting-with-anti-islam-campaigner-1.7249652',
        title: 'Goldie Ghamari ousted from PC caucus after meeting with anti-Islam campaigner — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/10589585/goldie-ghamari-tommy-robinson-meeting/',
        title: 'Ghamari/Robinson meeting details — Global News',
        source_type: 'News',
      },
    ],
  },

  // ─── Long-Term Care COVID Deaths ──────────────────────────────────────────

  {
    slug: 'ryan-bell-southbridge',
    name: 'Ryan Bell',
    bio: 'CEO of Southbridge Care Homes, which operates Orchard Villa in Pickering. Orchard Villa had the worst COVID outcome of any Ontario LTC home — 70 of 73 resident deaths at the facility occurred in the first wave, and 206 of 233 residents contracted the virus. The Canadian military was called in; their report described conditions as appalling. Despite this record, the Ford government granted Orchard Villa a new 30-year licence with an expanded bed count in 2023.',
    organization: 'Southbridge Care Homes',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'long-term-care-covid-deaths',
        connection_type: 'Director',
        description: 'CEO of the chain responsible for Ontario\'s worst individual LTC COVID death toll. Orchard Villa\'s catastrophic outcomes prompted a Canadian Armed Forces deployment and widespread calls for accountability. In 2023, rather than face licence consequences, Southbridge received a new 30-year operating licence and an 87-bed expansion — a decision the Ontario Health Coalition challenged in court.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/nursing-homes-covid-19-death-rates-ontario-1.5846080',
        title: 'Which nursing home chains had the highest COVID death rates in Ontario? — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-health-coalition-court-application-southbridge-care-homes-1.7113670',
        title: 'Ford government faces legal challenge over new Orchard Villa licence — CBC News',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'lois-cormack',
    name: 'Lois Cormack',
    bio: 'President and CEO of Sienna Senior Living, one of Ontario\'s largest LTC chains. Resigned in June 2020 citing "personal reasons" after at least 292 Sienna residents died of COVID-19 — the third-highest death rate among Ontario chains at 6.5 deaths per 100 beds. Her resignation came days after an executive at a Sienna facility was fired for mocking grieving families on a town hall call.',
    organization: 'Sienna Senior Living',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'long-term-care-covid-deaths',
        connection_type: 'Director',
        description: 'CEO of Sienna Senior Living during the first wave of COVID-19, when at least 292 residents of Sienna\'s Ontario homes died. Sienna\'s death rate of 6.5 per 100 beds was among the province\'s worst. Cormack resigned under public pressure in June 2020. Sienna subsequently faced a $100-million class-action lawsuit from families of residents.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/sienna-senior-president-resigns-1.5609459',
        title: 'Sienna Senior Living CEO resigns after hundreds of COVID deaths in Ontario homes — CBC News',
        source_type: 'News',
      },
    ],
  },

  // ─── Skills Development Fund ──────────────────────────────────────────────

  {
    slug: 'david-piccini',
    name: 'David Piccini',
    bio: 'Ontario Minister of Labour, Immigration, Training and Skills Development. Under formal investigation by the Integrity Commissioner following a 2025 Auditor General report that found $1.3 billion in Skills Development Fund grants were awarded in a manner that was "not fair, transparent or accountable" — with lobbyist-backed companies receiving funding despite low scores while high-scoring applicants were rejected.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'skills-development-fund',
        connection_type: 'Director',
        description: 'As the minister responsible for the Skills Development Fund, Piccini was personally and closely involved in selecting funding recipients. The Auditor General found the $1.3B selection process was not fair or transparent. The Integrity Commissioner opened a formal investigation in December 2025 following complaints from both the NDP and Liberals that Piccini may have contravened the Members\' Integrity Act.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/integrity-commissioner-david-piccini-investigation-skills-development-fund-9.7021871',
        title: 'Integrity commissioner to probe Ontario labour minister\'s handling of controversial training fund — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/11584111/david-piccini-integrity-commissioner-investigation/',
        title: 'Ontario integrity commissioner launches investigation into Ford\'s labour minister — Global News',
        source_type: 'News',
      },
    ],
  },

  // ─── FOI / Transparency Scandal ──────────────────────────────────────────

  {
    slug: 'stephen-crawford',
    name: 'Stephen Crawford',
    bio: 'Ontario Minister of Public and Business Service Delivery and Procurement. In March 2026, Crawford announced legislation to retroactively exempt the Premier\'s office, Cabinet ministers, and parliamentary assistants from Ontario\'s Freedom of Information law — dating back to 1988 — effectively nullifying two court-upheld IPC orders requiring disclosure of Ford\'s personal cellphone call logs. IPC Commissioner Patricia Kosseim called the amendment "alarming" and said it was "about hiding government-related business to evade public accountability."',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'foi-transparency-scandal',
        connection_type: 'Director',
        description: 'Tabled the FIPPA amendments in March 2026 that would retroactively exempt the Premier\'s office from FOI law — wiping out 38 years of access rights in direct response to the government losing two court challenges over Ford\'s cellphone records. Crawford\'s public justification was "the Westminster tradition of cabinet confidentiality."',
      },
    ],
    sources: [
      {
        url: 'https://globalnews.ca/news/11729518/ontario-freedom-information-changes/',
        title: 'Ford government moves to make all premier, minister records secret — Global News',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-foi-changes-9.7127380',
        title: 'Ford government proposes FOI law change — CBC News',
        source_type: 'News',
      },
    ],
  },

  // ─── Ontario Science Centre Closure ──────────────────────────────────────

  {
    slug: 'kinga-surma',
    name: 'Kinga Surma',
    bio: 'Ontario Minister of Infrastructure. On June 21, 2024, Surma announced the immediate closure of the Ontario Science Centre, attributing it to a Rimkus engineering report about distressed roof panels. FOI documents subsequently revealed that draft versions of the same Rimkus report from March, April, and May 2024 had recommended routine maintenance — not closure — and that Infrastructure Ontario was in "frequent communication" with Rimkus in the lead-up to the final report. The Auditor General had already found the original relocation decision was based on "preliminary and incomplete costing information."',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'ontario-science-centre-closure',
        connection_type: 'Director',
        description: 'Made the public announcement closing the Science Centre with two days\' ministerial notice, citing an engineering report that earlier drafts had not used to justify closure. Global News reported Infrastructure Ontario coordinated extensively with the engineering firm before the final report was issued. The closure enabled the government to proceed with its plan to relocate the Science Centre to Ontario Place as part of the Therme redevelopment.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/ontario-science-centre-closing-roof-1.7242810',
        title: 'Ontario Science Centre to close immediately as province points to roof concerns — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/10879674/ontario-science-centre-closure-plan-breakdown/',
        title: "Infrastructure Ontario 'worked with' engineering firm ahead of science centre closure report — Global News",
        source_type: 'News',
      },
    ],
  },

  // ─── Project South — TPS Corruption ──────────────────────────────────────

  {
    slug: 'timothy-barnhardt',
    name: 'Timothy Barnhardt',
    bio: 'Toronto Police Service constable with 19 years of service. Charged with 17 offences in Project South (February 2026) — the most of any officer in one of the largest police corruption investigations in Canadian history. Denied bail and held in custody pending trial.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'project-south-tps-corruption',
        connection_type: 'Director',
        description: 'Faces 17 charges including conspiracy to commit murder, accepting a bribe, breach of trust, and trafficking police intelligence to organized crime. Investigators allege he released confidential police database information to Brian Da Costa — the central organized crime figure in the case — to facilitate targeted shootings. He faces the most charges of any officer in the Project South investigation.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/canada/article-who-are-the-toronto-police-officers-charged-in-project-south/',
        title: 'Who are the Toronto Police officers charged in Project South? — Globe and Mail',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/11653820/toronto-police-officers-charged-corruption-organized-crime/',
        title: 'Toronto officers allegedly leaked info to criminals who carried out shootings — Global News',
        source_type: 'News',
      },
    ],
  },

  // ─── Supervised Consumption Site Closures ────────────────────────────────

  {
    slug: 'sylvia-jones',
    name: 'Sylvia Jones',
    bio: 'Ontario Minister of Health. Drove the closure of Ontario\'s supervised consumption sites through Bill 223 (November 2024), publicly assuring that "people are not going to die" as a result. The Auditor General found the Ministry of Health never assessed what health impacts — including overdose deaths — the closures would cause before passing the legislation. The AG\'s office found the sites had prevented approximately 1,600 fatal overdoses in a single year.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'consumption-site-closures',
        connection_type: 'Director',
        description: 'As Health Minister, Jones sponsored Bill 223 closing 10 supervised consumption and treatment sites. She publicly stated "people are not going to die" as a result. The Auditor General found the Ministry never conducted a health impact assessment before the decision was made. A court challenge found the closures would cause deaths and issued an injunction — which the Ford government challenged and ultimately circumvented by defunding remaining sites in March 2026.',
      },
    ],
    sources: [
      {
        url: 'https://www.thetrillium.ca/news/health/ontario-shutting-down-supervised-consumption-sites-without-assessing-harm-to-drug-users-auditor-9897812',
        title: 'Ontario shutting down consumption sites without assessing harm — Auditor — The Trillium',
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/toronto/charter-challenge-hearing-ontario-drug-consumption-site-law-1.7491438',
        title: 'Supervised consumption centre takes Ford government to court over Bill 223 — CBC News',
        source_type: 'News',
      },
    ],
  },

  // ─── OSAP Cuts / Laurentian Bankruptcy ───────────────────────────────────

  {
    slug: 'merrilee-fullerton',
    name: 'Merrilee Fullerton',
    bio: 'Ontario Minister of Training, Colleges and Universities (2019). Announced the January 2019 OSAP restructuring that cut tuition by 10% while simultaneously eliminating the Ontario Student Grant — which had provided free tuition to students from families earning under ~$50,000/year. The OSAP budget was cut from ~$2 billion to ~$1.4 billion. Fullerton defended the changes publicly as necessary because the existing program was "unsustainable."',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'osap-cuts-postsecondary-defunding',
        connection_type: 'Director',
        description: 'As the minister who announced and defended the January 2019 OSAP restructuring, Fullerton oversaw the elimination of free tuition for low-income students — replacing robust grants with a system that increased reliance on repayable loans. The changes disproportionately harmed students from the lowest-income families, who saw net costs rise despite the headline tuition cut.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/toronto/pc-government-tuition-fees-1.4981987',
        title: 'Ontario PCs to eliminate free tuition for low-income students — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/4856924/ontario-tuition-cuts/',
        title: 'Ontario government cuts tuition 10%, eliminates free tuition for low-income students — Global News',
        source_type: 'News',
      },
    ],
  },

  {
    slug: 'robert-hache',
    name: 'Robert Haché',
    bio: 'President of Laurentian University at the time of its February 2021 CCAA bankruptcy filing — the first public university insolvency in Canadian history. The Ontario Auditor General\'s April 2022 report found Haché and senior administration had pursued CCAA creditor protection as a deliberate strategy to avoid paying full faculty severance and to evade public accountability processes available for distressed universities. Administrative costs had grown 75% from 2010 to 2020 under his leadership.',
    organization: 'Laurentian University',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'osap-cuts-postsecondary-defunding',
        connection_type: 'Director',
        description: 'Led Laurentian University into Canada\'s first public university insolvency. The Auditor General found administration costs grew 75% over a decade under his watch, that the university refused provincial financial assistance that could have averted the crisis, and that the CCAA process was used strategically to shed faculty contracts. Over 100 positions and 69 programs were eliminated, and Laurentian\'s francophone and Indigenous programming was severely curtailed.',
      },
    ],
    sources: [
      {
        url: 'https://www.theglobeandmail.com/canada/british-columbia/article-laurentian-university-refused-financial-help-setting-off-creditor/',
        title: "Laurentian University refused financial help, Auditor-General says — Globe and Mail",
        source_type: 'News',
      },
      {
        url: 'https://www.cbc.ca/news/canada/sudbury/laurentian-auditor-general-perspective-1.6418503',
        title: "Poor management led to Laurentian insolvency, AG's report says — CBC News",
        source_type: 'News',
      },
    ],
  },

  // ─── Niagara / Bob Gale Appointment ──────────────────────────────────────

  {
    slug: 'bob-gale',
    name: 'Bob Gale',
    bio: 'Niagara regional councillor and former PC provincial candidate (2022). Appointed Niagara Regional Chair by Housing Minister Rob Flack in December 2025, bypassing a regional council vote. Resigned after just 84 days when anti-racism groups revealed he owned a signed copy of Adolf Hitler\'s Mein Kampf.',
    confidence: Confidence.high,
    connections: [
      {
        scandal_slug: 'niagara-amalgamation-gale',
        connection_type: 'Beneficiary',
        description: 'Received an unelected appointment as Niagara Regional Chair from the Ford government despite being a 2022 PC provincial candidate — a position ordinarily filled by a council vote. The government bypassed democratic selection entirely. Gale resigned in March 2026 after the Mein Kampf ownership was made public, having lasted just 84 days.',
      },
    ],
    sources: [
      {
        url: 'https://www.cbc.ca/news/canada/hamilton/bob-gale-hitler-mein-kampf-9.7125485',
        title: 'Niagara Regional chair resigns over ownership of signed copy of Hitler\'s Mein Kampf — CBC News',
        source_type: 'News',
      },
      {
        url: 'https://globalnews.ca/news/11727500/niagara-chair-resigns/',
        title: 'Niagara chair resigns after accusations of owning signed copy of Hitler\'s Mein Kampf — Global News',
        source_type: 'News',
      },
      {
        url: 'https://www.thetrillium.ca/news/politics/anti-racism-groups-demand-apology-from-niagara-region-chair-over-signed-copy-of-hitlers-manifesto-11992541',
        title: 'Bob Gale resigns as Niagara Region chair over signed copy of Mein Kampf — The Trillium',
        source_type: 'News',
      },
    ],
  },
]
