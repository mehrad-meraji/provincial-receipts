-- CreateTable
CREATE TABLE "BudgetSnapshot" (
    "id" TEXT NOT NULL,
    "fiscal_year" TEXT NOT NULL,
    "total_revenue" BIGINT NOT NULL,
    "total_expense" BIGINT NOT NULL,
    "deficit" BIGINT NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetMinistry" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "amount" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetMinistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetProgram" (
    "id" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetSnapshot_fiscal_year_key" ON "BudgetSnapshot"("fiscal_year");

-- CreateIndex
CREATE INDEX "BudgetMinistry_snapshotId_idx" ON "BudgetMinistry"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMinistry_snapshotId_name_key" ON "BudgetMinistry"("snapshotId", "name");

-- CreateIndex
CREATE INDEX "BudgetProgram_ministryId_idx" ON "BudgetProgram"("ministryId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetProgram_ministryId_name_key" ON "BudgetProgram"("ministryId", "name");

-- AddForeignKey
ALTER TABLE "BudgetMinistry" ADD CONSTRAINT "BudgetMinistry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "BudgetSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetProgram" ADD CONSTRAINT "BudgetProgram_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "BudgetMinistry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
