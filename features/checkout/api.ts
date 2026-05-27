import { readApiData } from "@/features/http/api-envelope";
import type { OrderDetail } from "@/features/orders/api";

export type CheckoutPaymentMethod = "CASH_ON_DELIVERY" | "ONLINE";

export type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

export type CheckoutItemPriced = {
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  lineTotal: number;
  stock: number;
};

export type CheckoutSummary = {
  subtotal: number;
  totalSavings: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  taxRate: number;
  freeShippingThreshold: number;
  shippingFee: number;
  isFreeShippingApplied: boolean;
  currency: string;
};

export type CheckoutPromo =
  | {
      ok: true;
      code: string;
      description: string | null;
      discount: number;
    }
  | {
      ok: false;
      code: string;
      reason: string;
    }
  | null;

export type CheckoutPreview = {
  items: CheckoutItemPriced[];
  summary: CheckoutSummary;
  promo: CheckoutPromo;
};

export type PreviewRequest = {
  items?: CheckoutItemInput[];
  promoCode?: string | null;
};

export async function fetchCheckoutPreview(
  body: PreviewRequest,
): Promise<CheckoutPreview> {
  const response = await fetch("/api/checkout/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return readApiData<CheckoutPreview>(
    response,
    "Failed to compute order totals.",
  );
}

export type PlaceOrderRequest = {
  items?: CheckoutItemInput[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerNote?: string;
  paymentMethod: CheckoutPaymentMethod;
  promoCode?: string | null;
  clearCart?: boolean;
};

export type PlacedOrderResult = {
  order: OrderDetail;
  summary: CheckoutSummary;
  promo: CheckoutPromo;
};

export async function placeCheckoutOrder(
  body: PlaceOrderRequest,
): Promise<PlacedOrderResult> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return readApiData<PlacedOrderResult>(
    response,
    "Failed to place the order.",
  );
}

export type CheckoutProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
};

export async function fetchCheckoutProfile(): Promise<CheckoutProfile | null> {
  try {
    const response = await fetch("/api/user/me", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await readApiData<CheckoutProfile>(
      response,
      "Failed to load profile.",
    );
  } catch {
    return null;
  }
}
