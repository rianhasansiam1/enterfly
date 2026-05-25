import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import { updateOrderStatus } from "@/lib/services/order.service";
import { handleOrderError } from "@/lib/services/order-errors";
import { updateOrderStatusSchema } from "@/lib/validations/order.validation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/orders/[id]/status
 *
 * Admin only. Validates the new status, enforces the allowed
 * transition graph, and — when moving to CANCELLED — restores stock
 * inside the same transaction.
 */
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

  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const order = await updateOrderStatus(id, parsed.data);
    return ok(order);
  } catch (error) {
    return handleOrderError("admin.orders/[id].status.PATCH", error);
  }
}
