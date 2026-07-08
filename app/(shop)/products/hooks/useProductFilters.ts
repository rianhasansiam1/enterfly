"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import type { ProductQueryParams } from "@/features/products/api";

const DEFAULT_LIMIT = 12;

/**
 * Encapsulates the URL ↔ product filter state contract.
 *
 * Every public filter value is read from `useSearchParams()` and every
 * setter builds a new `URLSearchParams` then calls `router.push()` so
 * the URL is always the source of truth.
 */
export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── Read current params ──────────────────────────────────────────

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const sort = searchParams.get("sort") ?? "latest";
  const inStock = searchParams.get("inStock") === "true";

  /** The params object ready to pass to `fetchProductsPage()`. */
  const queryParams: ProductQueryParams = useMemo(
    () => ({
      page,
      limit,
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
      ...(minPrice != null ? { minPrice } : {}),
      ...(maxPrice != null ? { maxPrice } : {}),
      ...(sort && sort !== "latest" ? { sort } : {}),
      ...(inStock ? { inStock: true } : {}),
    }),
    [page, limit, search, category, minPrice, maxPrice, sort, inStock],
  );

  // ── URL builder ──────────────────────────────────────────────────

  const pushParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(overrides)) {
        if (value == null || value === "" || value === "0" || value === "false") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }

      // Always reset to page 1 when filters change (unless page itself changed).
      if (!("page" in overrides)) {
        next.delete("page");
      }

      // Clean up default values to keep URL tidy.
      if (next.get("sort") === "latest") next.delete("sort");
      if (next.get("limit") === String(DEFAULT_LIMIT)) next.delete("limit");
      if (next.get("page") === "1") next.delete("page");

      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // ── Typed setters ────────────────────────────────────────────────

  const setPage = useCallback(
    (p: number) => pushParams({ page: p > 1 ? String(p) : undefined }),
    [pushParams],
  );

  const setSort = useCallback(
    (s: string) => pushParams({ sort: s }),
    [pushParams],
  );

  const setCategory = useCallback(
    (slug: string) =>
      pushParams({ category: slug || undefined }),
    [pushParams],
  );

  const setSearch = useCallback(
    (term: string) =>
      pushParams({ search: term.trim() || undefined }),
    [pushParams],
  );

  const setPriceRange = useCallback(
    (min: number | undefined, max: number | undefined) =>
      pushParams({
        minPrice: min != null && min > 0 ? String(min) : undefined,
        maxPrice: max != null ? String(max) : undefined,
      }),
    [pushParams],
  );

  const setInStock = useCallback(
    (value: boolean) =>
      pushParams({ inStock: value ? "true" : undefined }),
    [pushParams],
  );

  const resetFilters = useCallback(() => {
    // Preserve only the search from the navbar (if any).
    const next = new URLSearchParams();
    const navSearch = searchParams.get("search");
    if (navSearch) next.set("search", navSearch);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return {
    // Current values
    page,
    limit,
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    inStock,
    queryParams,

    // Setters
    setPage,
    setSort,
    setCategory,
    setSearch,
    setPriceRange,
    setInStock,
    resetFilters,
  } as const;
}
