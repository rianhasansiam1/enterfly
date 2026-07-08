import "server-only";

import { NextResponse } from "next/server";

/**
 * Uniform JSON envelopes used by every route in `app/api`.
 *
 * Why a single envelope?
 *   - The client never has to branch on response shape.
 *   - Pagination meta (page, total) lives in a predictable place.
 *   - Adding fields later (e.g. `requestId`) is a one-line change here.
 */

export type ApiMeta = {
  page?: number;
  /** Preferred name for items-per-page (replaces `pageSize`). */
  limit?: number;
  /** @deprecated Use `limit`. Kept for backward compat. */
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  [key: string]: unknown;
};

/** 200 OK with `{ success: true, data, meta? }`. */
export function ok<T>(data: T, meta?: ApiMeta) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status: 200 },
  );
}

/** 201 Created with `{ success: true, data }`. */
export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

/** Plain JSON error response with a stable shape. */
export function jsonError(
  status: number,
  error: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** 429 with a Retry-After header so well-behaved clients can back off. */
export function tooManyRequests(resetMs: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.max(1, Math.ceil(resetMs / 1000)).toString(),
      },
    },
  );
}
