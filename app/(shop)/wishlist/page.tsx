"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import WishlistHero from "./components/WishlistHero";
import WishlistToolbar from "./components/WishlistToolbar";
import WishlistCard from "./components/WishlistCard";
import EmptyWishlist from "./components/EmptyWishlist";
import BulkActionsBar from "./components/BulkActionsBar";
import SavedForLater from "@/app/(shop)/cart/components/SavedForLater";
import {
  setWishlistError,
  setWishlistItems,
  setWishlistLoading,
  setWishlistMode,
} from "@/store/slices/wishlist.slice";
import {
  setCartData,
  setCartError as setCartErrorAction,
} from "@/store/slices/cart.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  createCartItemOnServer as addCartItemOnServer,
  fetchServerCartSnapshot,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  readLocalCart,
  upsertLocalCartItem,
  writeLocalCart,
} from "@/features/cart/storage";
import {
  isServerWishlistRole,
  removeWishlistItemOnServer,
  syncWishlistToServer,
} from "@/features/wishlist/api";
import {
  readLocalWishlist,
  writeLocalWishlist,
} from "@/features/wishlist/storage";
import {
  readLocalSaved,
  writeLocalSaved,
} from "@/features/cart/saved-storage";
import { confirm, toast } from "@/lib/feedback";

type WishlistView = "grid" | "list";

type WishlistSort =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "rating";

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();

  const items = useSelector((state: RootState) => state.wishlist.items);
  const mode = useSelector((state: RootState) => state.wishlist.mode);
  const isLoading = useSelector((state: RootState) => state.wishlist.isLoading);
  const error = useSelector((state: RootState) => state.wishlist.error);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WishlistSort>("recent");
  const [view, setView] = useState<WishlistView>("grid");
  const [activeCategory, setActiveCategory] = useState("all");

  // Saved-for-later items are shared with the cart page via localStorage.
  const [saved, setSaved] = useState<import("@/features/cart/saved-storage").SavedItem[]>([]);

  // Hydrate saved-for-later from localStorage on mount.
  useEffect(() => {
    setSaved(readLocalSaved());
  }, []);

  const canUseServer =
    status === "authenticated" && isServerWishlistRole(session?.user?.role);

  useEffect(() => {
    if (status === "loading") return;

    let ignore = false;

    const hydrate = async () => {
      const localItems = readLocalWishlist();

      dispatch(setWishlistError(null));
      dispatch(setWishlistLoading(true));

      if (!canUseServer) {
        dispatch(setWishlistMode("local"));
        dispatch(setWishlistItems(localItems));
        dispatch(setWishlistLoading(false));
        return;
      }

      dispatch(setWishlistMode("server"));

      try {
        const serverItems = await syncWishlistToServer(localItems.map((item) => item.id));
        if (ignore) return;
        dispatch(setWishlistItems(serverItems));
        writeLocalWishlist(serverItems);
      } catch (err) {
        if (ignore) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load wishlist from server.";
        dispatch(setWishlistError(message));
        dispatch(setWishlistMode("local"));
        dispatch(setWishlistItems(localItems));
      } finally {
        if (!ignore) {
          dispatch(setWishlistLoading(false));
        }
      }
    };

    void hydrate();

    return () => {
      ignore = true;
    };
  }, [canUseServer, dispatch, status]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items],
  );

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    next = [...next].sort((a, b) => {
      switch (sort) {
        case "recent":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "oldest":
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
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
  }, [activeCategory, items, query, sort]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.price, 0);
    const totalSavings = items.reduce(
      (sum, item) =>
        sum + (item.originalPrice ? Math.max(0, item.originalPrice - item.price) : 0),
      0,
    );
    const priceDrops = items.filter(
      (item) =>
        typeof item.priceDropFromAdded === "number" && item.priceDropFromAdded > 0,
    ).length;

    return { totalValue, totalSavings, priceDrops };
  }, [items]);

  const allVisibleSelected =
    visibleItems.length > 0 && visibleItems.every((item) => selected.has(item.id));

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
      setSelected(new Set(visibleItems.map((item) => item.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const removeItems = async (ids: string[]) => {
    if (ids.length === 0) return;

    const idSet = new Set(ids);
    const previous = items;
    const next = items.filter((item) => !idSet.has(item.id));

    dispatch(setWishlistError(null));
    dispatch(setWishlistItems(next));
    setSelected((prev) => {
      const updated = new Set(prev);
      for (const id of ids) updated.delete(id);
      return updated;
    });

    if (canUseServer) {
      try {
        await Promise.all(ids.map((id) => removeWishlistItemOnServer(id)));
      } catch (err) {
        dispatch(setWishlistItems(previous));
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update wishlist on server.";
        dispatch(setWishlistError(message));
        toast.error(message);
        return;
      }
    }

    writeLocalWishlist(next);
    toast.success(ids.length === 1 ? "Removed from wishlist" : `${ids.length} items removed from wishlist`);
  };

  const handleRemove = (id: string) => {
    void removeItems([id]);
  };

  const handleRemoveSelected = async () => {
    const count = selected.size;
    if (count === 0) return;

    const ok = await confirm({
      title: `Remove ${count} item${count > 1 ? "s" : ""}?`,
      description: `This will remove ${count} selected item${count > 1 ? "s" : ""} from your wishlist.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;

    void removeItems(Array.from(selected));
  };

  const moveItemsToCart = async (ids: string[]) => {
    const toMove = items.filter((item) => ids.includes(item.id) && item.inStock);
    if (toMove.length === 0) return;

    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      try {
        await Promise.all(toMove.map((item) => addCartItemOnServer(item.id)));
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to move item to cart.";
        dispatch(setCartErrorAction(message));
        toast.error(message);
        return;
      }

      await removeItems(toMove.map((item) => item.id));
      toast.success(toMove.length === 1 ? `${toMove[0].name} moved to cart` : `${toMove.length} items moved to cart`);
      return;
    }

    const localBefore = readLocalCart();
    const optimistic = toMove.reduce((acc, item) => {
      return upsertLocalCartItem(acc, {
        id: `local:${item.id}`,
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: 1,
        unitPrice: item.price,
        originalPrice: item.originalPrice ?? item.price,
        lineTotal: item.price,
        stock: 10,
        status: "ACTIVE",
      });
    }, localBefore);

    writeLocalCart(optimistic);
    dispatch(setCartData({ items: optimistic, summary: computeCartSummary(optimistic) }));

    await removeItems(toMove.map((item) => item.id));
    toast.success(toMove.length === 1 ? `${toMove[0].name} moved to cart` : `${toMove.length} items moved to cart`);
  };

  const handleMoveToCart = (id: string) => {
    void moveItemsToCart([id]);
  };

  const handleMoveSelectedToCart = () => {
    const ids = Array.from(selected).filter((id) => {
      const item = items.find((entry) => entry.id === id);
      return item?.inStock;
    });
    void moveItemsToCart(ids);
  };

  const handleShare = async (id: string) => {
    if (typeof window === "undefined") return;

    const url = `${window.location.origin}/products/${id}`;
    const shareData: ShareData = {
      title: "Check this out",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.info("Link copied to clipboard");
    } catch {
      console.info("Share link:", url);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
  };

  const isFiltered = query.trim() !== "" || activeCategory !== "all";

  // ── Saved-for-later handlers ──────────────────────────────────────────
  const handleSavedRemove = (id: string) => {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    writeLocalSaved(next);
    toast.success("Removed from saved items");
  };

  const handleSavedMoveToCart = async (id: string) => {
    const target = saved.find((item) => item.id === id);
    if (!target || !target.inStock) return;

    const canUseServerCart =
      status === "authenticated" && isServerWishlistRole(session?.user?.role);

    if (canUseServerCart) {
      dispatch(setCartErrorAction(null));
      try {
        await addCartItemOnServer(target.productId, 1, target.variantId);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to move item to cart.";
        dispatch(setCartErrorAction(message));
        toast.error(message);
        return;
      }
    } else {
      const localBefore = readLocalCart();
      const next = upsertLocalCartItem(localBefore, {
        id: `local:${target.variantId ?? target.productId}`,
        productId: target.productId,
        variantId: target.variantId ?? null,
        sku: target.sku ?? null,
        color: target.color ?? null,
        size: target.size ?? null,
        name: target.name,
        image: target.image,
        quantity: 1,
        unitPrice: target.price,
        originalPrice: target.originalPrice ?? target.price,
        lineTotal: target.price,
        stock: 10,
        status: "ACTIVE",
      });
      writeLocalCart(next);
      dispatch(setCartData({ items: next, summary: computeCartSummary(next) }));
    }

    const nextSaved = saved.filter((item) => item.id !== id);
    setSaved(nextSaved);
    writeLocalSaved(nextSaved);
    toast.success(`${target.name} moved to cart`);
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <WishlistHero
          totalItems={items.length}
          totalValue={stats.totalValue}
          totalSavings={stats.totalSavings}
          priceDrops={stats.priceDrops}
        />

        <div className="mt-2 flex items-center justify-between px-1 text-xs text-gray-500">
          <span>Storage mode: {mode === "server" ? "Server + Local" : "Local only"}</span>
          {isLoading && <span>Syncing wishlist...</span>}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
          {isLoading && items.length === 0 ? (
            <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700">
              Loading wishlist...
            </div>
          ) : items.length === 0 ? (
            <EmptyWishlist />
          ) : visibleItems.length === 0 ? (
            <EmptyWishlist filtered={isFiltered} onClearFilters={clearFilters} />
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

        {/* Saved for later — always visible, shared with the cart page */}
        {saved.length > 0 && (
          <SavedForLater
            items={saved}
            onMoveToCart={(id) => { void handleSavedMoveToCart(id); }}
            onRemove={handleSavedRemove}
          />
        )}
      </div>

      <BulkActionsBar
        selectedCount={selected.size}
        onClear={clearSelection}
        onMoveAllToCart={handleMoveSelectedToCart}
        onRemoveAll={() => { void handleRemoveSelected(); }}
      />
    </main>
  );
}
