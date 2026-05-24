"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import ProductsGrid from "./components/ProductsGrid";
import ProductToolbar from "./components/ProductToolbar";
import { allProductsData, PRICE_BOUNDS } from "./components/data";
import type { Filters, Product, SortOption, ViewMode } from "./components/data";

const DEFAULT_FILTERS: Filters = {
  categories: [],
  brands: [],
  priceRange: PRICE_BOUNDS,
  minRating: 0,
  inStockOnly: false,
};
const PAGE_SIZE = 12;




export default function AllProductsPage() {





  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Infinite-scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Index from which the latest batch starts; used to fade in only new items.
  const [animateFrom, setAnimateFrom] = useState(0);









  const sentinelRef = useRef(null);

const getFinalPrice = (product:any) =>
  product.discountPrice ?? product.price;

const filtered = useMemo(() => {
  const list = allProductsData.filter((product) => {
    const finalPrice = getFinalPrice(product);

    const matchCategory =
      filters.categories.length === 0 ||
      filters.categories.includes(product.category);

    const matchBrand =
      filters.brands.length === 0 ||
      (product.brand && filters.brands.includes(product.brand));

    const matchPrice =
      finalPrice >= filters.priceRange[0] &&
      finalPrice <= filters.priceRange[1];

    const matchRating =
      filters.minRating === 0 || product.rating >= filters.minRating;

    const matchStock =
      !filters.inStockOnly || product.inStock;

    return (
      matchCategory &&
      matchBrand &&
      matchPrice &&
      matchRating &&
      matchStock
    );
  });

  return [...list].sort((a, b) => {
    const aPrice = getFinalPrice(a);
    const bPrice = getFinalPrice(b);

    switch (sort) {
      case "price-low":
        return aPrice - bPrice;

      case "price-high":
        return bPrice - aPrice;

      case "rating":
        return b.rating - a.rating;

      case "newest":
        return b.id.localeCompare(a.id);

      case "popular":
      default:
        return b.reviewCount - a.reviewCount;
    }
  });
}, [filters, sort]);










  // Reset the visible window when filters/sort change.
  // Uses the "adjust state during render" pattern so we don't trigger a
  // cascading effect.
  const resetKey = `${filtered.length}|${sort}|${JSON.stringify(filters)}`;
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setVisibleCount(PAGE_SIZE);
    setAnimateFrom(0);
  }

  const pageItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;





  // IntersectionObserver: load more when sentinel scrolls into view
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => {
            if (current >= filtered.length) return current;
            setAnimateFrom(current);
            return Math.min(current + PAGE_SIZE, filtered.length);
          });
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);







  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };






  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex gap-5">
          {/* Desktop Sidebar (collapsible) */}
          <div
            className={`hidden lg:block shrink-0 overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out ${
              sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 -ml-5"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <div className="w-64">
              <FilterSidebar
                filters={filters}
                onChange={handleFiltersChange}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ProductToolbar
              resultsCount={filtered.length}
              totalCount={allProductsData.length}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
            />

            <ProductsGrid
              products={pageItems}
              viewMode={viewMode}
              onClearFilters={resetFilters}
              wide={!sidebarOpen}
              animateFrom={animateFrom}
            />

            {/* Sentinel + status row */}
            <div className="mt-8 flex flex-col items-center justify-center gap-2 min-h-12">
              {hasMore ? (
                <>
                  <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                  <div className="flex items-center gap-2 text-sm text-violet-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading more products…</span>
                  </div>
                </>
              ) : (
                filtered.length > PAGE_SIZE && (
                  <p className="text-sm text-gray-500">
                    You&apos;ve reached the end · {filtered.length} products
                  </p>
                )
              )}
            </div>
          </main>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
      />
    </div>
  );
}
