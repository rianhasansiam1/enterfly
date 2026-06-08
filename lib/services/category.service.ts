import "server-only";

import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import type {
  CategoryQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validations/category.validation";

/**
 * The single home for Category DB logic.
 *
 * Route handlers stay thin and these helpers stay reusable from
 * server actions, scripts, or cron — wherever a Prisma client is
 * available.
 */

/** Public shape returned to clients (no relation includes by default). */
const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type Category = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

export type CategoryWithProductCount = Category & {
  productCount: number;
};

/**
 * Slugify a name into a URL-safe identifier.
 *
 * Tiny and dependency-free: lowercase, strip diacritics, collapse any
 * non-alphanumeric run into a single dash, and trim leading/trailing
 * dashes. Good enough for category names.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build the Prisma `where` clause from validated query params. */
function buildWhere(query: CategoryQueryInput): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = {};

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }
  if (query.status) where.status = query.status;

  return where;
}

/** Map our public `sort` value to a Prisma `orderBy`. */
function buildOrderBy(
  sort: CategoryQueryInput["sort"],
): Prisma.CategoryOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "latest":
    default:
      return { createdAt: "desc" };
  }
}

/** Paginated, filtered, sorted category list. */
export async function listCategories(query: CategoryQueryInput) {
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query.sort);
  const skip = (query.page - 1) * query.pageSize;

  // Count + page in parallel so we only pay one round-trip's latency.
  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      select: query.withProductCount
        ? { ...categorySelect, _count: { select: { products: true } } }
        : categorySelect,
    }),
    prisma.category.count({ where }),
  ]);

  // Flatten `_count.products` into `productCount` so the API stays simple.
  const items = query.withProductCount
    ? rows.map((row) => {
        const { _count, ...rest } = row as Category & {
          _count: { products: number };
        };
        return { ...rest, productCount: _count.products };
      })
    : (rows as Category[]);

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

/**
 * Cache layer over `listCategories`. Tagged `categories` so any
 * create / update / soft-delete can bust it on demand. Same 300s TTL
 * as products and orders to stay consistent across the admin panel.
 */
const getCachedCategoryList = unstable_cache(
  async (query: CategoryQueryInput) => listCategories(query),
  ["categories-list"],
  { revalidate: 300, tags: ["categories"] },
);

export function listCategoriesCached(query: CategoryQueryInput) {
  return getCachedCategoryList(query);
}

/** Single category + product count, or `null` if not found. */
export async function getCategoryById(
  id: string,
): Promise<CategoryWithProductCount | null> {
  const row = await prisma.category.findUnique({
    where: { id },
    select: { ...categorySelect, _count: { select: { products: true } } },
  });
  if (!row) return null;

  const { _count, ...rest } = row;
  return { ...rest, productCount: _count.products };
}

/**
 * Public category landing data, looked up by slug.
 *
 * Returns the ACTIVE category plus its ACTIVE products (primary variant
 * price + first image flattened for cards). Returns null when the
 * category is missing or INACTIVE so SEO/landing surfaces never expose
 * hidden categories. Cached + tagged like the rest of the category
 * reads so admin edits bust it on the next request.
 */
export type PublicCategoryProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  inStock: boolean;
  variantCount: number;
};

export type PublicCategory = Category & {
  products: PublicCategoryProduct[];
};

async function loadActiveCategoryBySlug(
  slug: string,
): Promise<PublicCategory | null> {
  const row = await prisma.category.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      ...categorySelect,
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          salePrice: true,
          discountPrice: true,
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
          variants: {
            orderBy: { createdAt: "asc" },
            select: { stock: true },
          },
        },
      },
    },
  });

  if (!row) return null;

  const { products, ...category } = row;

  return {
    ...category,
    products: products.map((product) => {
      const price = product.salePrice.toNumber();
      const sale = product.discountPrice?.toNumber() ?? null;
      const discountPrice = sale != null && sale < price ? sale : null;
      const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price,
        discountPrice,
        image: product.images[0]?.url ?? null,
        inStock: stock > 0,
        variantCount: product.variants.length,
      };
    }),
  };
}

const getCachedCategoryBySlug = unstable_cache(
  (slug: string) => loadActiveCategoryBySlug(slug),
  ["category-by-slug"],
  { revalidate: 300, tags: ["categories"] },
);

export function getActiveCategoryBySlug(slug: string) {
  return getCachedCategoryBySlug(slug);
}

/** Quick existence check without pulling the row. */
export function categoryHasProducts(id: string): Promise<boolean> {
  return prisma.product
    .findFirst({ where: { categoryId: id }, select: { id: true } })
    .then((row) => row !== null);
}

/**
 * Generate a unique slug.
 *
 * Tries the base slug first; on collision appends `-2`, `-3`, ... until
 * a free one is found. `excludeId` lets PATCH skip the row being edited
 * so renaming back to your own slug doesn't trigger a false collision.
 */
async function generateUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || "category";

  let candidate = root;
  let suffix = 1;

  // Cap the loop so a pathological dataset can't spin forever.
  for (let i = 0; i < 50; i++) {
    const clash = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }

  // Extremely unlikely fallback — guarantees uniqueness via timestamp.
  return `${root}-${Date.now()}`;
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = await generateUniqueSlug(input.name);

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      image: input.image ?? null,
      status: input.status,
    },
    select: categorySelect,
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  // Build `data` explicitly so we never write `undefined` and so we
  // only regenerate the slug when the name actually changes.
  const data: Prisma.CategoryUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name;
    data.slug = await generateUniqueSlug(input.name, id);
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.image !== undefined) data.image = input.image;
  if (input.status !== undefined) data.status = input.status;

  return prisma.category.update({
    where: { id },
    data,
    select: categorySelect,
  });
}

/**
 * Soft delete: flip status to INACTIVE rather than wipe the row.
 * Keeps any historical FK references (e.g. category banners) intact.
 */
export function softDeleteCategory(id: string) {
  return prisma.category.update({
    where: { id },
    data: { status: "INACTIVE" },
    select: categorySelect,
  });
}

/**
 * Hard delete a category and all products under it.
 *
 * Product delete cascades to ProductImage/ProductVariant/CartItem/Wishlist/
 * Review, while OrderItem keeps snapshots by nulling product/variant FKs.
 */
export async function hardDeleteCategoryWithProducts(id: string) {
  return prisma.$transaction(async (tx) => {
    const deletedProducts = await tx.product.deleteMany({
      where: { categoryId: id },
    });

    const deletedCategory = await tx.category.delete({
      where: { id },
      select: categorySelect,
    });

    return {
      category: deletedCategory,
      deletedProducts: deletedProducts.count,
    };
  });
}
