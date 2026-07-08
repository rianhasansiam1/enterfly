import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { placeOrder } from "@/lib/services/checkout.service";
import { handleServiceError } from "@/lib/services/service-error";
import { checkoutSchema } from "@/lib/validations/checkout.validation";

/**
 * POST /api/orders
 *
 * Logged-in users only. Thin alias over the checkout flow so there is a
 * single, safe order-creation path. All money (subtotal, discount,
 * delivery, tax, totals, promo) is recomputed server-side from the DB by
 * `checkout.service.placeOrder`; nothing in the body can shift the price.
 * Stock decrement, order-item snapshots, inventory logging, promo
 * handling, and optional cart clearing all happen inside one transaction.
 *
 * NOTE: This used to call `order.service.createOrder`, which trusted
 * client-supplied `discountAmount`/`deliveryCharge`. That price-
 * manipulation path has been removed from the HTTP surface.
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

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const result = await placeOrder(guard.session.user.id, parsed.data);
    // Order creation changes stock and (optionally) empties the cart.
    revalidateTag("admin-orders", "max");
    revalidateTag("admin-dashboard", "max");
    revalidateTag("admin-reports", "max");
    revalidateTag("products", "max");
    revalidateTag("product-detail", "max");
    revalidateTag("home-categories", "max");
    revalidateTag("categories", "max");
    return created(result.order);
  } catch (error) {
    return handleServiceError("orders.POST", error);
  }
}
