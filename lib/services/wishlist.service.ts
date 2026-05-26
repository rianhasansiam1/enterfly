import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  AddWishlistItemInput,
  SyncWishlistInput,
} from "@/lib/validations/wishlist.validation";

export class WishlistError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "WishlistError";
    this.status = status;
    this.details = details;
  }
}

const wishlistInclude = {
  product: {
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      discountPrice: true,
      rating: true,
      reviewCount: true,
      badge: true,
      stock: true,
      status: true,
      category: {
        select: { name: true },
      },
    },
  },
} satisfies Prisma.WishlistInclude;

type WishlistWithProduct = Prisma.WishlistGetPayload<{
  include: typeof wishlistInclude;
}>;

export type WishlistUiItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  inStock: boolean;
  addedAt: string;
  priceDropFromAdded?: number;
  badge?: string;
};

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

function effectivePrice(product: { price: number; discountPrice: number | null }) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
}

function toWishlistUiItem(row: WishlistWithProduct): WishlistUiItem {
  const currentPrice = effectivePrice(row.product);
  const hasValidDiscount =
    row.product.discountPrice != null && row.product.discountPrice < row.product.price;

  return {
    id: row.product.id,
    name: row.product.name,
    brand: row.product.category.name,
    image: row.product.image ?? FALLBACK_PRODUCT_IMAGE,
    price: currentPrice,
    originalPrice: hasValidDiscount ? row.product.price : undefined,
    rating: row.product.rating,
    reviewCount: row.product.reviewCount,
    category: row.product.category.name,
    inStock: row.product.status === "ACTIVE" && row.product.stock > 0,
    addedAt: row.createdAt.toISOString(),
    badge: row.product.badge ?? undefined,
  };
}

export async function getMyWishlist(userId: string): Promise<WishlistUiItem[]> {
  const rows = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: wishlistInclude,
  });

  return rows.map(toWishlistUiItem);
}

export async function addWishlistItem(
  userId: string,
  input: AddWishlistItemInput,
): Promise<WishlistUiItem> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, name: true, status: true },
  });

  if (!product) {
    throw new WishlistError(404, "Product not found.");
  }
  if (product.status !== "ACTIVE") {
    throw new WishlistError(409, `"${product.name}" is no longer available.`);
  }

  const row = await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
    create: {
      userId,
      productId: product.id,
    },
    update: {},
    include: wishlistInclude,
  });

  return toWishlistUiItem(row);
}

export async function removeWishlistItemByProduct(
  userId: string,
  productId: string,
): Promise<{ id: string }> {
  const result = await prisma.wishlist.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  if (result.count === 0) {
    throw new WishlistError(404, "Wishlist item not found.");
  }

  return { id: productId };
}

export async function clearMyWishlist(userId: string): Promise<{ deletedCount: number }> {
  const result = await prisma.wishlist.deleteMany({ where: { userId } });
  return { deletedCount: result.count };
}

export async function syncWishlistProducts(
  userId: string,
  input: SyncWishlistInput,
): Promise<WishlistUiItem[]> {
  const productIds = Array.from(new Set(input.productIds));
  if (productIds.length === 0) {
    return getMyWishlist(userId);
  }

  const activeProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (activeProducts.length > 0) {
    await prisma.wishlist.createMany({
      data: activeProducts.map((product) => ({
        userId,
        productId: product.id,
      })),
      skipDuplicates: true,
    });
  }

  return getMyWishlist(userId);
}

