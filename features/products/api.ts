import { readApiError } from "@/features/http/api-envelope";

export type Product = {
  id: string;
  slug: string;
  productCode: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  categoryId: string;
  category: string;
  categoryImage: string | null;
  brand?: string;
  stock: number;
  inStock: boolean;
  variantCount: number;
  createdAt: string;
};

export type ApiProduct = {
  id: string;
  slug: string;
  productCode: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  status: "ACTIVE" | "INACTIVE";
  stock: number;
  createdAt: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/** Query params accepted by `GET /api/products`. */
export type ProductQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  inStock?: boolean;
  status?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};

export type PaginatedProductsResponse = {
  items: Product[];
  meta: ApiMeta;
};

/** Lightweight category row for filter sidebar. */
export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
};

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
const API_PAGE_SIZE = 100;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const out: string[] = [];
  for (const entry of value) {
    const direct = readString(entry);
    if (direct) {
      out.push(direct);
      continue;
    }
    const nested = asRecord(entry);
    const url = nested ? readString(nested.url) : null;
    if (url) out.push(url);
  }
  return out;
}

function readCategory(
  row: UnknownRecord,
): { id: string; name: string; image: string | null } {
  const categoryRaw = row.category;
  const categoryRecord = asRecord(categoryRaw);
  const categoryIdFromRow = readString(row.categoryId) ?? "";

  if (categoryRecord) {
    return {
      id: readString(categoryRecord.id) ?? categoryIdFromRow,
      name: readString(categoryRecord.name) ?? "Uncategorized",
      image: readString(categoryRecord.image),
    };
  }

  if (typeof categoryRaw === "string" && categoryRaw.trim().length > 0) {
    return { id: categoryIdFromRow, name: categoryRaw, image: null };
  }

  return { id: categoryIdFromRow, name: "Uncategorized", image: null };
}

function mapApiProduct(item: unknown): Product {
  const row = asRecord(item);
  if (!row) {
    throw new Error("Products API returned an invalid product row.");
  }

  const category = readCategory(row);
  const images = readStringArray(row.images);
  const fallbackImage = readString(row.image) ?? images[0] ?? FALLBACK_PRODUCT_IMAGE;
  const status = row.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  const price = readNumber(row.price) ?? 0;
  const discountPrice = readNumber(row.discountPrice);
  const stock = readNumber(row.stock) ?? 0;
  const variantCount =
    Array.isArray(row.variants) ? row.variants.length : readNumber(row.variantCount) ?? 1;

  return {
    id: readString(row.id) ?? "",
    slug: readString(row.slug) ?? "",
    productCode: readString(row.productCode) ?? "",
    name: readString(row.name) ?? "Untitled Product",
    description: readString(row.description),
    price,
    discountPrice,
    image: fallbackImage,
    images,
    rating: readNumber(row.rating) ?? 0,
    reviewCount: readNumber(row.reviewCount) ?? 0,
    badge: readString(row.badge),
    categoryId: readString(row.categoryId) ?? category.id,
    category: category.name,
    categoryImage: category.image,
    stock,
    inStock: stock > 0 && status === "ACTIVE",
    variantCount,
    createdAt: readString(row.createdAt) ?? new Date(0).toISOString(),
    brand: readString(row.brand) ?? undefined,
  };
}

/**
 * Lightweight search used by the navbar live dropdown.
 *
 * Hits the same public listing endpoint with `search` + `status=ACTIVE`,
 * but only pulls the first small page since the dropdown shows a preview.
 * Accepts an `AbortSignal` so callers can cancel stale keystrokes.
 */
export async function searchProductsFromApi(
  query: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<Product[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const params = new URLSearchParams({
    status: "ACTIVE",
    search: trimmed,
    page: "1",
    limit: String(options?.limit ?? 6),
    sort: "latest",
  });

  const response = await fetch(`/api/products?${params.toString()}`, {
    signal: options?.signal,
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to search products.");
  }
  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to search products."));
  }

  const envelope = payload as ApiResponse<unknown>;
  if (!envelope.success || !Array.isArray(envelope.data)) {
    throw new Error("Products API returned an unexpected response.");
  }

  return envelope.data.map(mapApiProduct);
}

/**
 * Fetch a single page of products with server-side filtering and sorting.
 *
 * This is the primary function used by the public product listing page.
 * Only the current page of items is fetched — no client-side catalog.
 */
export async function fetchProductsPage(
  queryParams: ProductQueryParams,
  options?: { signal?: AbortSignal },
): Promise<PaginatedProductsResponse> {
  const params = new URLSearchParams();

  // Only append non-default / non-empty params.
  if (queryParams.page != null && queryParams.page > 1) {
    params.set("page", String(queryParams.page));
  }
  if (queryParams.limit != null) params.set("limit", String(queryParams.limit));
  if (queryParams.search) params.set("search", queryParams.search);
  if (queryParams.category) params.set("category", queryParams.category);
  if (queryParams.categoryId) params.set("categoryId", queryParams.categoryId);
  if (queryParams.minPrice != null) params.set("minPrice", String(queryParams.minPrice));
  if (queryParams.maxPrice != null) params.set("maxPrice", String(queryParams.maxPrice));
  if (queryParams.sort) params.set("sort", queryParams.sort);
  if (queryParams.inStock) params.set("inStock", "true");
  if (queryParams.status) params.set("status", queryParams.status);

  // Always request only ACTIVE products for public listing.
  if (!queryParams.status) params.set("status", "ACTIVE");

  const response = await fetch(`/api/products?${params.toString()}`, {
    signal: options?.signal,
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to fetch products.");
  }
  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to fetch products."));
  }

  const envelope = payload as ApiResponse<unknown>;
  if (!envelope.success || !Array.isArray(envelope.data)) {
    throw new Error("Products API returned an unexpected response.");
  }

  const meta = envelope.meta ?? {
    page: 1,
    limit: queryParams.limit ?? 12,
    total: envelope.data.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return {
    items: envelope.data.map(mapApiProduct),
    meta,
  };
}

/**
 * Fetch active categories for the filter sidebar.
 *
 * Uses the existing `/api/categories` endpoint. Only fetches active
 * categories with a large page size to get them all in one call.
 */
export async function fetchCategories(
  options?: { signal?: AbortSignal },
): Promise<CategoryOption[]> {
  const params = new URLSearchParams({
    status: "ACTIVE",
    pageSize: "100",
    sort: "name-asc",
  });

  const response = await fetch(`/api/categories?${params.toString()}`, {
    signal: options?.signal,
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    return [];
  }
  if (!response.ok) return [];

  const envelope = payload as ApiResponse<unknown>;
  if (!envelope.success || !Array.isArray(envelope.data)) return [];

  return envelope.data
    .map((item: unknown) => {
      const row = asRecord(item);
      if (!row) return null;
      return {
        id: readString(row.id) ?? "",
        name: readString(row.name) ?? "Unknown",
        slug: readString(row.slug) ?? "",
        image: readString(row.image),
      };
    })
    .filter((c): c is CategoryOption => c !== null && c.slug.length > 0);
}

export async function fetchAllActiveProductsFromApi(): Promise<Product[]> {
  let page = 1;
  let totalPages = 1;
  const merged: Product[] = [];

  while (page <= totalPages) {
    const params = new URLSearchParams({
      status: "ACTIVE",
      page: String(page),
      limit: String(API_PAGE_SIZE),
      sort: "latest",
    });

    const response = await fetch(`/api/products?${params.toString()}`);
    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      throw new Error("Failed to fetch products.");
    }
    if (!response.ok) {
      throw new Error(readApiError(payload, "Failed to fetch products."));
    }

    const envelope = payload as ApiResponse<unknown>;
    if (!envelope.success || !Array.isArray(envelope.data)) {
      throw new Error("Products API returned an unexpected response.");
    }

    merged.push(...envelope.data.map(mapApiProduct));
    totalPages = envelope.meta?.totalPages ?? 1;
    page += 1;
  }

  return merged;
}
