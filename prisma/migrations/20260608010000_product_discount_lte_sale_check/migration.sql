-- Database-level integrity guard for product pricing.
--
-- Ensures a product's optional discount price can never exceed its
-- regular sale price. This complements (does not replace) the Zod /
-- route-level validation in the application layer.
--
-- NULL discountPrice is always allowed (product has no discount).
--
-- Prisma does not model CHECK constraints in schema.prisma, so this is
-- applied as raw SQL. Prisma's schema diffing ignores CHECK constraints,
-- so this constraint will persist across future `migrate dev` runs and
-- will not be dropped as drift.
--
-- Rollback (Prisma migrations are forward-only; run manually if needed):
--   ALTER TABLE "Product" DROP CONSTRAINT "Product_discountPrice_lte_salePrice_check";

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_discountPrice_lte_salePrice_check"
  CHECK ("discountPrice" IS NULL OR "discountPrice" <= "salePrice");
