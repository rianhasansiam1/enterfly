"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import ProductsGrid from "./components/ProductsGrid";
import ProductToolbar from "./components/ProductToolbar";
import { useProductFilters } from "./hooks/useProductFilters";
import {
  fetchProductsPage,
  fetchCategories,
} from "@/features/products/api";
import type {
  ApiMeta,
  CategoryOption,
  Product,
  ProductQueryParams,
} from "@/features/products/api";
import {
  LoadingSpinner,
  ProductGridSkeleton,
  ProductListingPageLoader,
} from "@/components/ui/loading";

type ViewMode = "grid" | "list";

const DEFAULT_META: ApiMeta = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function AllProductsPage() {
  return (
    <Suspense fallback={<ProductListingPageLoader />}>
      <AllProductsPageInner />
    </Suspense>
  );
}

function AllProductsPageInner() {
  const filters = useProductFilters();

  // ── Local UI state (not in URL) ──────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Server data ──────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ApiMeta>(DEFAULT_META);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppending, setIsAppending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appendError, setAppendError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const latestQueryKeyRef = useRef("");
  const appendControllerRef = useRef<AbortController | null>(null);

  // ── Category options for sidebar ─────────────────────────────────
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Fetch categories once on mount.
  useEffect(() => {
    const controller = new AbortController();
    void fetchCategories({ signal: controller.signal }).then(setCategories);
    return () => controller.abort();
  }, []);

  // ── Fetch products when URL params change ────────────────────────

  const baseQueryParams = useMemo(
    () => ({ ...filters.queryParams, page: 1 }),
    [filters.queryParams],
  );

  // Serialise queryParams to a stable string so the effect only re-runs
  // when the actual filter values change (not on every render).
  const queryKey = JSON.stringify(baseQueryParams);

  useEffect(() => {
    latestQueryKeyRef.current = queryKey;
  }, [queryKey]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      appendControllerRef.current?.abort();
      appendControllerRef.current = null;
      setIsAppending(false);
      setIsLoading(true);
      setError(null);
      setAppendError(null);
      try {
        const result = await fetchProductsPage(
          JSON.parse(queryKey) as ProductQueryParams,
          { signal: controller.signal },
        );
        if (!cancelled) {
          setProducts(result.items);
          setMeta(result.meta);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load products.";
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [queryKey]);

  const loadNextPage = useCallback(async () => {
    if (
      isLoading ||
      isAppending ||
      appendControllerRef.current ||
      !meta.hasNextPage
    ) {
      return;
    }

    const nextPage = meta.page + 1;
    const requestQueryKey = queryKey;
    const controller = new AbortController();

    appendControllerRef.current = controller;
    setIsAppending(true);
    setAppendError(null);

    try {
      const result = await fetchProductsPage(
        {
          ...(JSON.parse(requestQueryKey) as ProductQueryParams),
          page: nextPage,
        },
        { signal: controller.signal },
      );

      if (
        controller.signal.aborted ||
        latestQueryKeyRef.current !== requestQueryKey
      ) {
        return;
      }

      setProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        const nextItems = result.items.filter((product) => !seen.has(product.id));
        return [...current, ...nextItems];
      });
      setMeta(result.meta);
    } catch (err) {
      if (
        controller.signal.aborted ||
        latestQueryKeyRef.current !== requestQueryKey
      ) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Failed to load more products.";
      setAppendError(message);
    } finally {
      if (appendControllerRef.current === controller) {
        appendControllerRef.current = null;
      }
      if (
        !controller.signal.aborted &&
        latestQueryKeyRef.current === requestQueryKey
      ) {
        setIsAppending(false);
      }
    }
  }, [isAppending, isLoading, meta.hasNextPage, meta.page, queryKey]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !meta.hasNextPage || isLoading || appendError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: "520px 0px", threshold: 0.01 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [appendError, isLoading, loadNextPage, meta.hasNextPage]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleCategoryChange = useCallback(
    (slug: string) => {
      // Toggle: if already selected, deselect.
      filters.setCategory(filters.category === slug ? "" : slug);
    },
    [filters],
  );

  const handlePriceChange = useCallback(
    (max: number) => {
      filters.setPriceRange(undefined, max);
    },
    [filters],
  );

  const handleInStockChange = useCallback(() => {
    filters.setInStock(!filters.inStock);
  }, [filters]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex gap-5">
          {/* ── Desktop sidebar ──────────────────────────────── */}
          <div
            className={`hidden shrink-0 overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out lg:block ${
              sidebarOpen ? "w-64 opacity-100" : "-ml-5 w-0 opacity-0"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <div className="w-64">
              <FilterSidebar
                categories={categories}
                selectedCategory={filters.category}
                onCategoryChange={handleCategoryChange}
                maxPrice={filters.maxPrice}
                onMaxPriceChange={handlePriceChange}
                inStockOnly={filters.inStock}
                onInStockChange={handleInStockChange}
                onReset={filters.resetFilters}
              />
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────── */}
          <main className="min-w-0 flex-1" aria-busy={isLoading || undefined}>
            <ProductToolbar
              resultsCount={meta.total}
              sort={filters.sort}
              onSortChange={filters.setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />

            {isLoading && products.length === 0 ? (
              <ProductGridSkeleton
                count={12}
                wide={!sidebarOpen}
                className="mt-6"
              />
            ) : error && products.length === 0 ? (
              <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <>
                {/* Subtle loading overlay when changing pages/filters */}
                <div
                  className={`transition-opacity duration-200 ${
                    isLoading ? "pointer-events-none opacity-60" : "opacity-100"
                  }`}
                >
                  <ProductsGrid
                    products={products}
                    viewMode={viewMode}
                    onClearFilters={filters.resetFilters}
                    wide={!sidebarOpen}
                  />
                </div>

                <div
                  ref={loadMoreRef}
                  className="mt-8 flex min-h-16 items-center justify-center text-sm"
                  aria-live="polite"
                >
                  {isAppending ? (
                    <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 font-medium text-violet-700 shadow-sm">
                      <LoadingSpinner size="xs" label="Loading more products" />
                      <span>Loading more products...</span>
                    </div>
                  ) : appendError ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-red-700 sm:flex-row sm:text-left">
                      <span>{appendError}</span>
                      <button
                        type="button"
                        onClick={() => {
                          void loadNextPage();
                        }}
                        className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        Try again
                      </button>
                    </div>
                  ) : meta.hasNextPage ? (
                    <span className="text-gray-500">
                      Keep scrolling to load more products
                    </span>
                  ) : products.length > 0 ? (
                    <span className="text-gray-400">
                      You have reached the end
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────── */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={categories}
        selectedCategory={filters.category}
        onCategoryChange={handleCategoryChange}
        maxPrice={filters.maxPrice}
        onMaxPriceChange={handlePriceChange}
        inStockOnly={filters.inStock}
        onInStockChange={handleInStockChange}
        onReset={filters.resetFilters}
      />
    </div>
  );
}
