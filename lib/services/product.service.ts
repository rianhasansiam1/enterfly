import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from "@/lib/validations/product.validation";

/**
 * The single home for Product DB logic.
 *
 * Route handlers stay thin and reusable from anywhere on the server
 * (server actions, scripts, cron) — they all hit these helpers.
 */

/** Fields the API returns alongside the product. */
const productInclude = {
  category: { select: { id: true, name: true, slug: true, image: true } },
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

/** Effective unit price of a product's primary variant (sale when valid). */
function primaryVariantPrice(product: ProductWithCategory): number {
  const variant = product.variants[0];
  if (!variant) return 0;
  const price = variant.price;
  const sale = variant.salePrice;
  return sale != null && sale.lessThan(price)
    ? sale.toNumber()
    : price.toNumber();
}

/**
 * Flatten a variant-based product into the legacy flat shape the API
 * has always exposed (price/discountPrice/image/images/stock), so
 * existing clients keep working. Price/stock come from the primary
 * variant; images come from the ProductImage rows. rating/reviewCount/
 * badge were dropped in the variant migration and default here.
 */
export function serializeProduct(product: ProductWithCategory) {
  const variant = product.variants[0];
  const listPrice = variant ? variant.price.toNumber() : 0;
  const sale =
    variant && variant.salePrice != null ? variant.salePrice.toNumber() : null;
  const discountPrice = sale != null && sale < listPrice ? sale : null;
  const imageUrls = product.images.map((img) => img.url);

  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: listPrice,
    discountPrice,
    stock: variant?.stock ?? 0,
    image: imageUrls[0] ?? null,
    images: imageUrls,
    rating: 0,
    reviewCount: 0,
    color: variant?.color ?? null,
    size: variant?.size ?? null,
    status: product.status,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      image: product.category.image,
    },
    // Expose the structured data too for clients that want it.
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: v.price.toNumber(),
      salePrice: v.salePrice != null ? v.salePrice.toNumber() : null,
      stock: v.stock,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/** Slugify a product name into a URL-safe, unique-ish slug. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "product";
}

/** Ensure a slug is unique by appending a short random suffix on collision. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const existing = await prisma.product.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  if (!existing) return base;
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Prefix + zero-padding width for human-readable product codes. */
const PRODUCT_CODE_PREFIX = "PRD-";
const PRODUCT_CODE_PAD = 5;

/** Format a sequence number into a product code, e.g. 42 -> "PRD-00042". */
function formatProductCode(sequence: number): string {
  return `${PRODUCT_CODE_PREFIX}${String(sequence).padStart(PRODUCT_CODE_PAD, "0")}`;
}

/**
 * Generate the next human-readable product code (e.g. "PRD-00042").
 *
 * Codes are sequential and easy to read/say over the phone. We derive the
 * next number from the highest existing code rather than a global counter
 * so it stays correct even if rows were imported out of band. The unique
 * constraint on `productCode` is the real guard; `createProduct` retries
 * on the rare collision from two concurrent creates.
 */
async function nextProductCode(): Promise<string> {
  const last = await prisma.product.findFirst({
    where: { productCode: { startsWith: PRODUCT_CODE_PREFIX } },
    orderBy: { productCode: "desc" },
    select: { productCode: true },
  });

  const lastSequence = last
    ? Number.parseInt(last.productCode.slice(PRODUCT_CODE_PREFIX.length), 10)
    : 0;
  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return formatProductCode(next);
}

/** Build the Prisma `where` clause from validated query params. */
function buildWhere(query: ProductQueryInput): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (query.search) {
    // Match the product name OR its category name so a search like
    // "electronics" surfaces every product in that category.
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      {
        category: {
          name: { contains: query.search, mode: "insensitive" },
        },
      },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status) where.status = query.status;

  if (query.minPrice != null || query.maxPrice != null) {
    // Price now lives on the product's variants, so filter by any
    // variant whose price falls in range.
    where.variants = {
      some: {
        price: {
          ...(query.minPrice != null ? { gte: query.minPrice } : {}),
          ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
        },
      },
    };
  }

  return where;
}

/**
 * Map our public `sort` value to a Prisma `orderBy`.
 *
 * Price now lives on the to-many `variants` relation, which Prisma
 * can't order a product list by directly. We keep the list query
 * stable by sorting on `createdAt` and re-ordering price-sorted
 * results in `listProducts` after the rows (with their primary
 * variant) are loaded.
 */
function buildOrderBy(
  sort: ProductQueryInput["sort"],
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "latest":
    case "price-low":
    case "price-high":
    default:
      return { createdAt: "desc" };
  }
}

/** Paginated, filtered, sorted product list. */
export async function listProducts(query: ProductQueryInput) {
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  // Run count + page query in parallel; one round trip's worth of latency.
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  // Price lives on variants, so price sorting is applied after load.
  let sortedItems = items;
  if (query.sort === "price-low" || query.sort === "price-high") {
    const dir = query.sort === "price-low" ? 1 : -1;
    sortedItems = [...items].sort(
      (a, b) => (primaryVariantPrice(a) - primaryVariantPrice(b)) * dir,
    );
  }

  return {
    items: sortedItems,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export function listProductsCached(query: ProductQueryInput) {
  return listProducts(query);
}

export function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

/**
 * Fetch a product only when it is publicly visible (status ACTIVE).
 *
 * Used by SEO surfaces (metadata, JSON-LD, sitemap) so draft/inactive/
 * soft-deleted products are never exposed to crawlers. Returns null for
 * missing OR inactive products.
 */
export function getActiveProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: productInclude,
  });
}

/** Fetch a product by its unique slug (any status), or null. */
export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
}

/**
 * Fetch a publicly visible (ACTIVE) product by slug, or null.
 *
 * The slug is the canonical, SEO-friendly product identifier used in
 * `/products/<slug>` URLs. Inactive/soft-deleted products resolve to
 * null so they are never exposed to crawlers.
 */
export function getActiveProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: productInclude,
  });
}

/** Resolve just the slug for a product id (used for id -> slug redirects). */
export async function getProductSlugById(id: string): Promise<string | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    select: { slug: true },
  });
  return row?.slug ?? null;
}

/**
 * Parse a size input that may contain comma-separated values (e.g. "M, L, XL"
 * or "10, 24, 90") into an array of individual size strings. Returns an array
 * with a single `null` entry when the input is empty/null.
 */
function parseSizes(raw: string | null | undefined): (string | null)[] {
  if (!raw || !raw.trim()) return [null];
  const parts = raw
    .split(/[,،]+/) // support both comma and Arabic comma
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [null];
}

export async function createProduct(input: CreateProductInput) {
  // The product holds catalog data; price/stock live on variants and
  // images become ProductImage rows. We keep the legacy flat input shape
  // and map it onto the new model here.
  const slug = await uniqueSlug(input.name);
  const imageUrls = [
    ...(input.image ? [input.image] : []),
    ...(input.images ?? []),
  ];
  // De-dupe while preserving order.
  const uniqueImages = Array.from(new Set(imageUrls));

  // Split comma-separated sizes into individual variants so the
  // storefront size picker gets real selectable options.
  const sizes = parseSizes(input.size);
  const variantsToCreate = sizes.map((size, index) => ({
    sku: sizes.length > 1
      ? `SKU-${slug}-${size?.toLowerCase().replace(/\s+/g, "") ?? "def"}-${Math.random().toString(36).slice(2, 6)}`
      : `SKU-${slug}-${Math.random().toString(36).slice(2, 8)}`,
    color: input.color ?? null,
    size,
    price: input.price,
    salePrice: input.discountPrice ?? null,
    stock: index === 0 ? input.stock : input.stock, // Each size variant gets the same stock
  }));

  // Generate a human-readable product code. The unique constraint is the
  // real guard, so on the rare concurrent-create collision (P2002) we
  // recompute the next code and retry a few times before giving up.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const productCode = await nextProductCode();
    try {
      return await prisma.product.create({
        data: {
          productCode,
          name: input.name,
          slug,
          description: input.description ?? null,
          status: input.status,
          categoryId: input.categoryId,
          variants: {
            create: variantsToCreate,
          },
          images: {
            create: uniqueImages.map((url, index) => ({
              url,
              position: index,
            })),
          },
        },
        include: productInclude,
      });
    } catch (error) {
      const isCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("productCode");
      if (isCodeCollision && attempt < MAX_ATTEMPTS - 1) continue;
      throw error;
    }
  }

  // Unreachable in practice: the loop either returns or throws above.
  throw new Error("Failed to generate a unique product code.");
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  // Catalog-level fields go on the product; price/stock map onto the
  // primary variant; image changes replace the ProductImage set.
  const productData: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) productData.name = input.name;
  if (input.description !== undefined) {
    productData.description = input.description;
  }
  if (input.status !== undefined) productData.status = input.status;
  if (input.categoryId !== undefined) {
    productData.category = { connect: { id: input.categoryId } };
  }

  // Determine whether size contains comma-separated values that need to
  // be expanded into multiple variants (one per size).
  const newSizes = input.size !== undefined ? parseSizes(input.size) : null;
  const needsVariantRebuild = newSizes !== null && newSizes.length > 1;

  // Resolve the primary variant for price/stock updates (single-variant path).
  const needsPrimaryUpdate =
    !needsVariantRebuild &&
    (input.price !== undefined ||
      input.discountPrice !== undefined ||
      input.stock !== undefined ||
      input.color !== undefined ||
      input.size !== undefined);

  const primaryVariant = needsPrimaryUpdate
    ? await prisma.productVariant.findFirst({
        where: { productId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
    : null;

  return prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: productData });

    if (needsVariantRebuild && newSizes) {
      // Multi-size path: replace all existing variants with one per size.
      // Fetch the current product to preserve color/price/stock defaults.
      const current = await tx.product.findUniqueOrThrow({
        where: { id },
        include: { variants: { orderBy: { createdAt: "asc" } } },
      });
      const baseVariant = current.variants[0];
      const color = input.color ?? baseVariant?.color ?? null;
      const price = input.price ?? (baseVariant ? baseVariant.price.toNumber() : 0);
      const salePrice = input.discountPrice !== undefined
        ? input.discountPrice
        : baseVariant?.salePrice != null
          ? baseVariant.salePrice.toNumber()
          : null;
      const stock = input.stock ?? baseVariant?.stock ?? 0;
      const slug = current.slug;

      // Delete existing variants and create new ones per size.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: newSizes.map((size) => ({
          productId: id,
          sku: `SKU-${slug}-${size?.toLowerCase().replace(/\s+/g, "") ?? "def"}-${Math.random().toString(36).slice(2, 6)}`,
          color,
          size,
          price,
          salePrice,
          stock,
        })),
      });
    } else if (primaryVariant) {
      // Single-variant path: update existing primary variant fields.
      const variantData: Prisma.ProductVariantUpdateInput = {};
      if (input.price !== undefined) variantData.price = input.price;
      if (input.discountPrice !== undefined) {
        variantData.salePrice = input.discountPrice;
      }
      if (input.stock !== undefined) variantData.stock = input.stock;
      if (input.color !== undefined) variantData.color = input.color;
      if (input.size !== undefined) variantData.size = input.size;
      await tx.productVariant.update({
        where: { id: primaryVariant.id },
        data: variantData,
      });
    }

    // Replace the image set when the caller provided image fields.
    if (input.image !== undefined || input.images !== undefined) {
      const imageUrls = [
        ...(input.image ? [input.image] : []),
        ...(input.images ?? []),
      ];
      const uniqueImages = Array.from(new Set(imageUrls));
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (uniqueImages.length > 0) {
        await tx.productImage.createMany({
          data: uniqueImages.map((url, index) => ({
            productId: id,
            url,
            position: index,
          })),
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where: { id },
      include: productInclude,
    });
  });
}

/**
 * Soft delete: flip status to INACTIVE rather than wipe the row.
 * Keeps order history, reviews, and analytics intact.
 */
export function softDeleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { status: "INACTIVE" },
    include: productInclude,
  });
}

/**
 * Hard delete: permanently remove the product row.
 *
 * Related rows are handled by DB relations:
 * - ProductImage/ProductVariant/CartItem/Wishlist cascade delete.
 * - OrderItem product/variant references are set to NULL (snapshot stays).
 */
export function hardDeleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}
