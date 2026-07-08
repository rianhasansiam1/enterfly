import { readApiError } from "@/features/http/api-envelope";

export type Role = "USER" | "ADMIN";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  image: string | null;
  role: Role;
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  liveOrdersCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
};

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  adminCount?: number;
  withOrdersCount?: number;
  lifetimeRevenue?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};



export const ROLE_VALUES: readonly Role[] = ["USER", "ADMIN"];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseRole(value: unknown): Role {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

function parseRow(entry: unknown): AdminUserRow {
  const item = (entry ?? {}) as Partial<AdminUserRow>;
  return {
    id: asString(item.id),
    name: asString(item.name),
    email: asString(item.email),
    phone: asNullableString(item.phone),
    city: asNullableString(item.city),
    image: asNullableString(item.image),
    role: parseRole(item.role),
    termsAcceptedAt: asNullableString(item.termsAcceptedAt),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
    ordersCount: Number(item.ordersCount ?? 0),
    liveOrdersCount: Number(item.liveOrdersCount ?? 0),
    totalSpend: Number(item.totalSpend ?? 0),
    lastOrderAt: asNullableString(item.lastOrderAt),
  };
}

export function parseUsersPayload(payload: unknown): {
  items: AdminUserRow[];
  meta: ApiMeta;
} {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Customers API returned an invalid response.");
  }

  return {
    items: envelope.data.map(parseRow),
    meta: envelope.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}

export type AdminUserQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
};

/**
 * Fetch a single page of admin users from the server.
 *
 * All filtering, search, and pagination happen server-side.
 */
export async function fetchAdminUsersPage(
  params: AdminUserQueryParams = {},
): Promise<{ items: AdminUserRow[]; meta: ApiMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) qs.set("search", params.search);
  if (params.role) qs.set("role", params.role);

  const response = await fetch(`/api/admin/users?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to parse customers response.");
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to load customers."));
  }

  return parseUsersPayload(payload);
}

export async function patchUserRole(
  userId: string,
  role: Role,
): Promise<AdminUserRow> {
  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to update role."));
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success) {
    throw new Error(readApiError(payload, "Failed to update role."));
  }

  return parseRow(envelope.data);
}

export function formatCurrency(value: number): string {
  return `BDT ${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
