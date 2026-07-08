import { readApiError } from "@/features/http/api-envelope";

export type CategoryStatus = "ACTIVE" | "INACTIVE";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
  productCount: number;
};

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  activeCount?: number;
  totalProducts?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};



export const STATUS_VALUES: readonly CategoryStatus[] = ["ACTIVE", "INACTIVE"];

export type CategoryFormState = {
  name: string;
  description: string;
  image: string;
  status: CategoryStatus;
};

export const EMPTY_FORM: CategoryFormState = {
  name: "",
  description: "",
  image: "",
  status: "ACTIVE",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseStatus(value: unknown): CategoryStatus {
  return value === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function parseRow(entry: unknown): AdminCategoryRow {
  const item = (entry ?? {}) as Partial<AdminCategoryRow>;
  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asNullableString(item.description),
    image: asNullableString(item.image),
    status: parseStatus(item.status),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
    productCount: Number(item.productCount ?? 0),
  };
}

export function parseCategoriesPayload(payload: unknown): {
  items: AdminCategoryRow[];
  meta: ApiMeta;
} {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Categories API returned an invalid response.");
  }

  return {
    items: envelope.data.map(parseRow),
    meta: envelope.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}

export type AdminCategoryQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CategoryStatus;
};

/**
 * Fetch a single page of admin categories from the server.
 */
export async function fetchAdminCategoriesPage(
  params: AdminCategoryQueryParams = {},
): Promise<{ items: AdminCategoryRow[]; meta: ApiMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  qs.set("sort", "latest");
  qs.set("withProductCount", "true");
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);

  const response = await fetch(`/api/categories?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to parse categories response.");
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to load categories."));
  }

  return parseCategoriesPayload(payload);
}

type CreateBody = {
  name: string;
  description: string | null;
  image: string | null;
  status: CategoryStatus;
};

export async function createCategory(
  body: CreateBody,
): Promise<AdminCategoryRow> {
  const response = await fetch(`/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to create category."));
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success) {
    throw new Error(readApiError(payload, "Failed to create category."));
  }

  // The create endpoint returns the row without `productCount`.
  return { ...parseRow(envelope.data), productCount: 0 };
}

type UpdateBody = Partial<CreateBody>;

export async function updateCategory(
  categoryId: string,
  body: UpdateBody,
): Promise<AdminCategoryRow> {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to update category."));
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success) {
    throw new Error(readApiError(payload, "Failed to update category."));
  }

  return parseRow(envelope.data);
}

export async function deleteCategory(
  categoryId: string,
): Promise<AdminCategoryRow> {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to deactivate category."));
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success) {
    throw new Error(readApiError(payload, "Failed to deactivate category."));
  }

  return parseRow(envelope.data);
}

export function buildFormFromCategory(
  category: AdminCategoryRow,
): CategoryFormState {
  return {
    name: category.name,
    description: category.description ?? "",
    image: category.image ?? "",
    status: category.status,
  };
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
