import "server-only";

import { jsonError } from "@/lib/api-response";
import { OrderError } from "@/lib/services/order.service";

/**
 * Map any thrown error to a JSON Response.
 *
 *  - `OrderError`s carry their own status + message.
 *  - Anything else is logged and surfaced as a generic 500 so we never
 *    leak stack traces or DB errors to clients.
 */
export function handleOrderError(scope: string, error: unknown) {
  if (error instanceof OrderError) {
    return jsonError(
      error.status,
      error.message,
      error.details ? { details: error.details } : undefined,
    );
  }

  console.error(`[${scope}] failed`, error);
  return jsonError(500, "Something went wrong. Please try again.");
}
