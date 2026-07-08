import { z } from "zod";

/**
 * Zod schemas for the Product API.
 *
 * Kept separate from `app/api/products/*` so the same schemas can be
 * reused by server actions, admin forms, or future clients without
 * pulling in any HTTP code.
 *
 * The shapes mirror the Prisma `Product` model and its `ProductStatus`
 * enum — keep them aligned when the schema changes.
 *
 * Pricing now lives on the Product (`buyingPrice`/`salePrice`/
 * `discountPrice`) and each `ProductVariant` is a purchasable
 * size+color inventory row.
 */

const PRODUCT_STATUS = ["ACTIVE", "INACTIVE"] as const;

const SORT_VALUES = [
  "latest",
  "newest",
  "price-low",
  "price-high",
  "popular",
  "rating",
] as const;

/** Common reusable fragments. */
const name = z
  .string()
  .trim()
  .min(2, "Product name is too short.")
  .max(150, "Product name is too long.");

const description = z
  .string()
  .trim()
  .max(5000, "Description is too long.")
  .optional()
  .nullable();

/** Business purchase/source cost. Required, admin-only, never negative. */
const buyingPrice = z
  .number({ error: "Buying price must be a number." })
  .finite()
  .nonnegative("Buying price cannot be negative.");

/** Normal customer selling price. Required, never negative. */
const salePrice = z
  .number({ error: "Sale price must be a number." })
  .finite()
  .nonnegative("Sale price cannot be negative.");

/** Optional discounted selling price. Nullable, never negative. */
const discountPrice = z
  .number({ error: "Discount price must be a number." })
  .finite()
  .nonnegative("Discount price cannot be negative.")
  .optional()
  .nullable();

const stock = z
  .number({ error: "Stock must be a number." })
  .int("Stock must be a whole number.")
  .nonnegative("Stock cannot be negative.");

const image = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable();

const images = z.array(z.string().trim().max(2048)).max(20).optional();

/**
 * A single purchasable size+color variant row. Size and color are
 * required so each row maps to a concrete combination (e.g. "M / Red").
 * `sku` is optional but unique when provided (enforced by the DB + the
 * service). `id` is present only when editing an existing variant.
 */
const variantInput = z.object({
  id: z.string().trim().min(1).optional(),
  size: z.string().trim().min(1, "Size is required.").max(40),
  color: z.string().trim().min(1, "Color is required.").max(40),
  sku: z.string().trim().min(1).max(80).optional().nullable(),
  stock: stock.default(0),
  image: image,
  isActive: z.boolean().default(true),
});

export type ProductVariantInput = z.infer<typeof variantInput>;

/** Cross-field guards shared by create/update. */
function discountWithinSale(data: {
  salePrice?: number;
  discountPrice?: number | null;
}): boolean {
  if (data.discountPrice == null || data.salePrice == null) return true;
  return data.discountPrice <= data.salePrice;
}

/** No two variant rows may share the same size+color (case-insensitive). */
function variantsHaveUniqueCombos(
  variants: ProductVariantInput[] | undefined,
): boolean {
  if (!variants || variants.length === 0) return true;
  const seen = new Set<string>();
  for (const v of variants) {
    const key = `${v.size.trim().toLowerCase()}|${v.color.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

/** No two provided SKUs may collide (ignores blank/missing SKUs). */
function variantsHaveUniqueSkus(
  variants: ProductVariantInput[] | undefined,
): boolean {
  if (!variants || variants.length === 0) return true;
  const seen = new Set<string>();
  for (const v of variants) {
    const sku = v.sku?.trim();
    if (!sku) continue;
    const key = sku.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

/** Body for `POST /api/products`. */
export const createProductSchema = z
  .object({
    name,
    description,
    buyingPrice,
    salePrice,
    discountPrice,
    image,
    images,
    status: z.enum(PRODUCT_STATUS).default("ACTIVE"),
    categoryId: z.string().trim().min(1, "Category is required."),
    variants: z.array(variantInput).min(1, "Add at least one variant."),
  })
  .refine(discountWithinSale, {
    path: ["discountPrice"],
    message: "Discount price cannot exceed the sale price.",
  })
  .refine((data) => variantsHaveUniqueCombos(data.variants), {
    path: ["variants"],
    message: "Each size + color combination must be unique.",
  })
  .refine((data) => variantsHaveUniqueSkus(data.variants), {
    path: ["variants"],
    message: "Each SKU must be unique.",
  });

/**
 * Body for `PATCH /api/products/[id]`.
 *
 * All fields optional. The cross-field discount check is re-applied
 * after merging with the existing product in the service/route. When
 * `variants` is provided it is treated as the full desired set (the
 * service reconciles create/update/delete).
 */
export const updateProductSchema = z
  .object({
    name: name.optional(),
    description,
    buyingPrice: buyingPrice.optional(),
    salePrice: salePrice.optional(),
    discountPrice,
    image,
    images,
    status: z.enum(PRODUCT_STATUS).optional(),
    categoryId: z.string().trim().min(1).optional(),
    variants: z.array(variantInput).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  })
  .refine((data) => variantsHaveUniqueCombos(data.variants), {
    path: ["variants"],
    message: "Each size + color combination must be unique.",
  })
  .refine((data) => variantsHaveUniqueSkus(data.variants), {
    path: ["variants"],
    message: "Each SKU must be unique.",
  });

/**
 * Query string for `GET /api/products`.
 *
 * `z.coerce.*` because URLSearchParams values are always strings.
 * Defaults keep the route simple — callers only need to pass what
 * they want to override.
 */
export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    /** Preferred alias — maps to `pageSize` internally. */
    limit: z.coerce.number().int().min(1).max(100).optional(),
    /** Legacy name kept for backward compat; `limit` takes precedence. */
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().min(1).max(150).optional(),
    categoryId: z.string().trim().min(1).optional(),
    /** Category **slug** — SEO-friendly alternative to `categoryId`. */
    category: z.string().trim().min(1).max(100).optional(),
    status: z.enum(PRODUCT_STATUS).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    /** When true, only products with at least one variant in stock. */
    inStock: z
      .union([z.boolean(), z.string()])
      .transform((v) => (typeof v === "string" ? v === "true" || v === "1" : v))
      .pipe(z.boolean())
      .optional(),
    sort: z.enum(SORT_VALUES).default("latest"),
  })
  .refine(
    (data) =>
      data.minPrice == null ||
      data.maxPrice == null ||
      data.minPrice <= data.maxPrice,
    {
      path: ["minPrice"],
      message: "minPrice cannot be greater than maxPrice.",
    },
  )
  .transform((data) => ({
    ...data,
    // Normalise: downstream always reads `pageSize`.
    pageSize: data.limit ?? data.pageSize ?? 20,
  }));

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
