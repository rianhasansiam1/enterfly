import "server-only";

import type { NextRequest } from "next/server";
import { type ZodType, z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError, ok, type ApiMeta } from "@/lib/api/response";
import { revalidateCacheTags } from "@/lib/cache/revalidation";
import { handleServiceError } from "@/lib/services/service-error";

/**
 * Shared wrappers for admin API routes.
 *
 * Why this exists
 * ---------------
 * Every admin route in `app/api/admin/**` repeats the same six steps:
 *   1. `requireAdmin()` → 401 / 403 short-circuit.
 *   2. (write methods) verify `Content-Type: application/json`.
 *   3. (write methods) `await request.json()` with a 400 fallback.
 *   4. (write methods) Zod `safeParse` with a 400 + `fieldErrors` body.
 *   5. Call a service and wrap the result in `ok` / `created`.
 *   6. `try/catch` → `handleServiceError(scope, error)` on the way out,
 *      occasionally with a Prisma `P2025` → 404 short-circuit before it.
 *
 * That boilerplate is mechanical, easy to drift on, and obscures the one
 * line of each route that actually does work (the service call). These
 * helpers move the boilerplate here and keep the route file focused on
 * "what service does this hit, with what tags to bust".
 *
 * Design goals
 * ------------
 *   - **Zero behavior change.** Status codes, error message strings,
 *     `fieldErrors` shape, response envelopes, and `handleServiceError`
 *     scope strings all match the hand-written routes exactly.
 *   - **Declarative cache busting.** `revalidate: ["tag-a", "tag-b"]`
 *     replaces hand-rolled `bustTags()` helpers. Tags are only flushed
 *     on a successful (non-throwing) handler run, matching today's
 *     behavior of placing `revalidateTag` inside the `try` block.
 *   - **Composable, not magic.** No reflection, no decorator metadata.
 *     Each helper is a plain function that returns a Next.js route
 *     handler — easy to read, easy to delete.
 *   - **Type-safe handler args.** The handler receives the validated
 *     body (when a schema is provided), the resolved params (when the
 *     caller declares them), the admin session, and the original
 *     request — all narrowed by inference.
 *
 * Cache profile note
 * ------------------
 * This project calls `revalidateTag(tag, "max")` everywhere. The shared
 * cache helper preserves that signature so route files only declare tags.
 */

type AdminSession = Extract<
  Awaited<ReturnType<typeof requireAdmin>>,
  { ok: true }
>["session"];

/** Resolved params object after `await context.params`. */
export type ResolvedParams = Record<string, string | string[]>;

/** Next.js 15 route context — `params` is a Promise. */
type RouteContext<P extends ResolvedParams = ResolvedParams> = {
  params: Promise<P>;
};

/** A Prisma-style "not found" mapping: when `error.code === code`, return 404. */
export type NotFoundMapping = {
  /** Prisma error code, almost always `"P2025"`. */
  code: string;
  /** User-facing 404 message, e.g. `"Promo banner not found."`. */
  message: string;
};

/** Args passed to the user handler for a write route (with body). */
export type AdminJsonHandlerArgs<TBody, TParams extends ResolvedParams> = {
  body: TBody;
  params: TParams;
  request: NextRequest;
  session: AdminSession;
};

/** Args passed to the user handler for a read/delete route (no body). */
export type AdminHandlerArgs<TParams extends ResolvedParams> = {
  params: TParams;
  request: NextRequest;
  session: AdminSession;
};

/** What a user handler may return — we wrap raw data in `ok` / `created`. */
export type AdminHandlerResult<TData> =
  | { status?: 200; data: TData; meta?: ApiMeta }
  | { status: 201; data: TData }
  | { raw: Response };

type AdminJsonRouteOptions<
  TSchema extends ZodType,
  TParams extends ResolvedParams,
  TData,
> = {
  /** Zod schema applied to the parsed JSON body. */
  schema: TSchema;
  /** Scope string passed to `handleServiceError` — keep identical to the
   *  original hand-written route for log continuity. */
  scope: string;
  /** Cache tags to `revalidateTag(..., "max")` on a successful run. */
  revalidate?: readonly string[];
  /** Map a thrown error code (e.g. Prisma `P2025`) to a 404 response. */
  notFoundOn?: NotFoundMapping;
  /** The actual business logic. Receives validated body + resolved params. */
  handler: (
    args: AdminJsonHandlerArgs<z.infer<TSchema>, TParams>,
  ) => Promise<AdminHandlerResult<TData>>;
};

type AdminRouteOptions<TParams extends ResolvedParams, TData> = {
  scope: string;
  /** Optional Zod schema applied to `request.nextUrl.searchParams`. */
  querySchema?: ZodType;
  revalidate?: readonly string[];
  notFoundOn?: NotFoundMapping;
  handler: (
    args: AdminHandlerArgs<TParams> & { query?: unknown },
  ) => Promise<AdminHandlerResult<TData>>;
};

/** Type guard for Prisma `KnownRequestError`-shaped objects without
 *  importing Prisma here (keeps this module dependency-light). */
function hasErrorCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === code
  );
}

function envelope<TData>(result: AdminHandlerResult<TData>): Response {
  if ("raw" in result) return result.raw;
  if (result.status === 201) return created(result.data);
  return ok(result.data, result.meta);
}

/**
 * Build a JSON-body admin route handler (POST / PATCH / PUT).
 *
 * Behavior matches the hand-written routes step-for-step:
 *   - 401/403 from `requireAdmin`
 *   - 415 if `Content-Type` isn't JSON
 *   - 400 `"Invalid JSON payload."` on `request.json()` failure
 *   - 400 `"Please review the highlighted fields and try again."` with
 *     `fieldErrors` from `z.flattenError` on schema failure
 *   - 404 + custom message if `notFoundOn` matches the thrown error
 *   - `handleServiceError(scope, error)` for everything else
 *   - `revalidateTag(tag, "max")` for each declared tag on success
 */
export function adminJsonRoute<
  TSchema extends ZodType,
  TData,
  TParams extends ResolvedParams = ResolvedParams,
>(options: AdminJsonRouteOptions<TSchema, TParams, TData>) {
  const { schema, scope, revalidate, notFoundOn, handler } = options;

  return async function routeHandler(
    request: NextRequest,
    context?: RouteContext<TParams>,
  ): Promise<Response> {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const params = (context ? await context.params : ({} as TParams));

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonError(415, "Content-Type must be application/json.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Invalid JSON payload.");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        400,
        "Please review the highlighted fields and try again.",
        { fieldErrors: z.flattenError(parsed.error).fieldErrors },
      );
    }

    try {
      const result = await handler({
        body: parsed.data,
        params,
        request,
        session: guard.session,
      });
      revalidateCacheTags(revalidate);
      return envelope(result);
    } catch (error) {
      if (notFoundOn && hasErrorCode(error, notFoundOn.code)) {
        return jsonError(404, notFoundOn.message);
      }
      return handleServiceError(scope, error);
    }
  };
}

/**
 * Build a no-body admin route handler (GET / DELETE).
 *
 * Same guarantees as `adminJsonRoute` minus the JSON body steps. When a
 * `querySchema` is supplied it parses `request.nextUrl.searchParams` and
 * passes the parsed object as `query` to the handler; failure returns the
 * same 400 + `fieldErrors` shape as the body-validation path so admin
 * UIs that already render those errors keep working.
 */
export function adminRoute<
  TData,
  TParams extends ResolvedParams = ResolvedParams,
>(options: AdminRouteOptions<TParams, TData>) {
  const { scope, querySchema, revalidate, notFoundOn, handler } = options;

  return async function routeHandler(
    request: NextRequest,
    context?: RouteContext<TParams>,
  ): Promise<Response> {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const params = (context ? await context.params : ({} as TParams));

    let query: unknown;
    if (querySchema) {
      const raw = Object.fromEntries(request.nextUrl.searchParams);
      const parsed = querySchema.safeParse(raw);
      if (!parsed.success) {
        return jsonError(400, "Invalid query parameters.", {
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        });
      }
      query = parsed.data;
    }

    try {
      const result = await handler({
        params,
        request,
        session: guard.session,
        query,
      });
      revalidateCacheTags(revalidate);
      return envelope(result);
    } catch (error) {
      if (notFoundOn && hasErrorCode(error, notFoundOn.code)) {
        return jsonError(404, notFoundOn.message);
      }
      return handleServiceError(scope, error);
    }
  };
}
