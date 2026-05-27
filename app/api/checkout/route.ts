import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { placeOrder } from "@/lib/services/checkout.service";
import { handleServiceError } from "@/lib/services/service-error";
import { checkoutSchema } from "@/lib/validations/checkout.validation";

/**
 * POST /api/checkout
 *
 * Authenticated users only. Totals are recomputed from the DB so
 * nothing in the body can shift the price. Customers can omit `items`
 * to have their persisted cart used, or pass `items` directly for the
 * "Buy now" flow. The order is always attached to the session userId.
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
    revalidateTag("admin-orders", "max");
    revalidateTag("cart", "max");
    return created(result);
  } catch (error) {
    return handleServiceError("checkout.POST", error);
  }
}
