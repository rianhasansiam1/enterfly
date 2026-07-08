"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import Pagination from "./components/Pagination";
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
} from "@/features/products/api";

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
    <Suspense fallback={null}>
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
  const [error, setError] = useState<string | null>(null);

  // ── Category options for sidebar ─────────────────────────────────
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Fetch categories once on mount.
  useEffect(() => {
    const controller = new AbortController();
    void fetchCategories({ signal: controller.signal }).then(setCategories);
    return () => controller.abort();
  }, []);

  // ── Fetch products when URL params change ────────────────────────

  // Serialise queryParams to a stable string so the effect only re-runs
  // when the actual param values change (not on every render).
  const queryKey = JSON.stringify(filters.queryParams);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchProductsPage(
          JSON.parse(queryKey) as Record<string, unknown>,
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
          <main className="min-w-0 flex-1">
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
              <div className="mt-10 flex items-center justify-center gap-2 text-sm text-violet-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading products from server...</span>
              </div>
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

                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  hasNextPage={meta.hasNextPage}
                  hasPreviousPage={meta.hasPreviousPage}
                  onPageChange={filters.setPage}
                />
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
