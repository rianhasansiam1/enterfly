import { requireUser } from "@/lib/auth-check";
import { ok } from "@/lib/api-response";
import { clearMyCart } from "@/lib/services/cart.service";
import { handleCartError } from "@/lib/services/cart-errors";

/**
 * DELETE /api/cart/clear
 *
 * Logged-in users only. Empties the caller's cart. Idempotent — a
 * second call simply returns `{ deletedCount: 0 }`.
 */
export async function DELETE() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  try {
    const result = await clearMyCart(guard.session.user.id);
    return ok(result);
  } catch (error) {
    return handleCartError("cart.clear.DELETE", error);
  }
}
