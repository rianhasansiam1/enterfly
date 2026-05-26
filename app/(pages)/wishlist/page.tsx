"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import WishlistHero from "./components/WishlistHero";
import WishlistToolbar from "./components/WishlistToolbar";
import WishlistCard from "./components/WishlistCard";
import EmptyWishlist from "./components/EmptyWishlist";
import BulkActionsBar from "./components/BulkActionsBar";
import {
  setWishlistError,
  setWishlistItems,
  setWishlistLoading,
  setWishlistMode,
} from "@/app/redux/features/wishlistSlice";
import { setCartData, setCartError as setCartErrorAction } from "@/app/redux/features/cartSlice";
import type { AppDispatch, RootState } from "@/app/redux/store/store";

type WishlistItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  inStock: boolean;
  addedAt: string;
  priceDropFromAdded?: number;
  badge?: string;
};

type WishlistView = "grid" | "list";

type WishlistSort =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "rating";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const WISHLIST_LOCAL_STORAGE_KEY = "enterfly:wishlist:v1";
const CART_LOCAL_STORAGE_KEY = "enterfly:cart:v1";

type CartStatus = "ACTIVE" | "INACTIVE";

type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  stock: number;
  status: CartStatus;
};

type CartSummary = {
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
};

function isServerWishlistRole(role: string | undefined): boolean {
  return role === "USER" || role === "ADMIN";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeWishlistItem(raw: unknown): WishlistItem | null {
  const entry = asRecord(raw);
  if (!entry) return null;
  if (typeof entry.id !== "string" || entry.id.trim() === "") return null;
  if (typeof entry.name !== "string" || entry.name.trim() === "") return null;

  const price =
    typeof entry.price === "number" && Number.isFinite(entry.price)
      ? entry.price
      : 0;
  const originalPrice =
    typeof entry.originalPrice === "number" && Number.isFinite(entry.originalPrice)
      ? entry.originalPrice
      : undefined;
  const rating =
    typeof entry.rating === "number" && Number.isFinite(entry.rating)
      ? entry.rating
      : 0;
  const reviewCount =
    typeof entry.reviewCount === "number" && Number.isFinite(entry.reviewCount)
      ? entry.reviewCount
      : 0;
  const addedAt =
    typeof entry.addedAt === "string" && entry.addedAt
      ? entry.addedAt
      : new Date().toISOString();

  return {
    id: entry.id,
    name: entry.name,
    brand: typeof entry.brand === "string" && entry.brand ? entry.brand : "EnterFly",
    image: typeof entry.image === "string" && entry.image ? entry.image : "",
    price,
    originalPrice,
    rating,
    reviewCount,
    category:
      typeof entry.category === "string" && entry.category ? entry.category : "General",
    inStock: typeof entry.inStock === "boolean" ? entry.inStock : true,
    addedAt,
    priceDropFromAdded:
      typeof entry.priceDropFromAdded === "number" &&
      Number.isFinite(entry.priceDropFromAdded)
        ? entry.priceDropFromAdded
        : undefined,
    badge: typeof entry.badge === "string" && entry.badge ? entry.badge : undefined,
  };
}

function readLocalWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeWishlistItem)
      .filter((item): item is WishlistItem => item !== null);

    const seen = new Set<string>();
    return normalized.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch {
    return [];
  }
}

function writeLocalWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_LOCAL_STORAGE_KEY, JSON.stringify(items));
}

function normalizeCartItem(raw: unknown): CartItem | null {
  const entry = asRecord(raw);
  if (!entry) return null;

  const id = typeof entry.id === "string" ? entry.id : "";
  const productId = typeof entry.productId === "string" ? entry.productId : id;
  const name = typeof entry.name === "string" ? entry.name : "";
  if (!productId || !name) return null;

  const quantity =
    typeof entry.quantity === "number" && Number.isFinite(entry.quantity)
      ? Math.max(1, Math.round(entry.quantity))
      : 1;
  const unitPrice =
    typeof entry.unitPrice === "number" && Number.isFinite(entry.unitPrice)
      ? entry.unitPrice
      : 0;
  const originalPrice =
    typeof entry.originalPrice === "number" && Number.isFinite(entry.originalPrice)
      ? entry.originalPrice
      : unitPrice;
  const stock =
    typeof entry.stock === "number" && Number.isFinite(entry.stock)
      ? Math.max(0, Math.round(entry.stock))
      : 10;

  return {
    id: id || `local:${productId}`,
    productId,
    name,
    image: typeof entry.image === "string" && entry.image ? entry.image : null,
    quantity,
    unitPrice,
    originalPrice,
    lineTotal: unitPrice * quantity,
    stock,
    status: entry.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(CART_LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeCartItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(items));
}

function upsertLocalCartItem(list: CartItem[], item: CartItem): CartItem[] {
  const index = list.findIndex((entry) => entry.productId === item.productId);
  if (index === -1) {
    return [item, ...list];
  }

  const existing = list[index];
  const quantity = existing.quantity + item.quantity;
  const next: CartItem = {
    ...existing,
    ...item,
    image: item.image ?? existing.image,
    quantity,
    lineTotal: item.unitPrice * quantity,
    stock: Math.max(existing.stock, item.stock),
  };

  const merged = [...list];
  merged[index] = next;
  return merged;
}

function computeCartSummary(items: CartItem[]): CartSummary {
  let totalItems = 0;
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    if (item.status !== "ACTIVE") continue;
    totalItems += item.quantity;
    subtotal += item.unitPrice * item.quantity;
    totalDiscount += Math.max(0, (item.originalPrice - item.unitPrice) * item.quantity);
  }

  subtotal = Math.round(subtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;

  return {
    totalItems,
    subtotal,
    totalDiscount,
    finalTotal: subtotal,
  };
}

function readApiError(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  if (!record) return fallback;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  return fallback;
}

async function readApiData<T>(response: Response, fallbackError: string): Promise<T> {
  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error(fallbackError);
  }

  const envelope = payload as ApiResponse<T>;

  if (!response.ok || !envelope?.success) {
    throw new Error(readApiError(payload, fallbackError));
  }

  return envelope.data;
}

async function syncWishlistToServer(productIds: string[]): Promise<WishlistItem[]> {
  const response = await fetch("/api/wishlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
    cache: "no-store",
  });

  return readApiData<WishlistItem[]>(
    response,
    "Failed to sync wishlist with server.",
  );
}

async function removeWishlistItemOnServer(productId: string): Promise<void> {
  const response = await fetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
    cache: "no-store",
  });
  await readApiData<{ id: string }>(
    response,
    "Failed to remove wishlist item on server.",
  );
}

async function addCartItemOnServer(productId: string): Promise<CartItem> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: 1 }),
    cache: "no-store",
  });

  return readApiData<CartItem>(response, "Failed to add item to cart.");
}

async function fetchServerCartSnapshot(): Promise<{
  items: CartItem[];
  summary: CartSummary;
}> {
  const response = await fetch("/api/cart", {
    method: "GET",
    cache: "no-store",
  });

  return readApiData<{ items: CartItem[]; summary: CartSummary }>(
    response,
    "Failed to load authoritative cart from server.",
  );
}







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
        return;
      }
    }

    writeLocalWishlist(next);
  };

  const handleRemove = (id: string) => {
    void removeItems([id]);
  };

  const handleRemoveSelected = () => {
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
        return;
      }

      await removeItems(toMove.map((item) => item.id));
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

    const url = `${window.location.origin}/productDetails/${id}`;
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
