import { readApiError } from "@/features/http/api-envelope";

export type ProductStatus = "ACTIVE" | "INACTIVE";

export type AdminProduct = {
  id: string;
  productCode: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  color: string | null;
  size: string | null;
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
  color: string;
  size: string;
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
  color: "",
  size: "",
  status: "ACTIVE",
  categoryId: "",
};

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

export function parseProductsPayload(payload: unknown): AdminProduct[] {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Products API returned an invalid response.");
  }

  return envelope.data.map((entry) => {
    const row = asRecord(entry);
    if (!row) {
      throw new Error("Products API returned an invalid product row.");
    }

    const category = readCategory(row);
    const images = readStringArray(row.images);
    const image = readString(row.image) ?? images[0] ?? null;
    const price = readNumber(row.price) ?? 0;
    const discountPrice = readNumber(row.discountPrice);
    const stock = readNumber(row.stock) ?? 0;

    // color comes from the primary variant; size is collected from ALL
    // variants and joined so the admin edit form shows the full set
    // (e.g. "S, M, L") that was originally entered.
    const variantsArr = Array.isArray(row.variants) ? row.variants : [];
    const primaryVariant = asRecord(variantsArr[0]);
    const color = primaryVariant ? readString(primaryVariant.color) : null;

    // Collect unique sizes from all variants, preserving order.
    const allSizes: string[] = [];
    const seenSizes = new Set<string>();
    for (const v of variantsArr) {
      const vRec = asRecord(v);
      const s = vRec ? readString(vRec.size) : null;
      if (s && !seenSizes.has(s)) {
        seenSizes.add(s);
        allSizes.push(s);
      }
    }
    const size = allSizes.length > 0 ? allSizes.join(", ") : null;

    return {
      id: readString(row.id) ?? "",
      productCode: readString(row.productCode) ?? "",
      name: readString(row.name) ?? "Untitled Product",
      description: readString(row.description),
      price,
      discountPrice,
      image,
      images,
      rating: readNumber(row.rating) ?? 0,
      reviewCount: readNumber(row.reviewCount) ?? 0,
      color,
      size,
      status: row.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      stock,
      createdAt: readString(row.createdAt) ?? new Date(0).toISOString(),
      categoryId: readString(row.categoryId) ?? category.id,
      category,
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
    color: product.color ?? "",
    size: product.size ?? "",
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
