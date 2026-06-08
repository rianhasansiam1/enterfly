import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { isAdminRequest, requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  getProductById,
  hardDeleteProduct,
  serializeProduct,
  updateProduct,
} from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validations/product.validation";

type RouteContext = { params: Promise<{ id: string }> };






/** GET /api/products/[id] — public, returns product + category. */

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const product = await getProductById(id);
    if (!product) return jsonError(404, "Product not found.");
    const includeBuyingPrice = await isAdminRequest();
    return ok(serializeProduct(product, { includeBuyingPrice }));
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

  // Cross-field check: if either salePrice or discountPrice is being
  // updated, the resulting pair must still satisfy discount <= sale.
  const existing = await getProductById(id);
  if (!existing) return jsonError(404, "Product not found.");

  const existingSale = existing.salePrice.toNumber();
  const existingDiscount =
    existing.discountPrice != null ? existing.discountPrice.toNumber() : null;

  const nextSale = parsed.data.salePrice ?? existingSale;
  const nextDiscount =
    parsed.data.discountPrice !== undefined
      ? parsed.data.discountPrice
      : existingDiscount;
  if (nextDiscount != null && nextDiscount > nextSale) {
    return jsonError(400, "Discount price cannot exceed the sale price.", {
      fieldErrors: { discountPrice: ["Discount price exceeds sale price."] },
    });
  }

  try {
    const product = await updateProduct(id, parsed.data);
    revalidateTag("products", "max");
    revalidateTag("home-categories", "max");
    return ok(serializeProduct(product, { includeBuyingPrice: true }));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonError(404, "Product not found.");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("sku")) {
        return jsonError(409, "A variant SKU must be unique.", {
          fieldErrors: { variants: ["Duplicate SKU."] },
        });
      }
      return jsonError(409, "Each size + color combination must be unique.", {
        fieldErrors: { variants: ["Duplicate size + color combination."] },
      });
    }
    console.error("[products/[id].PATCH] failed", error);
    return jsonError(500, "Failed to update product.");
  }
}














/**
 * DELETE /api/products/[id]
 *
 * Admin only. Hard delete removes the product permanently.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  const existing = await getProductById(id);
  if (!existing) return jsonError(404, "Product not found.");

  try {
    await hardDeleteProduct(id);
    revalidateTag("products", "max");
    revalidateTag("home-categories", "max");
    return ok(serializeProduct(existing));
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
