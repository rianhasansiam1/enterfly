import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "./site";

/**
 * Reusable Metadata builders for the EnterFly storefront.
 *
 * These keep page/route files thin and ensure every public page emits a
 * consistent, production-ready set of title/description/canonical/Open
 * Graph/Twitter tags. `metadataBase` is set once in the root layout, so
 * relative image/canonical paths resolve to absolute URLs automatically.
 */

/** Truncate free-form text to a search-friendly length on a word boundary. */
function clampDescription(input: string | null | undefined, max = 160): string {
  const text = (input ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text || siteConfig.description;
  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

type OgImageInput = string | null | undefined;

/** Resolve an OG image, falling back to the brand default when missing. */
function resolveOgImages(image: OgImageInput, alt: string) {
  const url = image && image.trim().length > 0 ? image : siteConfig.ogImage;
  return [{ url, alt }];
}

export type PageMetadataInput = {
  title: string;
  description?: string | null;
  /** Site-relative path (e.g. "/products"); used for the canonical URL. */
  path?: string;
  /** Absolute or relative image URL for Open Graph / Twitter. */
  image?: OgImageInput;
  keywords?: string[];
  /** Open Graph type — "website" for listings, "article" where relevant. */
  ogType?: "website" | "article";
  /** Set false for pages that must not be indexed. */
  index?: boolean;
};

/**
 * Build a complete `Metadata` object for a public page.
 *
 * Pass a site-relative `path` to get a canonical URL plus matching
 * Open Graph `url`. Images fall back to the brand default so a social
 * card always renders.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  keywords,
  ogType = "website",
  index = true,
}: PageMetadataInput): Metadata {
  const desc = clampDescription(description);
  const canonical = absoluteUrl(path);
  const images = resolveOgImages(image, title);

  return {
    title,
    description: desc,
    keywords: keywords && keywords.length > 0 ? keywords : [...siteConfig.keywords],
    alternates: { canonical },
    openGraph: {
      type: ogType,
      url: canonical,
      siteName: siteConfig.name,
      title,
      description: desc,
      locale: siteConfig.locale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: images.map((img) => img.url),
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
  };
}

/** Metadata for private/utility pages that must never be indexed. */
export function noIndexMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? siteConfig.description,
    robots: { index: false, follow: false },
  };
}
