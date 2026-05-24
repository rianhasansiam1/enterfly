import "server-only";

/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Good enough for a single-instance deployment and local dev. For a real
 * production rollout, swap this with a shared store (Upstash Redis,
 * Vercel KV, etc.) so limits are enforced across all server instances.
 */

type Bucket = { count: number; resetAt: number };

// Persist across hot reloads in dev so abusive clients can't reset by
// triggering a recompile.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>;
};

const buckets =
  globalForRateLimit.__rateLimitBuckets ?? new Map<string, Bucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.__rateLimitBuckets = buckets;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the bucket resets. */
  resetMs: number;
};

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetMs: windowMs };
  }

  bucket.count += 1;

  if (bucket.count > max) {
    return { allowed: false, remaining: 0, resetMs: bucket.resetAt - now };
  }

  return {
    allowed: true,
    remaining: max - bucket.count,
    resetMs: bucket.resetAt - now,
  };
}

/**
 * Pulls the best-effort client IP from common proxy headers. Falls back
 * to "unknown" so rate-limit keys still group abusive traffic somewhere.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
