/*
  Warnings:

  - You are about to drop the `Banner` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CarouselBannerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CategoryBannerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TopBannerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_categoryId_fkey";

-- DropTable
DROP TABLE "Banner";

-- DropEnum
DROP TYPE "BannerStatus";

-- DropEnum
DROP TYPE "BannerType";

-- CreateTable
CREATE TABLE "CarouselBanner" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "bgFrom" TEXT NOT NULL,
    "bgVia" TEXT,
    "bgTo" TEXT NOT NULL,
    "link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "CarouselBannerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryBanner" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "discount" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "categoryId" TEXT NOT NULL,
    "status" "CategoryBannerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopBanner" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "discount" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "tagIcon" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "TopBannerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarouselBanner_status_position_idx" ON "CarouselBanner"("status", "position");

-- CreateIndex
CREATE INDEX "CategoryBanner_categoryId_status_idx" ON "CategoryBanner"("categoryId", "status");

-- CreateIndex
CREATE INDEX "TopBanner_status_position_idx" ON "TopBanner"("status", "position");

-- AddForeignKey
ALTER TABLE "CategoryBanner" ADD CONSTRAINT "CategoryBanner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
