/**
 * One-time migration: split comma-separated size values in ProductVariant
 * rows into individual variant rows (one per size).
 *
 * Run with: npx tsx scripts/fix-comma-sizes.ts
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all variants with comma-separated sizes
  const badVariants = await prisma.productVariant.findMany({
    where: {
      size: { contains: "," },
    },
    include: {
      product: { select: { slug: true } },
    },
  });

  console.log(`Found ${badVariants.length} variant(s) with comma-separated sizes.`);

  for (const variant of badVariants) {
    const sizes = variant.size!
      .split(/[,،]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sizes.length <= 1) {
      console.log(`  Skipping ${variant.sku}: only ${sizes.length} size(s) after split.`);
      continue;
    }

    console.log(
      `  Splitting "${variant.size}" into [${sizes.join(", ")}] for product "${variant.product.slug}"`
    );

    await prisma.$transaction(async (tx) => {
      // Create new variant rows for each size
      for (const size of sizes) {
        const sku = `SKU-${variant.product.slug}-${size.toLowerCase().replace(/\s+/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
        await tx.productVariant.create({
          data: {
            productId: variant.productId,
            sku,
            color: variant.color,
            size,
            price: variant.price,
            salePrice: variant.salePrice,
            stock: variant.stock,
          },
        });
        console.log(`    Created variant: ${sku} (size: ${size})`);
      }

      // Delete the original variant with the comma-separated size
      await tx.productVariant.delete({ where: { id: variant.id } });
      console.log(`    Deleted original variant: ${variant.sku}`);
    });
  }

  console.log("Done!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
