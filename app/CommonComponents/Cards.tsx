"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  removeWishlistItem,
  setWishlistError,
  upsertWishlistItem,
} from "@/app/redux/features/wishlistSlice";
import { setCartData, setCartError as setCartErrorAction } from "@/app/redux/features/cartSlice";
import type { AppDispatch, RootState } from "@/app/redux/store/store";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
};

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

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const WISHLIST_LOCAL_STORAGE_KEY = "enterfly:wishlist:v1";
const CART_LOCAL_STORAGE_KEY = "enterfly:cart:v1";
const DEFAULT_CART_STOCK = 10;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeWishlistItem(raw: unknown): WishlistItem | null {
  const entry = asRecord(raw);
  if (!entry) return null;
  if (typeof entry.id !== "string" || entry.id.trim() === "") return null;
  if (typeof entry.name !== "string" || entry.name.trim() === "") return null;
  if (typeof entry.image !== "string" || entry.image.trim() === "") return null;

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

  return {
    id: entry.id,
    name: entry.name,
    brand: typeof entry.brand === "string" && entry.brand ? entry.brand : "EnterFly",
    image: entry.image,
    price,
    originalPrice,
    rating,
    reviewCount,
    category:
      typeof entry.category === "string" && entry.category ? entry.category : "General",
    inStock: typeof entry.inStock === "boolean" ? entry.inStock : true,
    addedAt:
      typeof entry.addedAt === "string" && entry.addedAt
        ? entry.addedAt
        : new Date().toISOString(),
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

    const items = parsed
      .map(normalizeWishlistItem)
      .filter((item): item is WishlistItem => item !== null);

    const seen = new Set<string>();
    return items.filter((item) => {
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

function upsertLocalWishlistItem(
  list: WishlistItem[],
  item: WishlistItem,
): WishlistItem[] {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return [item, ...list];
  }

  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
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
      : DEFAULT_CART_STOCK;

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

    const items = parsed
      .map(normalizeCartItem)
      .filter((item): item is CartItem => item !== null);

    const deduped = new Map<string, CartItem>();
    for (const item of items) {
      const existing = deduped.get(item.productId);
      if (!existing) {
        deduped.set(item.productId, item);
        continue;
      }

      const quantity = existing.quantity + item.quantity;
      deduped.set(item.productId, {
        ...existing,
        quantity,
        lineTotal: existing.unitPrice * quantity,
      });
    }

    return Array.from(deduped.values());
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
  const entry = asRecord(payload);
  if (!entry) return fallback;

  if (typeof entry.message === "string" && entry.message.trim()) {
    return entry.message;
  }
  if (typeof entry.error === "string" && entry.error.trim()) {
    return entry.error;
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

async function createWishlistItemOnServer(productId: string): Promise<WishlistItem> {
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
    cache: "no-store",
  });

  return readApiData<WishlistItem>(
    response,
    "Failed to add this product to wishlist.",
  );
}

async function removeWishlistItemOnServer(productId: string): Promise<void> {
  const response = await fetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  await readApiData<{ id: string }>(
    response,
    "Failed to remove this product from wishlist.",
  );
}

async function createCartItemOnServer(productId: string): Promise<CartItem> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity: 1 }),
    cache: "no-store",
  });

  return readApiData<CartItem>(response, "Failed to add this product to cart.");
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

function canUseServerWishlist(role: string | undefined, status: string): boolean {
  return status === "authenticated" && (role === "USER" || role === "ADMIN");
}

function canUseServerCart(role: string | undefined, status: string): boolean {
  return status === "authenticated" && (role === "USER" || role === "ADMIN");
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating = 0,
  reviewCount = 0,
  badge,
}: ProductCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const [isBusy, setIsBusy] = useState(false);
  const [isCartBusy, setIsCartBusy] = useState(false);

  const isWishlisted = useSelector((state: RootState) =>
    state.wishlist.items.some((item) => item.id === id),
  );

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleToggleWishlist = async () => {
    if (isBusy) return;

    const canUseServer = canUseServerWishlist(session?.user?.role, status);
    const localBefore = readLocalWishlist();
    const optimisticItem: WishlistItem = {
      id,
      name,
      brand: "EnterFly",
      image,
      price,
      originalPrice,
      rating,
      reviewCount,
      category: "General",
      inStock: true,
      addedAt: new Date().toISOString(),
      badge,
    };

    dispatch(setWishlistError(null));

    if (isWishlisted) {
      const nextLocal = localBefore.filter((item) => item.id !== id);
      writeLocalWishlist(nextLocal);
      dispatch(removeWishlistItem(id));

      if (!canUseServer) return;

      setIsBusy(true);
      try {
        await removeWishlistItemOnServer(id);
      } catch (error) {
        writeLocalWishlist(localBefore);
        dispatch(upsertWishlistItem(optimisticItem));
        const message =
          error instanceof Error
            ? error.message
            : "Failed to remove item from wishlist.";
        dispatch(setWishlistError(message));
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const nextLocal = upsertLocalWishlistItem(localBefore, optimisticItem);
    writeLocalWishlist(nextLocal);
    dispatch(upsertWishlistItem(optimisticItem));

    if (!canUseServer) return;

    setIsBusy(true);
    try {
      const savedItem = await createWishlistItemOnServer(id);
      const latestLocal = upsertLocalWishlistItem(readLocalWishlist(), savedItem);
      writeLocalWishlist(latestLocal);
      dispatch(upsertWishlistItem(savedItem));
    } catch (error) {
      writeLocalWishlist(localBefore);
      dispatch(removeWishlistItem(id));
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add item to wishlist.";
      dispatch(setWishlistError(message));
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddToCart = async () => {
    if (isCartBusy) return;

    const canUseServer = canUseServerCart(session?.user?.role, status);

    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(id);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add item to cart.";
        dispatch(setCartErrorAction(message));
      } finally {
        setIsCartBusy(false);
      }
      return;
    }

    const localBefore = readLocalCart();
    const optimisticItem: CartItem = {
      id: `local:${id}`,
      productId: id,
      name,
      image,
      quantity: 1,
      unitPrice: price,
      originalPrice: originalPrice ?? price,
      lineTotal: price,
      stock: DEFAULT_CART_STOCK,
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
      <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
        <Link href={`/productDetails/${id}`}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </Link>

        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )}

        {discount > 0 && !badge && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            void handleToggleWishlist();
          }}
          disabled={isBusy}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-all duration-300 ${
              isWishlisted
                ? "scale-110 fill-red-500 text-red-500"
                : "text-gray-500 hover:text-red-400"
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={isCartBusy}
          aria-label="Add to cart"
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-violet-700 opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-violet-600 hover:text-white group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="p-2 sm:p-2.5">
        {rating > 0 && (
          <div className="mb-1 flex items-center gap-0.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="ml-0.5 text-[10px] text-gray-500">({reviewCount})</span>
          </div>
        )}

        <Link href={`/productDetails/${id}`}>
          <h3 className="line-clamp-1 text-xs font-semibold leading-tight text-gray-800 transition-colors hover:text-violet-700 sm:text-sm">
            {name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-sm font-bold text-violet-700">
            BDT {price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-[11px] text-gray-400 line-through">
              BDT {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
