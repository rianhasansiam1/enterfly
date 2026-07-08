import { readApiData, readApiError } from "@/features/http/api-envelope";

export type ReviewSource = "CUSTOMER" | "ADMIN";

export type AdminReviewRow = {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  authorImage: string | null;
  authorPhone: string | null;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  source: ReviewSource;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string; slug: string; productCode: string } | null;
};

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  averageRating?: number;
  adminCount?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};



export const REVIEW_SOURCE_VALUES: readonly ReviewSource[] = [
  "CUSTOMER",
  "ADMIN",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseSource(value: unknown): ReviewSource {
  return value === "ADMIN" ? "ADMIN" : "CUSTOMER";
}

function parseProduct(value: unknown): AdminReviewRow["product"] {
  if (value == null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    id: asString(record.id),
    name: asString(record.name),
    slug: asString(record.slug),
    productCode: asString(record.productCode),
  };
}

function parseRow(entry: unknown): AdminReviewRow {
  const item = (entry ?? {}) as Partial<AdminReviewRow> & { product?: unknown };
  return {
    id: asString(item.id),
    productId: asString(item.productId),
    userId: asNullableString(item.userId),
    authorName: asString(item.authorName),
    authorImage: asNullableString(item.authorImage),
    authorPhone: asNullableString(item.authorPhone),
    authorEmail: asNullableString(item.authorEmail),
    rating: Number(item.rating ?? 0),
    title: asNullableString(item.title),
    comment: asNullableString(item.comment),
    source: parseSource(item.source),
    verified: Boolean(item.verified),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
    product: parseProduct(item.product),
  };
}

export function parseReviewsPayload(payload: unknown): {
  items: AdminReviewRow[];
  meta: ApiMeta;
} {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Reviews API returned an invalid response.");
  }

  return {
    items: envelope.data.map(parseRow),
    meta: envelope.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}


export type AdminReviewQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  rating?: number;
  source?: ReviewSource;
};

/**
 * Fetch a single page of admin reviews from the server.
 */
export async function fetchAdminReviewsPage(
  params: AdminReviewQueryParams = {},
): Promise<{ items: AdminReviewRow[]; meta: ApiMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) qs.set("search", params.search);
  if (params.rating) qs.set("rating", String(params.rating));
  if (params.source) qs.set("source", params.source);

  const response = await fetch(`/api/admin/reviews?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to parse reviews response.");
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to load reviews."));
  }

  return parseReviewsPayload(payload);
}

export type CreateAdminReviewPayload = {
  productId: string;
  authorName: string;
  rating: number;
  title?: string;
  comment?: string;
};

export async function createAdminReview(
  payload: CreateAdminReviewPayload,
): Promise<AdminReviewRow> {
  const response = await fetch("/api/admin/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await readApiData<unknown>(
    response,
    "Failed to add the review.",
  );
  return parseRow(data);
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  const response = await fetch(`/api/admin/reviews/${reviewId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      // ignore
    }
    throw new Error(readApiError(payload, "Failed to delete the review."));
  }
}

export function formatDateTime(value: string): string {
  if (!value) return "—";
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
