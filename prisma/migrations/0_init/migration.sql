-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Bill" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sponsor" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "date_introduced" TIMESTAMP(3),
    "reading_stage" TEXT,
    "vote_results" JSONB,
    "vote_by_party" JSONB,
    "url" TEXT NOT NULL,
    "impact_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "toronto_flagged" BOOLEAN NOT NULL DEFAULT false,
    "last_scraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sponsorMppId" TEXT,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KeywordSuggestion" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "seen_count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source_bills" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MPP" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "riding" TEXT NOT NULL,
    "email" TEXT,
    "url" TEXT,
    "toronto_area" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MPP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsEvent" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "sentiment" TEXT,
    "is_scandal" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "excerpt" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "scandal_review_status" TEXT,

    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScrapeState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "last_bill_page" INTEGER NOT NULL DEFAULT 0,
    "last_scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceBackoff" (
    "source" TEXT NOT NULL,
    "backoffUntil" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceBackoff_pkey" PRIMARY KEY ("source")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bill_bill_number_key" ON "public"."Bill"("bill_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordSuggestion_term_key" ON "public"."KeywordSuggestion"("term" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MPP_name_riding_key" ON "public"."MPP"("name" ASC, "riding" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewsEvent_url_key" ON "public"."NewsEvent"("url" ASC);

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_sponsorMppId_fkey" FOREIGN KEY ("sponsorMppId") REFERENCES "public"."MPP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsEvent" ADD CONSTRAINT "NewsEvent_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
