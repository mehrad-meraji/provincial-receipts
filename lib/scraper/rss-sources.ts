// lib/scraper/rss-sources.ts

export interface RssSource {
  id: string         // stable slug used as SourceBackoff.source
  name: string       // Display name
  url: string        // RSS feed URL
  category: 'politics' | 'toronto' | 'government'
}

export const RSS_SOURCES: RssSource[] = [
  {
    id: 'rss-cbc-toronto',
    name: 'CBC Toronto',
    url: 'https://www.cbc.ca/cmlink/rss-canada-toronto',
    category: 'toronto',
  },
  {
    id: 'rss-toronto-star',
    name: 'Toronto Star - Ontario',
    url: 'https://www.thestar.com/search/?f=rss&t=article&c=News/Politics&l=50&s=start_time&sd=desc',
    category: 'politics',
  },
  {
    id: 'rss-globe-and-mail',
    name: "Globe and Mail - Queen's Park",
    url: 'https://www.theglobeandmail.com/feeds/rss/politics/',
    category: 'politics',
  },
  {
    id: 'rss-tvo-today',
    name: 'TVO Today',
    url: 'https://www.tvo.org/rss',
    category: 'politics',
  },
  {
    id: 'rss-ontario-gov',
    name: 'Ontario Government News',
    url: 'https://news.ontario.ca/en/rss',
    category: 'government',
  },
]
