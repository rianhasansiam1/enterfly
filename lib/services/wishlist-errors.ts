import "server-only";

import { jsonError } from "@/lib/api-response";
import { WishlistError } from "@/lib/services/wishlist.service";

export function handleWishlistError(scope: string, error: unknown) {
  if (error instanceof WishlistError) {
    return jsonError(
      error.status,
      error.message,
      error.details ? { details: error.details } : undefined,
    );
  }

  console.error(`[${scope}] failed`, error);
  return jsonError(500, "Something went wrong. Please try again.");
}

