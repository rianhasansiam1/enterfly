import { z } from "zod";

/**
 * Zod schemas for the Checkout API.
 *
 * Notes:
 *  - Items are optional on every checkout call. When omitted, the
 *    cart is loaded server-side from `CartItem` for the authenticated
 *    user. Pass `items` directly for the "Buy now" flow.
 *  - Prices, taxes, and shipping are NEVER read from the client; the
 *    service recomputes everything from the DB. The body only carries
 *    the customer's choices (items, address, promo code, payment).
 */

const PAYMENT_METHOD = ["CASH_ON_DELIVERY", "ONLINE"] as const;

const checkoutItem = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  quantity: z
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be at least 1.")
    .max(1000, "Quantity is too large."),
});

/**
 * Body for `POST /api/checkout/preview`.
 *
 * Authenticated users only. Used by the checkout page to compute
 * totals as the customer types their promo code or toggles between
 * cart / buy-now items. Read-only by design.
 */
export const checkoutPreviewSchema = z.object({
  items: z.array(checkoutItem).max(100).optional(),
  promoCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .optional()
    .nullable(),
});

/**
 * Body for `POST /api/checkout`.
 *
 * Authenticated users only. The route guard rejects anonymous requests
 * with 401 before the body is even parsed. The order is always
 * attached to the session userId.
 */
export const checkoutSchema = z.object({
  items: z.array(checkoutItem).max(100).optional(),
  customerName: z
    .string()
    .trim()
    .min(2, "Name is too short.")
    .max(120, "Name is too long."),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long."),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(160)
    .optional()
    .or(z.literal("")),
  customerAddress: z
    .string()
    .trim()
    .min(5, "Address is too short.")
    .max(500, "Address is too long."),
  customerCity: z
    .string()
    .trim()
    .min(2, "City / district is too short.")
    .max(120, "City / district is too long.")
    .optional()
    .or(z.literal("")),
  customerPostalCode: z
    .string()
    .trim()
    .min(3, "Postal code is too short.")
    .max(20, "Postal code is too long.")
    .optional()
    .or(z.literal("")),
  customerNote: z
    .string()
    .trim()
    .max(1000, "Note is too long.")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHOD).default("CASH_ON_DELIVERY"),
  promoCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .optional()
    .nullable(),
  // Whether to clear the user's cart after a successful order. Only
  // meaningful when the order's items came from the persisted cart.
  clearCart: z.boolean().default(true),
});

export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
