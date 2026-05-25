import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-check";
import { created, jsonError, ok } from "@/lib/api-response";
import {
  createCategory,
  listCategories,
} from "@/lib/services/category.service";
import {
  categoryQuerySchema,
  createCategorySchema,
} from "@/lib/validations/category.validation";

/**
 * GET /api/categories
 *
 * Public listing with pagination, search, status filter, and sorting.
 * Pass `?withProductCount=true` to include `productCount` per row.
 * All knobs come from the query string; see `categoryQuerySchema`.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = categoryQuerySchema.safeParse(params);

  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listCategories(parsed.data);
    return ok(items, meta);
  } catch (error) {
    console.error("[categories.GET] failed", error);
    return jsonError(500, "Failed to fetch categories.");
  }
}

/**
 * POST /api/categories
 *
 * Admin-only. Generates a unique slug from the name, persists the
 * category, and returns it.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, "Content-Type must be application/json.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON payload.");
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const category = await createCategory(parsed.data);
    return created(category);
  } catch (error) {
    // P2002 = unique constraint violation. Shouldn't normally happen
    // because the service generates a unique slug, but a concurrent
    // create with the same name could still race us — return 409.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(409, "A category with that name already exists.");
    }
    console.error("[categories.POST] failed", error);
    return jsonError(500, "Failed to create category.");
  }
}
