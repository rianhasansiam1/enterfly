import { z } from "zod";

/**
 * Zod schemas for the Cart API.
 *
 * Notes:
 *  - Frontend sends `productId` and `quantity` only. Price, discount,
 *    stock, and status are all read from the DB inside the service.
 *  - Quantity is bounded so callers can't spam huge integers; the
 *    real (per-product) cap is enforced against `Product.stock` later.
 */

const productId = z.string().trim().min(1, "Product is required.");

const quantity = z
  .number({ error: "Quantity must be a number." })
  .int("Quantity must be a whole number.")
  .positive("Quantity must be at least 1.")
  .max(1000, "Quantity is too large.");

/** Body for `POST /api/cart`. */
export const addToCartSchema = z.object({
  productId,
  quantity: quantity.default(1),
});

/** Body for `PATCH /api/cart/[id]`. */
export const updateCartItemSchema = z.object({
  quantity,
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
