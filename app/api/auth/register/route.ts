import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { isAllowedOrigin } from "@/lib/auth/origin";
import { hashPassword } from "@/lib/auth/passwords";
import { getClientIp, rateLimit } from "@/lib/auth/rate-limit";
import { jsonError, tooManyRequests } from "@/lib/auth/responses";
import { registerSchema } from "@/lib/auth/schemas";
import { prisma } from "@/lib/prisma";

/**
 * Registration rate limit. Per-IP only — keying on email here would let
 * an attacker scan emails by varying the email to bypass the bucket.
 * 8 signups / 10 min is plenty for a real shopper.
 */
const REGISTER_MAX_ATTEMPTS = 8;
const REGISTER_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {


  // Defense in depth: reject obvious cross-site POSTs early.
  if (!isAllowedOrigin(request)) {
    return jsonError(403, "Request blocked.");
  }

  // Defensive content-type check. Same-origin browsers send JSON, but
  // anything else gets turned away before we touch the body.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, "Content-Type must be application/json.");
  }

  const ip = getClientIp(request);
  const limit = rateLimit(
    `register:${ip}`,
    REGISTER_MAX_ATTEMPTS,
    REGISTER_WINDOW_MS,
  );
  if (!limit.allowed) return tooManyRequests(limit.resetMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON payload.");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const { name, email, password, phone, city } = parsed.data;
  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        // Stamped server-side. Zod already required `agreeToTerms === true`.
        termsAcceptedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    // P2002 = unique constraint violation. Race-safe duplicate handling.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(
        409,
        "An account with this email already exists. Try signing in.",
      );
    }

    console.error("[register] unexpected error", error);
    return jsonError(500, "We couldn't create your account. Please try again.");
  }
}
