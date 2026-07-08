import "server-only";

import { Redis } from "@upstash/redis";

/**
 * Fixed-window rate limiter.
 *
 * Production uses Upstash Redis so limits are shared across server instances.
 * Local development and tests may fall back to memory when Redis credentials
 * are not configured.
 */

type Bucket = { count: number; resetAt: number };

type RedisRateLimitScript = {
  exec(keys: string[], args: string[]): Promise<[number, number]>;
};

const REDIS_ENV_ERROR =
  "[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.";

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("PTTL", KEYS[1])

if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end

return { current, ttl }
`.trim();

// Persist across hot reloads in dev so abusive clients can't reset by
// triggering a recompile.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, Bucket>;
  __rateLimitRedis?: Redis;
  __rateLimitScript?: RedisRateLimitScript;
  __rateLimitWarnedAboutMemoryFallback?: boolean;
};

const buckets =
  globalForRateLimit.__rateLimitBuckets ?? new Map<string, Bucket>();

let redisClient = globalForRateLimit.__rateLimitRedis ?? null;
let redisRateLimitScript = globalForRateLimit.__rateLimitScript ?? null;
let warnedAboutMemoryFallback =
  globalForRateLimit.__rateLimitWarnedAboutMemoryFallback ?? false;

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.__rateLimitBuckets = buckets;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the bucket resets. */
  resetMs: number;
};

function warnAboutMemoryFallback() {
  if (warnedAboutMemoryFallback || process.env.NODE_ENV !== "development") {
    return;
  }

  warnedAboutMemoryFallback = true;
  globalForRateLimit.__rateLimitWarnedAboutMemoryFallback = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing; using in-memory rate limits for local development only.",
  );
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(REDIS_ENV_ERROR);
    }

    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      throw new Error(REDIS_ENV_ERROR);
    }

    warnAboutMemoryFallback();
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });

    if (process.env.NODE_ENV !== "production") {
      globalForRateLimit.__rateLimitRedis = redisClient;
    }
  }

  return redisClient;
}

function getRedisRateLimitScript(redis: Redis): RedisRateLimitScript {
  if (!redisRateLimitScript) {
    redisRateLimitScript =
      redis.createScript<[number, number]>(RATE_LIMIT_SCRIPT);

    if (process.env.NODE_ENV !== "production") {
      globalForRateLimit.__rateLimitScript = redisRateLimitScript;
    }
  }

  return redisRateLimitScript;
}

function memoryRateLimit(
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

async function redisRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return memoryRateLimit(key, max, windowMs);
  }

  const [count, ttl] = await getRedisRateLimitScript(redis).exec(
    [key],
    [String(windowMs)],
  );

  const resetMs = Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs;

  return {
    allowed: count <= max,
    remaining: Math.max(max - count, 0),
    resetMs,
  };
}

export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return redisRateLimit(key, max, windowMs);
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
