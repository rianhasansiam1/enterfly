import "server-only";

import { revalidateTag } from "next/cache";

export const CACHE_PROFILE = "max" as const;

/**
 * Tags that cover every cached public product surface.
 *
 * Bust these after any mutation that changes product data visible to
 * public clients (create, update, delete, stock changes from checkout/
 * order cancellation, category edits that cascade to product listings).
 */
export const PRODUCT_CACHE_TAGS = ["products", "product-detail"] as const;

/** Tags that cover every cached category storefront/admin listing surface. */
export const CATEGORY_CACHE_TAGS = ["categories", "home-categories"] as const;

/** Tags for the cached admin dashboard overview payload. */
export const ADMIN_DASHBOARD_TAGS = ["admin-dashboard"] as const;

/** Tags for cached admin report payloads. */
export const ADMIN_REPORT_TAGS = ["admin-reports"] as const;

/**
 * Category mutations can affect category lists, homepage category sections,
 * product listings/detail breadcrumbs, and admin category report aggregates.
 */
export const CATEGORY_MUTATION_CACHE_TAGS = [
  ...CATEGORY_CACHE_TAGS,
  ...PRODUCT_CACHE_TAGS,
  ...ADMIN_DASHBOARD_TAGS,
  ...ADMIN_REPORT_TAGS,
] as const;

export function revalidateCacheTags(tags: readonly string[] | undefined) {
  if (!tags?.length) return;
  for (const tag of tags) revalidateTag(tag, CACHE_PROFILE);
}
