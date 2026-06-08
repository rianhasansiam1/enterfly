import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";

type HomeCategoryProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge: string | null;
  variantCount: number;
};

type HomeCategoryBanner = {
  id: string;
  image: string;
  label: string;
  heading: string;
  discount: string;
  description: string;
  link: string | null;
};

type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  products: HomeCategoryProduct[];
  categoryBanner: HomeCategoryBanner | null;
};

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
const DEFAULT_CATEGORY_LIMIT = 6;
const DEFAULT_PRODUCTS_PER_CATEGORY = 8;

const getCachedHomeCategories = unstable_cache(
  async (
    categoryLimit: number,
    productsPerCategory: number,
  ): Promise<HomeCategory[]> => {

    
    const categories = await prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: categoryLimit,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        products: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: productsPerCategory,
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            salePrice: true,
            discountPrice: true,
            _count: { select: { variants: true } },
            images: {
              orderBy: { position: "asc" },
              select: { url: true },
            },
          },
        },
        // Category banners now live in the unified Banner model,
        // discriminated by `type` with label/heading/discount in metadata.
        banners: {
          where: { type: "CATEGORY", status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            image: true,
            description: true,
            link: true,
            metadata: true,
          },
        },
      },
    });

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        products: category.products.map((product) => {
          const price = product.salePrice.toNumber();
          const sale = product.discountPrice?.toNumber() ?? null;
          const discountPrice = sale != null && sale < price ? sale : null;
          const imageUrls = product.images.map((img) => img.url);
          return {
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description,
            price,
            discountPrice,
            image: imageUrls[0] ?? FALLBACK_PRODUCT_IMAGE,
            images: imageUrls,
            variantCount: product._count.variants,
            // rating/reviewCount/badge were dropped in the variant
            // migration; default them so the UI keeps rendering.
            rating: 0,
            reviewCount: 0,
            badge: null,
          };
        }),
        categoryBanner: (() => {
          const banner = category.banners[0];
          if (banner === undefined) return null;
          const meta =
            banner.metadata &&
            typeof banner.metadata === "object" &&
            !Array.isArray(banner.metadata)
              ? (banner.metadata as Record<string, unknown>)
              : {};
          const str = (key: string) =>
            typeof meta[key] === "string" ? (meta[key] as string) : "";
          return {
            id: banner.id,
            image: banner.image ?? "",
            label: str("label"),
            heading: str("heading"),
            discount: str("discount"),
            description: banner.description ?? "",
            link: banner.link,
          };
        })(),
      }))
      .filter((category) => category.products.length > 0);
  },
  ["home-categories"],
  { revalidate: 300, tags: ["home-categories"] },
);

export function getHomeCategories(options?: {
  categoryLimit?: number;
  productsPerCategory?: number;
}) {
  const categoryLimit = options?.categoryLimit ?? DEFAULT_CATEGORY_LIMIT;
  const productsPerCategory =
    options?.productsPerCategory ?? DEFAULT_PRODUCTS_PER_CATEGORY;

  return getCachedHomeCategories(categoryLimit, productsPerCategory);
}
