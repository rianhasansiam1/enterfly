import type { NextConfig } from "next";

/* ------------------------------------------------------------------ */
/*  1. NO-INDEX PATHS                                                  */
/* ------------------------------------------------------------------ */
/**
 * Private/transactional/admin route prefixes that must never be indexed.
 * Mirrors the robots.txt disallow list. We add an `X-Robots-Tag` HTTP
 * header here as defense-in-depth: the admin section's layout is a client
 * component (so it can't emit a `noindex` <meta> tag), and headers also
 * protect non-HTML responses (API JSON, downloads). The customer-facing
 * private pages additionally emit `noindex` via their server layouts.
 */
const NO_INDEX_PATHS = [
  "/admin/:path*",
  "/cart/:path*",
  "/checkout/:path*",
  "/orders/:path*",
  "/profile/:path*",
  "/wishlist/:path*",
  "/login",
  "/register",
  "/api/:path*",
];

/* ------------------------------------------------------------------ */
/*  2. CONTENT SECURITY POLICY                                         */
/* ------------------------------------------------------------------ */
/**
 * Build a Content-Security-Policy header value.
 *
 * Key decisions:
 * - `'unsafe-inline'` for style-src: required by React inline `style={}` props
 *   and framer-motion which inject styles at runtime. Tailwind also injects
 *   a `<style>` tag. Cannot use nonces without a per-request middleware.
 * - `'unsafe-inline'` for script-src: Next.js injects inline `<script>` tags
 *   for hydration data and chunk loading. A strict nonce-based CSP requires
 *   `experimental.nextScriptWorkers` or custom middleware — we keep
 *   `'unsafe-inline'` for compatibility and add `'self'` to restrict origins.
 *   Local development also gets `'unsafe-eval'` for React/Next debugging.
 * - `connect-src` includes `api.emailjs.com` for the browser-side EmailJS SDK
 *   and `accounts.google.com` for Google OAuth token exchange.
 * - `img-src` whitelists all remote image hosts from `images.remotePatterns`.
 * - `frame-ancestors 'none'` replaces X-Frame-Options: DENY (CSP is preferred,
 *   but we keep X-Frame-Options too for older browsers).
 *
 * ⚠️  PRODUCTION NOTES — adjust these if you add new services:
 *   - New image CDN?        → add to `img-src`
 *   - New external script?   → add to `script-src`
 *   - New API / fetch call?  → add to `connect-src`
 *   - Embedding in iframe?   → relax `frame-ancestors`
 */
const scriptSrcDirective =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const cspDirectives = [
  /* Fallback for any directive not explicitly listed. */
  "default-src 'self'",

  /* Scripts: self + inline (Next.js hydration). */
  scriptSrcDirective,

  /* Styles: self + inline (React style props, framer-motion, Tailwind). */
  "style-src 'self' 'unsafe-inline'",

  /* Images: self + data URIs (Next.js blur placeholders) + known CDNs. */
  "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://i.ibb.co https://picsum.photos https://i.pravatar.cc https://api.dicebear.com",

  /* Fonts: self only — next/font/google downloads at build time. */
  "font-src 'self'",

  /* Fetch / XHR / WebSocket destinations. */
  "connect-src 'self' https://api.emailjs.com https://accounts.google.com",

  /* Disallow embedding this site in any frame (clickjacking protection). */
  "frame-ancestors 'none'",

  /* Allow inline workers spawned by Next.js or jspdf. */
  "worker-src 'self' blob:",

  /* Disallow <object>, <embed>, <applet>. */
  "object-src 'none'",

  /* Restrict <base> to same origin. */
  "base-uri 'self'",

  /* Restrict form targets to same origin. */
  "form-action 'self'",

  /* Frames we embed (none expected, but locked down). */
  "frame-src 'self' https://accounts.google.com",
];

const ContentSecurityPolicy = cspDirectives.join("; ");

/* ------------------------------------------------------------------ */
/*  3. SECURITY HEADERS                                                */
/* ------------------------------------------------------------------ */
/**
 * Production-grade security headers applied to every response.
 *
 * | Header                        | Purpose                                              |
 * |-------------------------------|------------------------------------------------------|
 * | Content-Security-Policy       | Restricts resource origins — XSS / data-injection    |
 * | X-Content-Type-Options        | Prevents MIME-type sniffing                           |
 * | Referrer-Policy               | Controls how much URL is sent in Referer header       |
 * | X-Frame-Options               | Legacy clickjacking guard (CSP frame-ancestors wins)  |
 * | Permissions-Policy            | Disables powerful browser APIs we don't need           |
 * | Strict-Transport-Security     | Forces HTTPS for 1 year (HTTPS production only)       |
 * | X-DNS-Prefetch-Control        | Lets browser prefetch DNS for external links           |
 */
type SecurityHeader = { key: string; value: string };

const LOCAL_HSTS_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const HSTS_HEADER: SecurityHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload",
};

const baseSecurityHeaders: SecurityHeader[] = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

function isTruthyFlag(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

function isFalseyFlag(value: string | undefined): boolean {
  return value?.toLowerCase() === "false";
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function isLocalHstsHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return (
    LOCAL_HSTS_HOSTNAMES.has(normalized) ||
    normalized.endsWith(".localhost") ||
    normalized.startsWith("127.")
  );
}

function hasHttpsNonLocalSiteUrl(siteUrl: string | undefined): boolean {
  if (!siteUrl) return false;

  try {
    const parsed = new URL(siteUrl);
    return (
      parsed.protocol === "https:" &&
      !isLocalHstsHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * HSTS is gated separately from NODE_ENV because `next start` also runs with
 * NODE_ENV=production on local HTTP. Once a browser receives HSTS for a host,
 * it can force future HTTPS upgrades for that host, so we only emit it when
 * the configured public origin proves this is a real HTTPS production host.
 *
 * ENABLE_HSTS=true is required as an explicit production opt-in, and it still
 * does not bypass the HTTPS/non-local origin check. Leaving it unset or false
 * keeps local `next start`, preview, and staging HTTP responses HSTS-free.
 */
function shouldEnableHsts(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.NODE_ENV !== "production") return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") return false;
  if (isFalseyFlag(env.ENABLE_HSTS)) return false;
  if (!isTruthyFlag(env.ENABLE_HSTS)) return false;

  return hasHttpsNonLocalSiteUrl(env.NEXT_PUBLIC_SITE_URL);
}

function buildSecurityHeaders(
  env: Record<string, string | undefined> = process.env,
): SecurityHeader[] {
  const headers = [...baseSecurityHeaders];
  if (shouldEnableHsts(env)) headers.push(HSTS_HEADER);
  return headers;
}

/* ------------------------------------------------------------------ */
/*  4. NEXT.JS CONFIG                                                  */
/* ------------------------------------------------------------------ */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  async headers() {
    return [
      /* ── Global security headers on every route ── */
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(),
      },
      /* ── X-Robots-Tag for private / API routes ── */
      ...NO_INDEX_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
