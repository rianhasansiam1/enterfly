"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import ProductsGrid from "./components/ProductsGrid";
import ProductToolbar from "./components/ProductToolbar";
import {
  setAllProducts,
  setAllProductsError,
  setAllProductsLoading,
} from "@/store/slices/all-products.slice";
import type { AppDispatch, RootState } from "@/store";
import { fetchAllActiveProductsFromApi } from "@/features/products/api";
import type { Product } from "@/features/products/api";

type SortOption =
  | "popular"
  | "price-low"
  | "price-high"
  | "rating"
  | "newest";

type ViewMode = "grid" | "list";

type Filters = {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
};
const INITIAL_PRICE_BOUNDS: [number, number] = [0, 5000];
const DEFAULT_PAGE_SIZE = 12;

export default function AllProductsPage() {
  return (
    <Suspense fallback={null}>
      <AllProductsPageInner />
    </Suspense>
  );
}

function AllProductsPageInner() {
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const productsFromStore = useSelector(
    (state: RootState) => state.allProducts.items,
  );
  const isLoadingFromStore = useSelector(
    (state: RootState) => state.allProducts.isLoading,
  );
  const isHydrated = useSelector((state: RootState) => state.allProducts.isHydrated);
  const errorFromStore = useSelector((state: RootState) => state.allProducts.error);

  const [filters, setFilters] = useState<Filters>({
    categories: [],
    brands: [],
    priceRange: INITIAL_PRICE_BOUNDS,
    minRating: 0,
    inStockOnly: false,
  });
  const [sort, setSort] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_PAGE_SIZE);
  const [animateFrom, setAnimateFrom] = useState(0);
  const [appliedPriceBoundsKey, setAppliedPriceBoundsKey] = useState(
    `${INITIAL_PRICE_BOUNDS[0]}-${INITIAL_PRICE_BOUNDS[1]}`,
  );
  const [prevResetKey, setPrevResetKey] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ignore = false;

    if (isHydrated || productsFromStore.length > 0) {
      return;
    }

    const loadProducts = async () => {
      dispatch(setAllProductsLoading(true));
      dispatch(setAllProductsError(null));
      try {
        const items = await fetchAllActiveProductsFromApi();
        if (ignore) return;
        dispatch(setAllProducts(items));
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load products from API.";
        dispatch(setAllProductsError(message));
      } finally {
        if (!ignore) {
          dispatch(setAllProductsLoading(false));
        }
      }
    };

    void loadProducts();

    return () => {
      ignore = true;
    };
  }, [dispatch, isHydrated, productsFromStore.length]);

  const products = productsFromStore;

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category))).sort();
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.brand)
          .filter((brand): brand is string => Boolean(brand)),
      ),
    ).sort();
  }, [products]);

  const priceBounds = useMemo<[number, number]>(() => {
    if (products.length === 0) return INITIAL_PRICE_BOUNDS;

    const maxFinalPrice = Math.max(
      ...products.map((product) => product.discountPrice ?? product.price),
    );

    const normalizedMax = Math.max(500, Math.ceil(maxFinalPrice / 50) * 50);
    return [0, normalizedMax];
  }, [products]);

  const priceBoundsKey = `${priceBounds[0]}-${priceBounds[1]}`;
  if (products.length > 0 && appliedPriceBoundsKey !== priceBoundsKey) {
    setAppliedPriceBoundsKey(priceBoundsKey);
    setFilters((prev) => {
      const untouched =
        prev.categories.length === 0 &&
        prev.brands.length === 0 &&
        prev.minRating === 0 &&
        !prev.inStockOnly &&
        prev.priceRange[0] === INITIAL_PRICE_BOUNDS[0] &&
        prev.priceRange[1] === INITIAL_PRICE_BOUNDS[1];

      if (untouched) {
        return { ...prev, priceRange: priceBounds };
      }

      if (prev.priceRange[1] > priceBounds[1]) {
        return { ...prev, priceRange: [prev.priceRange[0], priceBounds[1]] };
      }

      return prev;
    });
  }

  const getFinalPrice = (product: Product) => product.discountPrice ?? product.price;

  const filtered = useMemo(() => {
    const list = products.filter((product) => {
      const finalPrice = getFinalPrice(product);

      const matchSearch =
        searchTerm.length === 0 ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        (product.brand?.toLowerCase().includes(searchTerm) ?? false);

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

      const matchStock = !filters.inStockOnly || product.inStock;

      return (
        matchSearch &&
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "popular":
        default:
          return b.reviewCount - a.reviewCount;
      }
    });
  }, [filters, products, sort, searchTerm]);

  const resetKey = [
    sort,
    searchTerm,
    filters.categories.join("|"),
    filters.brands.join("|"),
    filters.minRating,
    filters.inStockOnly ? "1" : "0",
    `${filters.priceRange[0]}-${filters.priceRange[1]}`,
    filtered.length,
  ].join("::");

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setVisibleCount(DEFAULT_PAGE_SIZE);
    setAnimateFrom(0);
  }

  const pageItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

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
            return Math.min(current + DEFAULT_PAGE_SIZE, filtered.length);
          });
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, hasMore]);

  const handleFiltersChange = (next: Filters) => {
    setFilters(next);
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: priceBounds,
      minRating: 0,
      inStockOnly: false,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex gap-5">
          <div
            className={`hidden shrink-0 overflow-hidden transition-[width,opacity,margin] duration-300 ease-in-out lg:block ${
              sidebarOpen ? "w-64 opacity-100" : "-ml-5 w-0 opacity-0"
            }`}
            aria-hidden={!sidebarOpen}
          >
            <div className="w-64">
              <FilterSidebar
                filters={filters}
                onChange={handleFiltersChange}
                onReset={resetFilters}
                categories={categories}
                brands={brands}
                priceBounds={priceBounds}
              />
            </div>
          </div>

          <main className="min-w-0 flex-1">
            <ProductToolbar
              resultsCount={filtered.length}
              totalCount={products.length}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />

            {isLoadingFromStore && products.length === 0 ? (
              <div className="mt-10 flex items-center justify-center gap-2 text-sm text-violet-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading products from server...</span>
              </div>
            ) : errorFromStore && products.length === 0 ? (
              <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorFromStore}
              </div>
            ) : (
              <>
                <ProductsGrid
                  products={pageItems}
                  viewMode={viewMode}
                  onClearFilters={resetFilters}
                  wide={!sidebarOpen}
                  animateFrom={animateFrom}
                />

                <div className="mt-8 flex min-h-12 flex-col items-center justify-center gap-2">
                  {hasMore ? (
                    <>
                      <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                      <div className="flex items-center gap-2 text-sm text-violet-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading more products...</span>
                      </div>
                    </>
                  ) : (
                    filtered.length > DEFAULT_PAGE_SIZE && (
                      <p className="text-sm text-gray-500">
                        You&apos;ve reached the end - {filtered.length} products
                      </p>
                    )
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={resetFilters}
        categories={categories}
        brands={brands}
        priceBounds={priceBounds}
      />
    </div>
  );
}
