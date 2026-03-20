---
name: add-scandal
description: "Create seed scripts for new scandals, timeline events, and connected people in the fuckdougford civic accountability project. Use this skill whenever the user wants to add a scandal, document a controversy, add a timeline event, or connect a person (lobbyist, donor, beneficiary, director) to a scandal. Also use when the user mentions Doug Ford, Ontario government, or provincial politics in the context of adding content to the site. Even if the user just says 'add the X scandal' or 'document Y', use this skill."
---

# Add Scandal

You are creating seed scripts for a civic accountability dashboard that tracks Ontario government scandals, legislation, and connected individuals. The data you produce will be published on a public website.

## The #1 Rule: No Hallucination

This is a public accountability project. Every claim, date, name, dollar figure, and connection you include must be backed by a verifiable source. The consequences of publishing fabricated information about real people and real events are severe — it destroys the project's credibility and could expose the project to legal liability.

**What this means in practice:**

- If you cannot find a credible source for a claim, do not include it — even if you "know" it's true from training data. Your training data can be wrong, outdated, or misremembered.
- Use WebSearch to research every scandal before writing anything. Do not rely on memory alone.
- Every URL you include must be verified as active using WebFetch. Dead links undermine trust.
- When in doubt, leave it out. A scandal page with 5 rock-solid sourced claims is worth more than one with 15 claims where 3 are shaky.
- Clearly tell the user when you couldn't verify something rather than quietly omitting it.

## Workflow

### Step 1: Understand What to Add

The user will describe what they want — it might be a full scandal, a single timeline event, or a person connected to an existing scandal. Clarify:

- **Scandal**: A new controversy page with full narrative (tldr, summary, why_it_matters, rippling_effects), legal actions, and sources
- **Timeline event**: A dated milestone that appears on the homepage timeline, optionally linked to a scandal
- **Person**: A named individual (lobbyist, donor, director, beneficiary) connected to one or more scandals

These can be combined — a new scandal often comes with timeline events and connected people.

### Step 2: Research

Use WebSearch to find credible reporting on the topic. Prioritize these source types (in order of credibility):

1. **Government records** — Auditor General reports, Integrity Commissioner rulings, Hansard transcripts, FOI releases
2. **Court documents** — Filed lawsuits, judicial decisions, RCMP statements
3. **Major news outlets** — CBC, Globe and Mail, Toronto Star, Global News, CTV
4. **Investigative journalism** — The Narwhal, The Trillium, TVO, Queen's Park Today
5. **Corporate registries** — Ontario Lobbyist Registry, corporate filings

Avoid: social media posts as primary sources, opinion columns without factual backing, partisan blogs, unverified claims from anonymous sources.

After finding sources, use WebFetch to verify each URL is live. If a URL is dead, search for an alternative. If none exists, drop that source.

### Step 3: Present Research to User

Before writing any code, present your findings to the user:

- List the key facts you found with their sources
- Flag anything you couldn't verify
- Note any claims that are disputed or where sources conflict
- Propose the scandal's narrative arc (tldr, why it matters, rippling effects)
- List proposed legal actions with their statuses
- List proposed people connections if applicable
- List proposed timeline events if applicable

Wait for user approval before proceeding.

### Step 4: Write the Seed Script

Generate a TypeScript seed script following the project's established patterns. Read `references/seed-patterns.md` for the exact code templates.

**Key conventions:**
- File goes in `scripts/` directory, named `seed-{scandal-slug}.ts`
- Uses `neon()` HTTP driver for scandal/source/legal-action inserts (raw SQL)
- Uses Prisma Client for people inserts (handles the Confidence enum)
- Idempotent — checks for existing records by slug before inserting
- HTML content in `why_it_matters` and `rippling_effects` uses `<p>`, `<strong>`, `<a href>`, `<em>` tags
- Every `<a href>` link in HTML content should point to a verified source URL
- Sources array must have both `url` and `title` for every entry
- Legal action statuses are: `pending`, `active`, `dismissed`, `settled`, `convicted`
- Person connection types are: `Lobbyist`, `Donor`, `Director`, `Beneficiary`
- Person confidence levels are: `high`, `medium`, `low`
- Person source types are: `Registry`, `News`, `Corporate`, `Court`, `FOI`
- Timeline events link to scandals via URL pattern `/scandals/{scandal-slug}`
- Timeline event types are: `news`, `context`, `milestone`
- Timeline event icons (Lucide names): `Newspaper`, `AlertTriangle`, `Flag`, `Gavel`, `Lock`, `Syringe`, `Vote`, `Megaphone`, `FileText`, `Globe`

### Step 5: Verify Sources One More Time

Before presenting the final script, do a final verification pass:

1. Every URL in the `sources` array — fetch it, confirm it loads
2. Every `<a href>` URL in HTML content — fetch it, confirm it loads
3. Every legal action `url` — fetch it, confirm it loads
4. Cross-reference dates against sources (don't get a date wrong because you misread an article)
5. Cross-reference dollar figures, names, and titles against sources

If any URL fails, find a replacement or remove the link. Tell the user about any changes.

### Step 6: Present the Script

Show the user the complete seed script. Explain what it will create (number of sources, legal actions, timeline events, people). Remind them to run it with:

```bash
DATABASE_URL="..." npx tsx scripts/seed-{slug}.ts
```

## Writing Guidelines

### Tone

The content on this site is factual and direct. It documents what happened, who was involved, and why it matters — backed by evidence. Avoid:

- Editorializing beyond what the evidence supports
- Speculative language ("probably", "likely", "seems to")
- Inflammatory language that isn't backed by sourced facts
- Legal conclusions (say "charged with" not "guilty of", "alleged" not "confirmed" unless there's a conviction)

### HTML Content Quality

The `why_it_matters` and `rippling_effects` fields are rich HTML rendered on the scandal detail page. They should:

- Use `<p>` tags for paragraphs (3-5 paragraphs each)
- Bold key names and figures with `<strong>`
- Link to sources inline with `<a href="...">descriptive link text</a>`
- Use `<em>` for act/bill names
- Be substantive — these are the core content of the scandal page

### TL;DR

The `tldr` field is 1-2 sentences that appear as a summary. It should be punchy and convey the essence of the scandal. No HTML.

### Slugs

Generated from the title: lowercase, hyphens for spaces, no special characters. Example: "The Greenbelt Scandal" → `the-greenbelt-scandal`.

## What NOT To Do

- Do not fabricate sources. If a URL looks plausible but you haven't verified it, it doesn't go in.
- Do not guess at dates. If you can't find the exact date of an event, use the first of the month and note the approximation to the user.
- Do not invent legal actions. Only include legal proceedings you can source.
- Do not create person connections without evidence from the lobbyist registry, news reports, or court documents.
- Do not set `published: true` — all seed data starts as draft for admin review. The only exception is if the user explicitly asks for it to be published.
- Do not include people with `confidence: high` unless you have multiple independent sources confirming their involvement.
