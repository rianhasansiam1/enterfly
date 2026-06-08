import "server-only";

import type { Session } from "next-auth";

import { auth } from "@/lib/auth/auth";
import { jsonError } from "@/lib/api/response";

/**
 * Centralized auth gates for protected routes.
 *
 * Returning a discriminated union (instead of throwing) keeps the route
 * handler in normal control flow: caller checks `result.ok` and either
 * returns `result.response` or proceeds with `result.session`.
 *
 *   const guard = await requireAdmin();
 *   if (!guard.ok) return guard.response;
 *   // ...do admin work, guard.session.user.id is available
 */
export type AuthGuard =
  | { ok: true; session: Session }
  | { ok: false; response: Response };

/** @deprecated alias retained for older imports. Prefer `AuthGuard`. */
export type AdminGuard = AuthGuard;

export async function requireAdmin(): Promise<AuthGuard> {
  // NextAuth's `auth()` is overloaded; the no-arg form returns the session.
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    return { ok: false, response: jsonError(401, "Authentication required.") };
  }

  if (session.user.role !== "ADMIN") {
    return { ok: false, response: jsonError(403, "Admin access only.") };
  }

  return { ok: true, session };
}

/**
 * Soft admin check for public routes that should reveal admin-only fields
 * (e.g. `buyingPrice`) when an admin is signed in, without rejecting
 * anonymous/regular callers. Returns a plain boolean.
 */
export async function isAdminRequest(): Promise<boolean> {
  const session = (await auth()) as Session | null;
  return session?.user?.role === "ADMIN";
}

/** Logged-in users only — no role check. */
export async function requireUser(): Promise<AuthGuard> {
  const session = (await auth()) as Session | null;

  if (!session?.user?.id) {
    return { ok: false, response: jsonError(401, "Authentication required.") };
  }

  return { ok: true, session };
}
