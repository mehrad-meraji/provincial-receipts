// Zero-dependency local cron daemon

// Import all scapers
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

const command = process.argv[2]

async function runSingleScraper(name: string) {
  try {
    switch (name) {
      case 'bills':
        console.log('[Manual] Running scrape-bills...')
        await scrapeBillsPage()
        break
      case 'news':
        console.log('[Manual] Running scrape-news...')
        await scrapeNews()
        break
      case 'hansard':
        console.log('[Manual] Running scrape-hansard...')
        await scrapeHansard()
        break
      case 'mpps':
        console.log('[Manual] Running scrape-mpps...')
        await scrapeMpps()
        break
      case 'keywords':
        console.log('[Manual] Running discover-keywords...')
        await discoverKeywords()
        break
      case 'budget':
        console.log('[Manual] Running scrape-budget...')
        await scrapeBudget()
        break
      default:
        console.error(`Unknown scraper: ${name}. Available: bills, news, hansard, mpps, keywords, budget`)
        process.exit(1)
    }
    console.log(`[Manual] Successfully completed: ${name}`)
    process.exit(0)
  } catch (error) {
    console.error(`[Manual] Error running ${name}:`, error)
    process.exit(1)
  }
}

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

if (command) {
  runSingleScraper(command)
} else {
  console.log('Starting zero-dependency local cron daemon...')
  console.log('Daemon is running. Press Ctrl+C to exit.')
  runDaemon()
}
