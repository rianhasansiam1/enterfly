import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/service-error";
import type {
  AddWishlistItemInput,
  SyncWishlistInput,
} from "@/lib/validations/wishlist.validation";

export class WishlistError extends ServiceError {
  constructor(
    status: number,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(status, message, details);
    this.name = "WishlistError";
  }
}

const wishlistInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
      variants: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { price: true, salePrice: true, stock: true },
      },
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
  slug: string;
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

function effectivePrice(variant: {
  price: Prisma.Decimal;
  salePrice: Prisma.Decimal | null;
}) {
  const price = variant.price.toNumber();
  const sale = variant.salePrice?.toNumber() ?? null;
  return sale != null && sale < price ? sale : price;
}

function toWishlistUiItem(row: WishlistWithProduct): WishlistUiItem {
  const variant = row.product.variants[0];
  const listPrice = variant ? variant.price.toNumber() : 0;
  const currentPrice = variant ? effectivePrice(variant) : 0;
  const hasValidDiscount = currentPrice < listPrice;
  const stock = variant?.stock ?? 0;

  return {
    id: row.product.id,
    slug: row.product.slug,
    name: row.product.name,
    brand: row.product.category.name,
    image: row.product.images[0]?.url ?? FALLBACK_PRODUCT_IMAGE,
    price: currentPrice,
    originalPrice: hasValidDiscount ? listPrice : undefined,
    // rating/reviewCount/badge were dropped in the variant migration.
    rating: 0,
    reviewCount: 0,
    category: row.product.category.name,
    inStock: row.product.status === "ACTIVE" && stock > 0,
    addedAt: row.createdAt.toISOString(),
    badge: undefined,
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

