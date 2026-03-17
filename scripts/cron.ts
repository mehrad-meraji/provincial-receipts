// Zero-dependency local cron daemon

// Import all scrapers
import { scrapeBillsPage } from '../lib/scraper/bills'
import { scrapeNews } from '../lib/scraper/news'
import { scrapeHansard } from '../lib/scraper/hansard'
import { scrapeMpps } from '../lib/scraper/mpps'
import { discoverKeywords } from '../lib/ai/discover'
import { scrapeBudget } from '../lib/scraper/budget'

// Old vercel.json configurations:
// { "path": "/api/cron/scrape-bills",      "schedule": "0 6 * * *"   },
// { "path": "/api/cron/scrape-news",       "schedule": "0 7 * * *"   },
// { "path": "/api/cron/scrape-hansard",    "schedule": "0 8 * * *"   },
// { "path": "/api/cron/scrape-mpps",       "schedule": "0 8 * * 1"   },
// { "path": "/api/cron/discover-keywords", "schedule": "0 9 * * 1"   },
// { "path": "/api/cron/scrape-budget",     "schedule": "0 20 1 4 *"  }

type ScraperName = 'bills' | 'news' | 'hansard' | 'mpps' | 'keywords' | 'budget'

const ALL_SCRAPERS: ScraperName[] = ['bills', 'news', 'hansard', 'mpps', 'keywords', 'budget']

const SCRAPER_MAP: Record<ScraperName, () => Promise<unknown>> = {
  bills: scrapeBillsPage,
  news: scrapeNews,
  hansard: scrapeHansard,
  mpps: scrapeMpps,
  keywords: discoverKeywords,
  budget: scrapeBudget,
}

async function runOne(name: ScraperName): Promise<void> {
  const start = Date.now()
  console.log(`[Manual] Running ${name}...`)
  try {
    await SCRAPER_MAP[name]()
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`[Manual] ✅ ${name} completed in ${elapsed}s`)
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.error(`[Manual] ❌ ${name} failed after ${elapsed}s:`, error)
    throw error
  }
}

async function runParallel(names: ScraperName[]) {
  console.log(`[Manual] Running ${names.length} scrapers in parallel: ${names.join(', ')}`)
  const start = Date.now()

  const results = await Promise.allSettled(names.map(name => runOne(name)))

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`\n[Manual] All done in ${elapsed}s — ${succeeded} succeeded, ${failed} failed`)

  if (failed > 0) process.exit(1)
  process.exit(0)
}

const commands = process.argv.slice(2)

if (commands.length > 0) {
  // Validate all commands first
  const scrapers: ScraperName[] = []
  for (const cmd of commands) {
    if (cmd === 'all') {
      scrapers.push(...ALL_SCRAPERS)
    } else if (cmd in SCRAPER_MAP) {
      scrapers.push(cmd as ScraperName)
    } else {
      console.error(`Unknown scraper: ${cmd}. Available: ${ALL_SCRAPERS.join(', ')}, all`)
      process.exit(1)
    }
  }

  // Deduplicate
  const unique = [...new Set(scrapers)]

  if (unique.length === 1) {
    // Single scraper — run directly
    runOne(unique[0]).then(() => process.exit(0)).catch(() => process.exit(1))
  } else {
    // Multiple scrapers — run in parallel
    runParallel(unique)
  }
} else {
  // Daemon mode
  console.log('Starting zero-dependency local cron daemon...')
  console.log('Daemon is running. Press Ctrl+C to exit.')

  async function runDaemon() {
    while (true) {
      const now = new Date()
      const min = now.getMinutes()
      const hr = now.getHours()
      const day = now.getDay()
      const date = now.getDate()
      const month = now.getMonth() + 1 // 1-12

      // Run tasks precisely on the 0th minute of their respective hour
      if (min === 0) {
        if (hr === 6) {
          console.log('[Cron] Running scrape-bills...')
          scrapeBillsPage().catch(err => console.error('[Cron] Error in scrape-bills:', err))
        }

        if (hr === 7) {
          console.log('[Cron] Running scrape-news...')
          scrapeNews().catch(err => console.error('[Cron] Error in scrape-news:', err))
        }

        if (hr === 8) {
          console.log('[Cron] Running scrape-hansard...')
          scrapeHansard().catch(err => console.error('[Cron] Error in scrape-hansard:', err))

          if (day === 1) { // Monday
            console.log('[Cron] Running scrape-mpps...')
            scrapeMpps().catch(err => console.error('[Cron] Error in scrape-mpps:', err))
          }
        }

        if (hr === 9 && day === 1) { // Monday
          console.log('[Cron] Running discover-keywords...')
          discoverKeywords().catch(err => console.error('[Cron] Error in discover-keywords:', err))
        }

        if (hr === 20 && date === 1 && month === 4) { // April 1st
          console.log('[Cron] Running scrape-budget...')
          scrapeBudget().catch(err => console.error('[Cron] Error in scrape-budget:', err))
        }
      }

      // Wait until the very beginning of the next minute
      const msToNextMinute = 60000 - (Date.now() % 60000)
      await new Promise(resolve => setTimeout(resolve, msToNextMinute))
    }
  }

  runDaemon()
}
