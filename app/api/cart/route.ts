import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-check";
import { created, jsonError, ok } from "@/lib/api-response";
import { addToCart, getMyCart } from "@/lib/services/cart.service";
import { handleCartError } from "@/lib/services/cart-errors";
import { addToCartSchema } from "@/lib/validations/cart.validation";

/**
 * GET /api/cart
 *
 * Logged-in users only. Returns the caller's cart lines plus a
 * server-computed summary (totals come from DB prices, never the client).
 */
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const { items, summary } = await getMyCart(guard.session.user.id);
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
    return created(item);
  } catch (error) {
    return handleCartError("cart.POST", error);
  }
}
