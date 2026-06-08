import type { z } from "zod";

import { adminRoute } from "@/lib/api/handlers";
import { listOrdersForAdminCached } from "@/lib/services/order.service";
import { adminOrderQuerySchema } from "@/lib/validations/order.validation";

type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;

/**
 * GET /api/admin/orders
 *
 * Admin only. Pagination, search by orderNumber/customerName/phone,
 * filter by order status and payment status, newest first. Each row
 * carries the user's basic info and the count of items.
 */



export const GET = adminRoute({
  scope: "admin.orders.GET",
  querySchema: adminOrderQuerySchema,
  handler: async ({ query }) => {
    const { items, meta } = await listOrdersForAdminCached(query as AdminOrderQuery);
    return { data: items, meta };
  },
});
