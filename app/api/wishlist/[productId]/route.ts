import { requireUser } from "@/lib/auth-check";
import { jsonError, ok } from "@/lib/api-response";
import { handleWishlistError } from "@/lib/services/wishlist-errors";
import { removeWishlistItemByProduct } from "@/lib/services/wishlist.service";

type RouteContext = { params: Promise<{ productId: string }> };

function hasWishlistDbAccess(role: string | undefined): boolean {
  return role === "USER" || role === "ADMIN";
}

/**
 * DELETE /api/wishlist/[productId]
 *
 * Logged-in USER/ADMIN only. Removes a product from caller's wishlist.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  if (!hasWishlistDbAccess(guard.session.user.role)) {
    return jsonError(403, "Wishlist API is only available for USER/ADMIN.");
  }

  const { productId } = await context.params;

  try {
    const result = await removeWishlistItemByProduct(guard.session.user.id, productId);
    return ok(result);
  } catch (error) {
    return handleWishlistError("wishlist/[productId].DELETE", error);
  }
}

