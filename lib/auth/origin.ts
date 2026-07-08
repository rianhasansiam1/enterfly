import "server-only";

import {
  getAllowedOrigins,
  normalizeOrigin,
  validateOriginConfig,
} from "@/lib/config/origin";

/**
 * Lightweight CSRF defense for custom auth POST endpoints.
 *
 * Auth.js handles CSRF on its own routes; for our hand-rolled endpoints
 * (e.g. /api/auth/register), we reject requests whose Origin doesn't
 * match the current local request origin or configured production
 * origin. Browsers always set Origin on cross-site POSTs, so this
 * blocks the typical CSRF shape.
 */
export function isAllowedOrigin(request: Request): boolean {
  const rawOrigin = request.headers.get("origin");

  // No Origin header = same-origin browser navigation or non-browser
  // client (curl, server-to-server). Allow; the rest of the stack still
  // validates the payload.
  if (!rawOrigin) return true;

  const origin = normalizeOrigin(rawOrigin);
  if (!origin) return false;

  const validation = validateOriginConfig();
  if (!validation.ok) {
    console.error("[origin] invalid production origin config", {
      errors: validation.errors,
    });
    return false;
  }

  return getAllowedOrigins(request.headers, process.env, request.url).includes(
    origin,
  );
}
