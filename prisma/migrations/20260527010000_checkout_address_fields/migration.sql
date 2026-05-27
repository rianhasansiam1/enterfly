-- AlterTable: add optional city / postal code / shipping note for checkout
ALTER TABLE "Order"
  ADD COLUMN "customerCity"       TEXT,
  ADD COLUMN "customerPostalCode" TEXT,
  ADD COLUMN "customerNote"       TEXT;
