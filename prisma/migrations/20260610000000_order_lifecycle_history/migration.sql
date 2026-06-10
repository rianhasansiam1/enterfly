-- Enhanced order tracking lifecycle.
--
-- 1. Expand the OrderStatus enum from the old 5-state model
--    (PENDING/PROCESSING/SHIPPED/DELIVERED/CANCELLED) to the detailed
--    13-state courier pipeline.
-- 2. Migrate existing rows safely:
--      PROCESSING -> PAYMENT_CONFIRMED   (was the post-payment state)
--      SHIPPED    -> IN_TRANSIT
--      DELIVERED  -> DELIVERED           (unchanged)
--      PENDING    -> PENDING             (unchanged)
--      CANCELLED  -> CANCELLED           (unchanged)
-- 3. Add the OrderStatusHistory audit-trail table.

-- Swap the enum in place. Postgres can't add the new values and drop the
-- old ones in a single transaction while a column depends on them, so we
-- build a fresh type, remap the column with a CASE, then replace it.
CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING',
  'PAYMENT_CONFIRMED',
  'SELLER_TO_PACK',
  'PACKED',
  'READY_TO_SHIP',
  'WAREHOUSE',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
  'REFUNDED'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PROCESSING' THEN 'PAYMENT_CONFIRMED'
      WHEN 'SHIPPED' THEN 'IN_TRANSIT'
      WHEN 'DELIVERED' THEN 'DELIVERED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      WHEN 'PENDING' THEN 'PENDING'
      ELSE 'PENDING'
    END
  )::"OrderStatus_new";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill a baseline audit-trail row for every pre-existing order so
-- the new tracker has at least one timestamped entry to render.
INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt")
SELECT
  'osh_' || "id",
  "id",
  "status",
  'Migrated from legacy order status.',
  "createdAt"
FROM "Order";
