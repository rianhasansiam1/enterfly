import { readApiError } from "@/features/http/api-envelope";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PAID" | "UNPAID";

export type PaymentMethod = "CASH_ON_DELIVERY" | "ONLINE";

export type AdminOrderUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
} | null;

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  user: AdminOrderUser;
};

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};

export const API_PAGE_SIZE = 100;

export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const PAYMENT_STATUS_VALUES: readonly PaymentStatus[] = ["PAID", "UNPAID"];

/**
 * Allowed forward transitions per status. Mirrors the server-side
 * STATUS_TRANSITIONS in `order.service` so the UI never offers an
 * invalid action and the API stays the source of truth on rejection.
 */
export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

function parseUser(value: unknown): AdminOrderUser {
  if (value == null) return null;
  const record = value as Partial<NonNullable<AdminOrderUser>>;
  return {
    id: typeof record.id === "string" ? record.id : "",
    name: typeof record.name === "string" ? record.name : null,
    email: typeof record.email === "string" ? record.email : null,
    phone: typeof record.phone === "string" ? record.phone : null,
  };
}

function parseOrderStatus(value: unknown): OrderStatus {
  return (ORDER_STATUS_VALUES as readonly string[]).includes(value as string)
    ? (value as OrderStatus)
    : "PENDING";
}

function parsePaymentStatus(value: unknown): PaymentStatus {
  return value === "PAID" ? "PAID" : "UNPAID";
}

function parseRow(entry: unknown): AdminOrderRow {
  const item = (entry ?? {}) as Partial<AdminOrderRow> & {
    user?: unknown;
  };

  return {
    id: typeof item.id === "string" ? item.id : "",
    orderNumber: typeof item.orderNumber === "string" ? item.orderNumber : "",
    subtotal: Number(item.subtotal ?? 0),
    deliveryCharge: Number(item.deliveryCharge ?? 0),
    discountAmount: Number(item.discountAmount ?? 0),
    totalAmount: Number(item.totalAmount ?? 0),
    status: parseOrderStatus(item.status),
    paymentMethod:
      item.paymentMethod === "ONLINE"
        ? "ONLINE"
        : "CASH_ON_DELIVERY",
    paymentStatus: parsePaymentStatus(item.paymentStatus),
    customerName: typeof item.customerName === "string" ? item.customerName : "",
    customerPhone:
      typeof item.customerPhone === "string" ? item.customerPhone : "",
    customerAddress:
      typeof item.customerAddress === "string" ? item.customerAddress : "",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : "",
    itemsCount: Number(item.itemsCount ?? 0),
    user: parseUser(item.user),
  };
}

export function parseOrdersPayload(payload: unknown): {
  items: AdminOrderRow[];
  meta: ApiMeta | null;
} {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Orders API returned an invalid response.");
  }

  return {
    items: envelope.data.map(parseRow),
    meta: envelope.meta ?? null,
  };
}

/**
 * Walk every page of `/api/admin/orders` and return the full list.
 * The admin panel is the only consumer and the payload is small enough
 * to keep in memory; we trade a few requests for fully client-side
 * filtering / search after the initial sync.
 */
export async function fetchAllAdminOrdersSnapshot(): Promise<AdminOrderRow[]> {
  let page = 1;
  let totalPages = 1;
  const merged: AdminOrderRow[] = [];

  while (page <= totalPages) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(API_PAGE_SIZE),
    });

    const response = await fetch(`/api/admin/orders?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      throw new Error("Failed to parse orders response.");
    }

    if (!response.ok) {
      throw new Error(readApiError(payload, "Failed to load orders."));
    }

    const { items, meta } = parseOrdersPayload(payload);
    merged.push(...items);
    totalPages = meta?.totalPages ?? 1;
    page += 1;
  }

  return merged;
}

export async function patchOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const response = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      // ignore — fall through to fallback message
    }
    throw new Error(readApiError(payload, "Failed to update order status."));
  }
}

export async function patchPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<void> {
  const response = await fetch(
    `/api/admin/orders/${orderId}/payment-status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      // ignore
    }
    throw new Error(readApiError(payload, "Failed to update payment status."));
  }
}

export function formatCurrency(value: number): string {
  return `BDT ${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
