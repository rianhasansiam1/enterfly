import { adminJsonRoute } from "@/lib/api/handlers";
import { updateOrderStatus } from "@/lib/services/order.service";
import { updateOrderStatusSchema } from "@/lib/validations/order.validation";

type Params = { id: string };

/**
 * PATCH /api/admin/orders/[id]/status
 *
 * Admin only. Validates the new status, enforces the allowed
 * transition graph, and — when moving to CANCELLED — restores stock
 * inside the same transaction.
 */
export const PATCH = adminJsonRoute<
  typeof updateOrderStatusSchema,
  unknown,
  Params
>({
  schema: updateOrderStatusSchema,
  scope: "admin.orders/[id].status.PATCH",
  revalidate: ["admin-orders"],
  handler: async ({ body, params, session }) => {
    const order = await updateOrderStatus(params.id, body, session.user.id);
    return { data: order };
  },
});
