"use client";

import { useMemo, useState } from "react";

import WishlistHero from "./components/WishlistHero";
import WishlistToolbar from "./components/WishlistToolbar";
import WishlistCard from "./components/WishlistCard";
import EmptyWishlist from "./components/EmptyWishlist";
import BulkActionsBar from "./components/BulkActionsBar";
import { MOCK_WISHLIST } from "./components/mockData";
import type { WishlistItem, WishlistSort, WishlistView } from "./components/types";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(MOCK_WISHLIST);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WishlistSort>("recent");
  const [view, setView] = useState<WishlistView>("grid");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items],
  );

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = items.filter((i) => {
      const matchesCategory =
        activeCategory === "all" || i.category === activeCategory;
      const matchesQuery =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    next = [...next].sort((a, b) => {
      switch (sort) {
        case "recent":
          return (
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
          );
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return next;
  }, [items, query, sort, activeCategory]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, i) => sum + i.price, 0);
    const totalSavings = items.reduce(
      (sum, i) =>
        sum + (i.originalPrice ? Math.max(0, i.originalPrice - i.price) : 0),
      0,
    );
    const priceDrops = items.filter(
      (i) => typeof i.priceDropFromAdded === "number" && i.priceDropFromAdded > 0,
    ).length;
    return { totalValue, totalSavings, priceDrops };
  }, [items]);

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((i) => selected.has(i.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleItems.map((i) => i.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const removeItems = (ids: string[]) => {
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const handleRemove = (id: string) => removeItems([id]);
  const handleRemoveSelected = () => removeItems(Array.from(selected));

  const handleMoveToCart = (id: string) => {
    // Hook this up to your cart store / API.
    console.info("Move to cart:", id);
    removeItems([id]);
  };

  const handleMoveSelectedToCart = () => {
    const ids = Array.from(selected).filter((id) => {
      const item = items.find((i) => i.id === id);
      return item?.inStock;
    });
    console.info("Move selected to cart:", ids);
    removeItems(ids);
  };

  const handleShare = async (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/product/${id}`;
    const shareData: ShareData = {
      title: "Check this out",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      console.info("Share link:", url);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
  };

  const isFiltered = query.trim() !== "" || activeCategory !== "all";

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <WishlistHero
          totalItems={items.length}
          totalValue={stats.totalValue}
          totalSavings={stats.totalSavings}
          priceDrops={stats.priceDrops}
        />

        {items.length > 0 && (
          <WishlistToolbar
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            totalCount={items.length}
            visibleCount={visibleItems.length}
            allSelected={allVisibleSelected}
            onToggleSelectAll={toggleSelectAll}
          />
        )}

        <section className="mt-6 pb-24">
          {items.length === 0 ? (
            <EmptyWishlist />
          ) : visibleItems.length === 0 ? (
            <EmptyWishlist filtered onClearFilters={clearFilters} />
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
                  : "flex flex-col gap-3"
              }
            >
              {visibleItems.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  view={view}
                  selected={selected.has(item.id)}
                  onToggleSelect={toggleSelect}
                  onRemove={handleRemove}
                  onMoveToCart={handleMoveToCart}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <BulkActionsBar
        selectedCount={selected.size}
        onClear={clearSelection}
        onMoveAllToCart={handleMoveSelectedToCart}
        onRemoveAll={handleRemoveSelected}
      />
    </main>
  );
}
