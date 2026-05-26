import { readApiData } from "@/features/http/api-envelope";

export type CartStatus = "ACTIVE" | "INACTIVE";

export type CartItem = {
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

export type CartSummary = {
  totalItems: number;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
};

export type CartSnapshot = {
  items: CartItem[];
  summary: CartSummary;
};

export function canUseServerCart(role: string | undefined, status: string): boolean {
  return status === "authenticated" && (role === "USER" || role === "ADMIN");
}

export async function fetchServerCartSnapshot(): Promise<CartSnapshot> {
  const response = await fetch("/api/cart", {
    method: "GET",
    cache: "no-store",
  });

  return readApiData<{ items: CartItem[]; summary: CartSummary }>(
    response,
    "Failed to load authoritative cart from server.",
  );
}

export async function createCartItemOnServer(
  productId: string,
  quantity = 1,
): Promise<CartItem> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
    cache: "no-store",
  });

  return readApiData<CartItem>(response, "Failed to add item to cart.");
}

export async function addToCartOnServer(
  productId: string,
  quantity = 1,
): Promise<CartItem> {
  return createCartItemOnServer(productId, quantity);
}

export async function syncCartToServer(localItems: CartItem[]): Promise<CartSnapshot> {
  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: localItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }),
    cache: "no-store",
  });

  return readApiData<CartSnapshot>(response, "Failed to sync cart with server.");
}

export async function updateCartItemOnServer(
  itemId: string,
  quantity: number,
): Promise<CartItem> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
    cache: "no-store",
  });

  return readApiData<CartItem>(response, "Failed to update cart item.");
}

export async function removeCartItemOnServer(itemId: string): Promise<{ id: string }> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  return readApiData<{ id: string }>(response, "Failed to remove cart item.");
}
