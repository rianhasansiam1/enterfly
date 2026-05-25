import "server-only";

import { jsonError } from "@/lib/api-response";
import { CartError } from "@/lib/services/cart.service";

/**
 * Map any thrown error from the cart service to a JSON Response.
 *
 *  - `CartError`s carry their own status + message.
 *  - Anything else is logged and surfaced as a generic 500 so we never
 *    leak stack traces or DB errors to clients.
 */
export function handleCartError(scope: string, error: unknown) {
  if (error instanceof CartError) {
    return jsonError(
      error.status,
      error.message,
      error.details ? { details: error.details } : undefined,
    );
  }

  console.error(`[${scope}] failed`, error);
  return jsonError(500, "Something went wrong. Please try again.");
}
