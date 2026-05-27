import type { OrderDetail } from "@/features/orders/api";

/**
 * `sessionStorage` key for the most recently placed order snapshot.
 *
 * The checkout page writes an entry here right after a successful
 * `POST /api/checkout` so the order summary page can paint the
 * receipt instantly on the post-checkout redirect, before the live
 * `/api/orders/[id]` request resolves. The API is still the source
 * of truth — this is just a friendly first paint.
 *
 * Scoped to `sessionStorage` (not `localStorage`) on purpose: the
 * snapshot should not survive the browser tab. A stale snapshot
 * across sessions could mislead the customer about the latest state
 * of the order.
 */
export const ORDER_SNAPSHOT_STORAGE_KEY = "enterfly:order:last:v1";

export type OrderSnapshot = {
  id: string;
  order: OrderDetail;
};

export function readOrderSnapshot(orderId: string): OrderSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ORDER_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OrderSnapshot> | null;
    if (!parsed || parsed.id !== orderId || !parsed.order) return null;
    return parsed as OrderSnapshot;
  } catch {
    return null;
  }
}

export function clearOrderSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ORDER_SNAPSHOT_STORAGE_KEY);
  } catch {
    // ignore: private browsing mode can disable sessionStorage writes.
  }
}
