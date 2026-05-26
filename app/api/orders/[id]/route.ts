import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  getOrderForAdmin,
  getOrderForUser,
} from "@/lib/services/order.service";
import { handleServiceError } from "@/lib/services/service-error";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id]
 *
 * Logged-in users only. Customers can read only their own order;
 * admins can read any. The customer query is scoped to `userId` in
 * SQL so unauthorized requests return 404 (no IDOR existence leak).
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const order =
      guard.session.user.role === "ADMIN"
        ? await getOrderForAdmin(id)
        : await getOrderForUser(id, guard.session.user.id);

    if (!order) return jsonError(404, "Order not found.");
    return ok(order);
  } catch (error) {
    return handleServiceError("orders/[id].GET", error);
  }
}
