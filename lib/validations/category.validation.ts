import { z } from "zod";

/**
 * Zod schemas for the Category API.
 *
 * Kept HTTP-free so the same shapes can power server actions, admin
 * forms, or seed scripts. Mirror the Prisma `Category` model and its
 * `CategoryStatus` enum — keep them in sync when the schema changes.
 */

const CATEGORY_STATUS = ["ACTIVE", "INACTIVE"] as const;

const SORT_VALUES = ["latest", "oldest", "name-asc", "name-desc"] as const;

/** Reusable fragments. */
const name = z
  .string()
  .trim()
  .min(2, "Category name is too short.")
  .max(80, "Category name is too long.");

const description = z
  .string()
  .trim()
  .max(2000, "Description is too long.")
  .optional()
  .nullable();

const image = z.string().trim().max(2048).optional().nullable();

/** Body for `POST /api/categories`. */
export const createCategorySchema = z.object({
  name,
  description,
  image,
  status: z.enum(CATEGORY_STATUS).default("ACTIVE"),
});

/**
 * Body for `PATCH /api/categories/[id]`.
 *
 * Every field optional, but at least one must be provided so a PATCH
 * can never be a silent no-op.
 */
export const updateCategorySchema = z
  .object({
    name: name.optional(),
    description,
    image,
    status: z.enum(CATEGORY_STATUS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

/**
 * Query string for `GET /api/categories`.
 *
 * `z.coerce.*` because URLSearchParams values are strings. Defaults
 * keep callers minimal — pass only what you want to override.
 */
export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(80).optional(),
  status: z.enum(CATEGORY_STATUS).optional(),
  sort: z.enum(SORT_VALUES).default("latest"),
  // `?withProductCount=true` opts into the extra count aggregation.
  withProductCount: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
