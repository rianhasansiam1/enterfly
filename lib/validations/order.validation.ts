import { z } from "zod";

import { ORDER_STATUSES } from "@/lib/orders/status";

/**
 * Zod schemas for the Order API.
 *
 * Notes:
 *  - The client never sends prices. We always recompute from the DB.
 *  - `items` is optional on create: when omitted, the order is built
 *    from the user's current cart. When provided, it overrides the
 *    cart (e.g. "Buy now" flow).
 *  - Order statuses come from `@/lib/orders/status`, the single source
 *    of truth shared with the service layer and the UI.
 */

const ORDER_STATUS = ORDER_STATUSES;

const PAYMENT_STATUS = ["PAID", "UNPAID"] as const;

const PAYMENT_METHOD = ["CASH_ON_DELIVERY"] as const;

/** Reusable field fragments. */
const customerName = z
  .string()
  .trim()
  .min(2, "Name is too short.")
  .max(120, "Name is too long.");

const customerPhone = z
  .string()
  .trim()
  .min(7, "Phone number is too short.")
  .max(20, "Phone number is too long.");

const customerAddress = z
  .string()
  .trim()
  .min(5, "Address is too short.")
  .max(500, "Address is too long.");

const orderItem = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  variantId: z.string().trim().min(1).optional(),
  quantity: z
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be at least 1.")
    .max(1000, "Quantity is too large."),
});

/** Body for `POST /api/orders`. */
export const createOrderSchema = z.object({
  // Optional. When omitted, order is built from the user's cart.
  items: z.array(orderItem).min(1).max(100).optional(),
  customerName,
  customerPhone,
  customerAddress,
  paymentMethod: z.enum(PAYMENT_METHOD).default("CASH_ON_DELIVERY"),
  // Optional explicit shipping fee override; service may also compute one.
  deliveryCharge: z
    .number()
    .finite()
    .nonnegative()
    .max(100000)
    .optional(),
  // Promo discount in currency units (not a percentage).
  discountAmount: z
    .number()
    .finite()
    .nonnegative()
    .max(1000000)
    .optional(),
  // Future-proofing: clear cart after order if items came from cart.
  clearCart: z.boolean().default(true),
});

/** Query string for `GET /api/orders/my-orders`. */
export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUS).optional(),
});

/** Query string for `GET /api/admin/orders`. */
export const adminOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  status: z.enum(ORDER_STATUS).optional(),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
});

/** Body for `PATCH /api/admin/orders/[id]/status`. */
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  // Optional free-text note recorded alongside the status change in the
  // order's audit trail (e.g. courier name, reason for cancellation).
  note: z.string().trim().max(500).optional(),
});

/** Body for `PATCH /api/admin/orders/[id]/payment-status`. */
export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUS),
});

/** Body for `PATCH /api/orders/[id]/cancel` — empty/optional reason. */
export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type AdminOrderQueryInput = z.infer<typeof adminOrderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
