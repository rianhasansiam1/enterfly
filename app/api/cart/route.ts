import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth-check";
import { created, jsonError, ok } from "@/lib/api-response";
import {
  addToCart,
  getMyCartCached,
  syncCartItems,
} from "@/lib/services/cart.service";
import { handleCartError } from "@/lib/services/cart-errors";
import {
  addToCartSchema,
  syncCartSchema,
} from "@/lib/validations/cart.validation";

function hasCartDbAccess(role: string | undefined): boolean {
  return role === "USER" || role === "ADMIN";
}

/**
 * GET /api/cart
 *
 * Logged-in users only. Returns the caller's cart lines plus a
 * server-computed summary (totals come from DB prices, never the client).
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  if (!hasCartDbAccess(guard.session.user.role)) {
    return jsonError(403, "Cart API is only available for USER/ADMIN.");
  }

  try {
    const { items, summary } = await getMyCartCached(guard.session.user.id);
    return ok({ items, summary });
  } catch (error) {
    return handleCartError("cart.GET", error);
  }
}

/**
 * POST /api/cart
 *
 * Logged-in users only. Adds a product (or increments quantity if the
 * user already has a row for it). Stock and status are checked in the
 * service; quantity is capped at `Product.stock`.
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  if (!hasCartDbAccess(guard.session.user.role)) {
    return jsonError(403, "Cart API is only available for USER/ADMIN.");
  }

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

  const parsed = addToCartSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const item = await addToCart(guard.session.user.id, parsed.data);
    revalidateTag("cart", "max");
    return created(item);
  } catch (error) {
    return handleCartError("cart.POST", error);
  }
}

/**
 * PUT /api/cart
 *
 * Logged-in USER/ADMIN only. Sync local cart payload into DB and
 * return the latest server cart snapshot.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  if (!hasCartDbAccess(guard.session.user.role)) {
    return jsonError(403, "Cart API is only available for USER/ADMIN.");
  }

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

  const parsed = syncCartSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const result = await syncCartItems(guard.session.user.id, parsed.data);
    revalidateTag("cart", "max");
    return ok(result);
  } catch (error) {
    return handleCartError("cart.PUT", error);
  }
}
