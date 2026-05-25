import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import {getProductById,softDeleteProduct,updateProduct,} from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validations/product.validation";

type RouteContext = { params: Promise<{ id: string }> };






/** GET /api/products/[id] — public, returns product + category. */

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const product = await getProductById(id);
    if (!product) return jsonError(404, "Product not found.");
    return ok(product);
  } catch (error) {
    console.error("[products/[id].GET] failed", error);
    return jsonError(500, "Failed to fetch product.");
  }
}










/** PATCH /api/products/[id] — admin only, partial update. */
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

  const parsed = updateProductSchema.safeParse(body);
  
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  // Cross-field check: if either price or discountPrice is being updated,
  // the resulting pair must still satisfy discount <= price.
  const existing = await getProductById(id);
  if (!existing) return jsonError(404, "Product not found.");

  const nextPrice = parsed.data.price ?? existing.price;
  const nextDiscount =
    parsed.data.discountPrice !== undefined
      ? parsed.data.discountPrice
      : existing.discountPrice;
  if (nextDiscount != null && nextDiscount > nextPrice) {
    return jsonError(400, "Discount price cannot exceed the regular price.", {
      fieldErrors: { discountPrice: ["Discount price exceeds price."] },
    });
  }

  try {
    const product = await updateProduct(id, parsed.data);
    return ok(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Product not found.");
    }
    console.error("[products/[id].PATCH] failed", error);
    return jsonError(500, "Failed to update product.");
  }
}














/**
 * DELETE /api/products/[id]
 *
 * Admin only. Soft delete by flipping status to INACTIVE so order
 * history and reviews keep their FK references intact.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const existing = await getProductById(id);
  if (!existing) return jsonError(404, "Product not found.");

  try {
    const product = await softDeleteProduct(id);
    return ok(product);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Product not found.");
    }
    console.error("[products/[id].DELETE] failed", error);
    return jsonError(500, "Failed to delete product.");
  }
}
