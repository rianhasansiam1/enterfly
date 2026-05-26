import { revalidateTag } from "next/cache";

import { requireUser } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import { clearMyCart } from "@/lib/services/cart.service";
import { handleCartError } from "@/lib/services/cart-errors";

function hasCartDbAccess(role: string | undefined): boolean {
  return role === "USER" || role === "ADMIN";
}

/**
 * DELETE /api/cart/clear
 *
 * Logged-in users only. Empties the caller's cart. Idempotent — a
 * second call simply returns `{ deletedCount: 0 }`.
 */
export async function DELETE() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  if (!hasCartDbAccess(guard.session.user.role)) {
    return jsonError(403, "Cart API is only available for USER/ADMIN.");
  }

  try {
    const result = await clearMyCart(guard.session.user.id);
    revalidateTag("cart", "max");
    return ok(result);
  } catch (error) {
    return handleCartError("cart.clear.DELETE", error);
  }
}
