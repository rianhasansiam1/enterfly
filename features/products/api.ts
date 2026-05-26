import { readApiError } from "@/features/http/api-envelope";

export type Product = {
  id: string;
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
  createdAt: string;
};

export type ApiProduct = {
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
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
const API_PAGE_SIZE = 100;

function mapApiProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    discountPrice: item.discountPrice,
    image: item.image ?? FALLBACK_PRODUCT_IMAGE,
    images: item.images,
    rating: item.rating,
    reviewCount: item.reviewCount,
    badge: item.badge,
    categoryId: item.categoryId,
    category: item.category.name,
    categoryImage: item.category.image,
    stock: item.stock,
    inStock: item.stock > 0 && item.status === "ACTIVE",
    createdAt: item.createdAt,
  };
}

export async function fetchAllActiveProductsFromApi(): Promise<Product[]> {
  let page = 1;
  let totalPages = 1;
  const merged: Product[] = [];

  while (page <= totalPages) {
    const params = new URLSearchParams({
      status: "ACTIVE",
      page: String(page),
      pageSize: String(API_PAGE_SIZE),
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

    const envelope = payload as ApiResponse<ApiProduct[]>;
    if (!envelope.success || !Array.isArray(envelope.data)) {
      throw new Error("Products API returned an unexpected response.");
    }

    merged.push(...envelope.data.map(mapApiProduct));
    totalPages = envelope.meta?.totalPages ?? 1;
    page += 1;
  }

  return merged;
}
