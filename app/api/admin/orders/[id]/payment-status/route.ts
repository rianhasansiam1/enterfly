import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { updatePaymentStatus } from "@/lib/services/order.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updatePaymentStatusSchema } from "@/lib/validations/order.validation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/orders/[id]/payment-status
 *
 * Admin only. Flips between PAID and UNPAID with a no-op guard so we
 * don't generate empty audit noise.
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

  const parsed = updatePaymentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const order = await updatePaymentStatus(id, parsed.data);
    return ok(order);
  } catch (error) {
    return handleServiceError("admin.orders/[id].payment-status.PATCH", error);
  }
}
