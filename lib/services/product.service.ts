
import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
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
 *
 * Pricing lives on the Product (`buyingPrice`/`salePrice`/`discountPrice`).
 * `buyingPrice` is the business source cost and is ADMIN-ONLY: it is only
 * serialized when `includeBuyingPrice` is explicitly passed by an
 * authenticated admin route. Each `ProductVariant` is a purchasable
 * size+color inventory row (no price of its own).
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

/**
 * Customer-facing effective price of a product: the discount price when
 * set (and valid), otherwise the sale price.
 */
export function effectiveProductPrice(product: {
  salePrice: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
}): number {
  const sale = product.salePrice.toNumber();
  const discount = product.discountPrice?.toNumber() ?? null;
  return discount != null && discount < sale ? discount : sale;
}

export type SerializeOptions = {
  /** Admin-only: include the business `buyingPrice`. Default false. */
  includeBuyingPrice?: boolean;
};

/**
 * Flatten a product into the shape the API exposes. The public contract
 * keeps `price` (the regular sale price) and `discountPrice`; `salePrice`
 * is exposed as an explicit alias of `price`. `buyingPrice` is included
 * ONLY when `includeBuyingPrice` is true (admin routes) and is never sent
 * to public clients.
 *
 * `stock` is the sum of stock across all variants; `color`/`size` come
 * from the primary (oldest) variant for legacy single-value consumers.
 */
export function serializeProduct(
  product: ProductWithCategory,
  options: SerializeOptions = {},
) {
  const salePrice = product.salePrice.toNumber();
  const discountPrice =
    product.discountPrice != null ? product.discountPrice.toNumber() : null;
  const effectiveDiscount =
    discountPrice != null && discountPrice < salePrice ? discountPrice : null;
  const imageUrls = product.images.map((img) => img.url);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const primary = product.variants[0];

  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    slug: product.slug,
    description: product.description,
    // `price` keeps its long-standing meaning: the regular selling price.
    price: salePrice,
    salePrice,
    discountPrice: effectiveDiscount,
    ...(options.includeBuyingPrice
      ? { buyingPrice: product.buyingPrice.toNumber() }
      : {}),
    stock: totalStock,
    image: imageUrls[0] ?? null,
    images: imageUrls,
    rating: 0,
    reviewCount: 0,
    color: primary?.color ?? null,
    size: primary?.size ?? null,
    variantCount: product.variants.length,
    status: product.status,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      image: product.category.image,
    },
    // Variants are pure size/color inventory rows — no price exposed.
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      stock: v.stock,
      image: v.image,
      isActive: v.isActive,
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
    // Price lives on the product now — filter on the regular sale price.
    where.salePrice = {
      ...(query.minPrice != null ? { gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
}

/** Map our public `sort` value to a Prisma `orderBy`. */
function buildOrderBy(
  sort: ProductQueryInput["sort"],
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-low":
      return { salePrice: "asc" };
    case "price-high":
      return { salePrice: "desc" };
    case "latest":
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

  return {
    items,
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

/** Normalize an optional SKU: blank -> null. */
function normalizeSku(sku: string | null | undefined): string | null {
  const trimmed = sku?.trim();
  return trimmed ? trimmed : null;
}

export async function createProduct(input: CreateProductInput) {
  const slug = await uniqueSlug(input.name);
  const imageUrls = [
    ...(input.image ? [input.image] : []),
    ...(input.images ?? []),
  ];
  // De-dupe while preserving order.
  const uniqueImages = Array.from(new Set(imageUrls));

  const variantsToCreate = input.variants.map((v) => ({
    size: v.size,
    color: v.color,
    sku: normalizeSku(v.sku),
    stock: v.stock,
    image: v.image ?? null,
    isActive: v.isActive,
  }));

  // Generate a human-readable product code. The unique constraint is the
  // real guard, so on the rare concurrent-create collision (P2002) we
  // recompute the next code and retry a few times before giving up. The
  // product and its variants are written together in a single create.
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
          buyingPrice: input.buyingPrice,
          salePrice: input.salePrice,
          discountPrice: input.discountPrice ?? null,
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
  // Catalog + pricing fields go on the product; image changes replace the
  // ProductImage set; when `variants` is supplied it is reconciled
  // (update existing / create new / delete removed) inside the transaction.
  const productData: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) productData.name = input.name;
  if (input.description !== undefined) {
    productData.description = input.description;
  }
  if (input.status !== undefined) productData.status = input.status;
  if (input.categoryId !== undefined) {
    productData.category = { connect: { id: input.categoryId } };
  }
  if (input.buyingPrice !== undefined) productData.buyingPrice = input.buyingPrice;
  if (input.salePrice !== undefined) productData.salePrice = input.salePrice;
  if (input.discountPrice !== undefined) {
    productData.discountPrice = input.discountPrice;
  }

  return prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: productData });

    if (input.variants !== undefined) {
      const existing = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((v) => v.id));
      const keptIds = new Set<string>();

      for (const variant of input.variants) {
        const data = {
          size: variant.size,
          color: variant.color,
          sku: normalizeSku(variant.sku),
          stock: variant.stock,
          image: variant.image ?? null,
          isActive: variant.isActive,
        };

        if (variant.id && existingIds.has(variant.id)) {
          keptIds.add(variant.id);
          await tx.productVariant.update({
            where: { id: variant.id },
            data,
          });
        } else {
          await tx.productVariant.create({
            data: { productId: id, ...data },
          });
        }
      }

      // Delete variants the caller dropped from the set.
      const toDelete = [...existingIds].filter((vid) => !keptIds.has(vid));
      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete } },
        });
      }
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
