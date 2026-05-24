import "server-only";

import { NextResponse } from "next/server";

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
