-- AddColumn
ALTER TABLE "Bill" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: bills already toronto-flagged become published
UPDATE "Bill" SET "published" = true WHERE "toronto_flagged" = true;
