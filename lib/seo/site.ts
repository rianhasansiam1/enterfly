/**
 * Central SEO/site configuration for EnterFly.
 *
 * Everything that the metadata helpers, JSON-LD builders, robots, and
 * sitemap need lives here so there is a single source of truth. The
 * production origin comes from `NEXT_PUBLIC_SITE_URL` with a safe local
 * fallback — never hardcode localhost into shipped metadata.
 */

import { getCanonicalSiteOrigin } from "@/lib/config/origin";

const siteUrl = getCanonicalSiteOrigin();

// Strip a trailing slash so URL composition (`${url}${path}`) never
// produces a double slash.
const normalizedUrl = siteUrl.replace(/\/+$/, "");

export const siteConfig = {
  /** Brand / website name. */
  name: "EnterFly",
  /** Short name for PWA-style metadata (application name). */
  shortName: "EnterFly",
  /** Absolute production origin, e.g. https://enterfly.com (no trailing slash). */
  url: normalizedUrl,
  /** Default, e-commerce-focused site description. */
  description:
    "EnterFly is your trusted online shopping destination. Discover quality electronics, fashion, and home essentials with secure checkout, fast delivery, and great prices in BDT.",
  /** Default keyword set used as a baseline across the storefront. */
  keywords: [
    "EnterFly",
    "online shopping",
    "ecommerce",
    "buy online",
    "electronics",
    "fashion",
    "home essentials",
    "online store",
    "deals",
    "BDT shopping",
  ],
  /** Open Graph locale. */
  locale: "en_US",
  /** Store currency (ISO 4217) — used in Product offers JSON-LD. */
  currency: "BDT",
  author: "EnterFly",
  creator: "EnterFly",
  publisher: "EnterFly",
  /**
   * Default / fallback Open Graph image (absolute URL). Used on the home
   * page and any page whose own image is missing. The brand logo is the
   * only real image asset available, so it doubles as the social card.
   */
  ogImage: `${normalizedUrl}/logo/logo.png`,
  /** Brand logo (absolute URL) — used in Organization JSON-LD. */
  logo: `${normalizedUrl}/logo/logo.png`,
  /**
   * Real, verified social profiles only (kept truthful for `sameAs`).
   * Add more here as they are confirmed.
   */
  social: {
    facebook: "https://www.facebook.com/enterfly26",
  },
} as const;

/** Public profile URLs for Organization `sameAs`. */
export const socialProfiles: string[] = Object.values(
  siteConfig.social as Record<string, string>,
).filter((href) => typeof href === "string" && href.startsWith("http"));

/**
 * Build an absolute URL from a site-relative path.
 *
 * Accepts "/", "/products", "products/123", etc. and always returns a
 * fully-qualified URL rooted at `siteConfig.url`.
 */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${suffix === "/" ? "" : suffix}` || siteConfig.url;
}

export type SiteConfig = typeof siteConfig;
