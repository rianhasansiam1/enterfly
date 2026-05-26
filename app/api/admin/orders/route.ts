import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { listOrdersForAdmin } from "@/lib/services/order.service";
import { handleServiceError } from "@/lib/services/service-error";
import { adminOrderQuerySchema } from "@/lib/validations/order.validation";

/**
 * GET /api/admin/orders
 *
 * Admin only. Pagination, search by orderNumber/customerName/phone,
 * filter by order status and payment status, newest first. Each row
 * carries the user's basic info and the count of items.
 */



export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminOrderQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listOrdersForAdmin(parsed.data);
    return ok(items, meta);
  } catch (error) {
    return handleServiceError("admin.orders.GET", error);
  }
}
