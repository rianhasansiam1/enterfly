import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import {
  categoryHasProducts,
  getCategoryById,
  softDeleteCategory,
  updateCategory,
} from "@/lib/services/category.service";
import { updateCategorySchema } from "@/lib/validations/category.validation";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/categories/[id] — public, returns category + product count. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const category = await getCategoryById(id);
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
    return ok(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
 * Admin only. Refuses to delete if the category still has products
 * attached, then soft-deletes by flipping status to INACTIVE so any
 * historical references stay intact.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const existing = await getCategoryById(id);
  if (!existing) return jsonError(404, "Category not found.");

  if (await categoryHasProducts(id)) {
    return jsonError(
      409,
      "This category still has products. Move or remove them first.",
    );
  }

  try {
    const category = await softDeleteCategory(id);
    return ok(category);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Category not found.");
    }
    console.error("[categories/[id].DELETE] failed", error);
    return jsonError(500, "Failed to delete category.");
  }
}
