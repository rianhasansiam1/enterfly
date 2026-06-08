-- Move pricing onto Product and turn ProductVariant into a pure
-- size+color inventory row.
--
--   Product.buyingPrice   = business source cost (admin-only)
--   Product.salePrice     = regular selling price (required)
--   Product.discountPrice = optional discounted price (<= salePrice)
--   OrderItem.buyingPrice = admin-only source-cost snapshot (nullable)
--
-- ProductVariant loses price/salePrice, gains image/isActive, requires
-- size+color, makes sku optional, and enforces one row per
-- (productId, size, color).

-- DropIndex
DROP INDEX "ProductVariant_price_idx";

-- DropIndex
DROP INDEX "ProductVariant_salePrice_idx";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "buyingPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "buyingPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "discountPrice" DECIMAL(10,2),
ADD COLUMN     "salePrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "price",
DROP COLUMN "salePrice",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "sku" DROP NOT NULL,
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Product_salePrice_idx" ON "Product"("salePrice");

-- CreateIndex
CREATE INDEX "ProductVariant_size_idx" ON "ProductVariant"("size");

-- CreateIndex
CREATE INDEX "ProductVariant_color_idx" ON "ProductVariant"("color");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "ProductVariant"("productId", "size", "color");
