#!/usr/bin/env fish
# Seed all cron jobs on Vercel to populate database with Ontario bills data
# Usage: fish seed-crons.fish https://your-app.vercel.app YOUR_CRON_SECRET

if test (count $argv) -lt 2
    echo "Usage: fish seed-crons.fish <base_url> <cron_secret>"
    echo "Example: fish seed-crons.fish https://fuckdougford.vercel.app abc123xyz"
    exit 1
end

set BASE_URL $argv[1]
set CRON_SECRET $argv[2]
set BILLS_PER_RUN 20

echo "🚀 Starting seed sequence..."
echo "Base URL: $BASE_URL"
echo ""

# 1. Scrape MPPs first (bill sponsors need this)
echo "📍 Step 1: Scraping MPPs..."
curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-mpps" | jq . 2>/dev/null || curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-mpps"
echo ""

# 2. Get bill count to determine how many scrapes needed
echo "📊 Step 2: Fetching bill count..."
set BILL_COUNT (curl -s "$BASE_URL/api/bills?limit=1" | jq '.total' 2>/dev/null || echo "0")
echo "Total bills in Ontario Legislature: $BILL_COUNT"
set BILLS_NEEDED (math "ceil($BILL_COUNT / $BILLS_PER_RUN)")
echo "Scrape runs needed: $BILLS_NEEDED (≈$BILLS_PER_RUN bills/run)"
echo ""

# 3. Scrape all bills
echo "📋 Step 3: Scraping all bills ($BILLS_NEEDED runs)..."
for i in (seq 1 $BILLS_NEEDED)
    echo "  Run $i/$BILLS_NEEDED..."
    curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-bills" | jq . 2>/dev/null || curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-bills"
    sleep 2  # Rate limit
end
echo ""

# 4. Scrape news/RSS feeds
echo "📰 Step 4: Scraping news feeds..."
curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-news" | jq . 2>/dev/null || curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-news"
echo ""

# 5. Scrape Hansard (Ontario debate transcripts)
echo "🏛️  Step 5: Scraping Hansard..."
curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-hansard" | jq . 2>/dev/null || curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/scrape-hansard"
echo ""

# 6. Discover keywords
echo "🔑 Step 6: Discovering keywords..."
curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/discover-keywords" | jq . 2>/dev/null || curl -s -H "x-cron-secret: $CRON_SECRET" "$BASE_URL/api/cron/discover-keywords"
echo ""

echo "✅ Seed complete! Visit $BASE_URL to see the data."
