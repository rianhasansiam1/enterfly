import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

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
  category: { select: { id: true, name: true, image: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

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
    where.price = {
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
      return { price: "asc" };
    case "price-high":
      return { price: "desc" };
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

const getCachedProductList = unstable_cache(
  async (query: ProductQueryInput) => listProducts(query),
  ["products-list"],
  { revalidate: 300, tags: ["products"] },
);

export function listProductsCached(query: ProductQueryInput) {
  return getCachedProductList(query);
}

export function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export function createProduct(input: CreateProductInput) {
  // Drop `null` for optional Prisma fields so the DB defaults stay clean.
  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      discountPrice: input.discountPrice ?? null,
      stock: input.stock,
      image: input.image ?? null,
      images: input.images ?? [],
      badge: input.badge ?? null,
      status: input.status,
      categoryId: input.categoryId,
    },
    include: productInclude,
  });
}

export function updateProduct(id: string, input: UpdateProductInput) {
  // Build the `data` object explicitly so we never write `undefined`
  // (Prisma treats `undefined` as "skip", but being explicit is clearer).
  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = input.price;
  if (input.discountPrice !== undefined)
    data.discountPrice = input.discountPrice;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.image !== undefined) data.image = input.image;
  if (input.images !== undefined) data.images = input.images;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.status !== undefined) data.status = input.status;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }

  return prisma.product.update({
    where: { id },
    data,
    include: productInclude,
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
