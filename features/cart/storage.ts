import { asRecord } from "@/features/http/api-envelope";
import type { CartItem } from "@/features/cart/api";

export const CART_LOCAL_STORAGE_KEY = "enterfly:cart:v1";
export const DEFAULT_CART_STOCK = 10;

export function normalizeCartItem(
  raw: unknown,
  fallbackStock = DEFAULT_CART_STOCK,
): CartItem | null {
  const entry = asRecord(raw);
  if (!entry) return null;

  const id = typeof entry.id === "string" ? entry.id : "";
  const productIdFromEntry =
    typeof entry.productId === "string" ? entry.productId : "";
  const productId = productIdFromEntry || id;
  const name = typeof entry.name === "string" ? entry.name : "";
  if (!productId || !name) return null;

  const quantityRaw =
    typeof entry.quantity === "number" && Number.isFinite(entry.quantity)
      ? entry.quantity
      : 1;
  const quantity = Math.max(1, Math.round(quantityRaw));

  const unitPrice =
    typeof entry.unitPrice === "number" && Number.isFinite(entry.unitPrice)
      ? entry.unitPrice
      : typeof entry.price === "number" && Number.isFinite(entry.price)
        ? entry.price
        : 0;

  const originalPrice =
    typeof entry.originalPrice === "number" && Number.isFinite(entry.originalPrice)
      ? entry.originalPrice
      : unitPrice;

  const stockRaw =
    typeof entry.stock === "number" && Number.isFinite(entry.stock)
      ? entry.stock
      : typeof entry.maxQuantity === "number" && Number.isFinite(entry.maxQuantity)
        ? entry.maxQuantity
        : fallbackStock;
  const stock = Math.max(0, Math.round(stockRaw));

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

export function readLocalCart(options?: { dedupeByProductId?: boolean }): CartItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(CART_LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const items = parsed
      .map((item) => normalizeCartItem(item))
      .filter((item): item is CartItem => item !== null);

    if (!options?.dedupeByProductId) return items;

    const deduped = new Map<string, CartItem>();
    for (const item of items) {
      const existing = deduped.get(item.productId);
      if (!existing) {
        deduped.set(item.productId, item);
        continue;
      }

      const quantity = Math.max(1, existing.quantity + item.quantity);
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

export function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export function upsertLocalCartItem(list: CartItem[], item: CartItem): CartItem[] {
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
