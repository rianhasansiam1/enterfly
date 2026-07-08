import type { NextRequest } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { z } from "zod";

import { isAdminRequest, requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  CATEGORY_MUTATION_CACHE_TAGS,
  revalidateCacheTags,
} from "@/lib/cache/revalidation";
import {
  getActiveCategoryById,
  getCategoryById,
  softDeleteCategoryWithProducts,
  updateCategory,
} from "@/lib/services/category.service";
import { updateCategorySchema } from "@/lib/validations/category.validation";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/categories/[id] — public, returns category + product count. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const category = (await isAdminRequest())
      ? await getCategoryById(id)
      : await getActiveCategoryById(id);
    if (!category) return jsonError(404, "Category not found.");
    return ok(category);
  } catch (error) {
    console.error("[categories/[id].GET] failed", error);
    return jsonError(500, "Failed to fetch category.");
  }
}

/** PATCH /api/categories/[id] — admin only, partial update. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

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

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  // Existence check first so we always return 404 (not 500) for missing rows.
  const existing = await getCategoryById(id);
  if (!existing) return jsonError(404, "Category not found.");

  try {
    const category = await updateCategory(id, parsed.data);
    revalidateCacheTags(CATEGORY_MUTATION_CACHE_TAGS);
    return ok(category);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return jsonError(404, "Category not found.");
      }
      if (error.code === "P2002") {
        return jsonError(409, "A category with that name already exists.");
      }
    }
    console.error("[categories/[id].PATCH] failed", error);
    return jsonError(500, "Failed to update category.");
  }
}

/**
 * DELETE /api/categories/[id]
 *
 * Admin only. Normal delete is a safe soft delete: the category and
 * its products are moved to INACTIVE instead of being removed.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const existing = await getCategoryById(id);
  if (!existing) return jsonError(404, "Category not found.");

  try {
    const result = await softDeleteCategoryWithProducts(id);
    revalidateCacheTags(CATEGORY_MUTATION_CACHE_TAGS);
    return ok(result.category);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Category not found.");
    }
    console.error("[categories/[id].DELETE] failed", error);
    return jsonError(500, "Failed to deactivate category.");
  }
}
