-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "named_individuals_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "photo_filename" TEXT,
    "organization" TEXT,
    "organization_url" TEXT,
    "confidence" "Confidence" NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonConnection" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "scandalId" TEXT NOT NULL,
    "connection_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSource" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "Person"("slug");

-- CreateIndex
CREATE INDEX "PersonConnection_personId_idx" ON "PersonConnection"("personId");

-- CreateIndex
CREATE INDEX "PersonConnection_scandalId_idx" ON "PersonConnection"("scandalId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonConnection_personId_scandalId_connection_type_key" ON "PersonConnection"("personId", "scandalId", "connection_type");

-- CreateIndex
CREATE INDEX "PersonSource_personId_idx" ON "PersonSource"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonSource_personId_url_key" ON "PersonSource"("personId", "url");

-- AddForeignKey
ALTER TABLE "PersonConnection" ADD CONSTRAINT "PersonConnection_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonConnection" ADD CONSTRAINT "PersonConnection_scandalId_fkey" FOREIGN KEY ("scandalId") REFERENCES "Scandal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSource" ADD CONSTRAINT "PersonSource_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
