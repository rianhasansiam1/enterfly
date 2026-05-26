"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";

import { setCartData, setCartError as setCartErrorAction } from "@/app/redux/features/cartSlice";
import type { AppDispatch } from "@/app/redux/store/store";

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

const CART_LOCAL_STORAGE_KEY = "enterfly:cart:v1";
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

function canUseServerCart(role: string | undefined, status: string): boolean {
  return status === "authenticated" && (role === "USER" || role === "ADMIN");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
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

async function createCartItemOnServer(productId: string, quantity: number): Promise<CartItem> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
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

const ProductActions = ({
  productId,
  productName,
  price,
  inStock,
  stockCount = 10,
}: {
  productId: string | number;
  productName: string;
  price: number;
  inStock: boolean;
  stockCount?: number;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isCartBusy, setIsCartBusy] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockCount, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!inStock || isCartBusy) return;

    const productIdString = String(productId);
    const canUseServer = canUseServerCart(session?.user?.role, status);

    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(productIdString, quantity);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
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
      id: `local:${productIdString}`,
      productId: productIdString,
      name: productName,
      image: FALLBACK_PRODUCT_IMAGE,
      quantity,
      unitPrice: price,
      originalPrice: price,
      lineTotal: price * quantity,
      stock: Math.max(stockCount, 1),
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockCount}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={!inStock || isCartBusy}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            inStock
              ? addedToCart
                ? "bg-green-500 text-white"
                : "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {addedToCart ? "Added!" : "Add to cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductActions;
