-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'ONLINE';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable: allow guest orders + extra checkout fields
ALTER TABLE "Order"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "customerEmail" TEXT,
  ADD COLUMN "promoCode"     TEXT,
  ADD COLUMN "taxAmount"     DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
