import { readApiError } from "@/features/http/api-envelope";

export type ProductStatus = "ACTIVE" | "INACTIVE";

export type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  status: ProductStatus;
  stock: number;
  createdAt: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type CategoryOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
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

export type ProductFormState = {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  image: string;
  images: string;
  badge: string;
  status: ProductStatus;
  categoryId: string;
};

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
export const API_PAGE_SIZE = 100;

export const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: "0",
  image: "",
  images: "",
  badge: "",
  status: "ACTIVE",
  categoryId: "",
};

export function parseProductsPayload(payload: unknown): AdminProduct[] {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Products API returned an invalid response.");
  }

  return envelope.data.map((entry) => {
    const item = entry as AdminProduct;
    return {
      ...item,
      status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      image: item.image ?? null,
      description: item.description ?? null,
      discountPrice: item.discountPrice ?? null,
      badge: item.badge ?? null,
      images: Array.isArray(item.images) ? item.images : [],
      category: {
        id: item.category?.id ?? "",
        name: item.category?.name ?? "Uncategorized",
        image: item.category?.image ?? null,
      },
    };
  });
}

export function parseCategoriesPayload(payload: unknown): CategoryOption[] {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Categories API returned an invalid response.");
  }

  return envelope.data
    .map((entry) => {
      const item = entry as { id?: unknown; name?: unknown; status?: unknown };
      if (typeof item.id !== "string" || typeof item.name !== "string") {
        return null;
      }

      return {
        id: item.id,
        name: item.name,
        status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      } satisfies CategoryOption;
    })
    .filter((item): item is CategoryOption => item !== null);
}

export async function fetchAllProductsSnapshot(): Promise<AdminProduct[]> {
  let page = 1;
  let totalPages = 1;
  const merged: AdminProduct[] = [];

  while (page <= totalPages) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(API_PAGE_SIZE),
      sort: "latest",
    });

    const response = await fetch(`/api/products?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      throw new Error("Failed to parse products response.");
    }

    if (!response.ok) {
      throw new Error(readApiError(payload, "Failed to load products."));
    }

    const envelope = payload as ApiEnvelope<unknown>;
    const items = parseProductsPayload(payload);
    merged.push(...items);
    totalPages = envelope.meta?.totalPages ?? 1;
    page += 1;
  }

  return merged;
}

export async function fetchActiveCategories(): Promise<CategoryOption[]> {
  const params = new URLSearchParams({
    status: "ACTIVE",
    page: "1",
    pageSize: String(API_PAGE_SIZE),
    sort: "latest",
  });

  const response = await fetch(`/api/categories?${params.toString()}`, {
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

export function normalizeImagesInput(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

export function buildFormFromProduct(product: AdminProduct): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    price: String(product.price),
    discountPrice:
      typeof product.discountPrice === "number" ? String(product.discountPrice) : "",
    stock: String(product.stock),
    image: product.image ?? "",
    images: product.images.join("\n"),
    badge: product.badge ?? "",
    status: product.status,
    categoryId: product.categoryId,
  };
}

export function parseNumericField(raw: string, field: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return value;
}
