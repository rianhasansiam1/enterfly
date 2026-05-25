import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import { getOrderForAdmin } from "@/lib/services/order.service";
import { handleOrderError } from "@/lib/services/order-errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/orders/[id]
 *
 * Admin only. Returns the full order with items, products, and the
 * customer's basic info.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const order = await getOrderForAdmin(id);
    if (!order) return jsonError(404, "Order not found.");
    return ok(order);
  } catch (error) {
    return handleOrderError("admin.orders/[id].GET", error);
  }
}
