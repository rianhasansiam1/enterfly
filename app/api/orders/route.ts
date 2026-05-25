import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-check";
import { created, jsonError } from "@/lib/api-response";
import { createOrder } from "@/lib/services/order.service";
import { handleOrderError } from "@/lib/services/order-errors";
import { createOrderSchema } from "@/lib/validations/order.validation";

/**
 * POST /api/orders
 *
 * Logged-in users only. Creates an order from request body items or,
 * when `items` is omitted, from the user's current cart. Stock checks,
 * total calculation, and (optional) cart clearing all happen inside
 * one Prisma transaction in the service.
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const order = await createOrder(guard.session.user.id, parsed.data);
    return created(order);
  } catch (error) {
    return handleOrderError("orders.POST", error);
  }
}
