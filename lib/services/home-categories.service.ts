import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

type HomeCategoryProduct = {
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
        image: true,
        products: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: productsPerCategory,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discountPrice: true,
            image: true,
            images: true,
            rating: true,
            reviewCount: true,
            badge: true,
          },
        },
        categoryBanners: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            image: true,
            label: true,
            heading: true,
            discount: true,
            description: true,
            link: true,
          },
        },
      },
    });

    return categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          image: product.image ?? FALLBACK_PRODUCT_IMAGE,
          images: product.images,
          rating: product.rating,
          reviewCount: product.reviewCount,
          badge: product.badge,
        })),
        categoryBanner:
          category.categoryBanners[0] !== undefined
            ? {
                id: category.categoryBanners[0].id,
                image: category.categoryBanners[0].image,
                label: category.categoryBanners[0].label,
                heading: category.categoryBanners[0].heading,
                discount: category.categoryBanners[0].discount,
                description: category.categoryBanners[0].description,
                link: category.categoryBanners[0].link,
              }
            : null,
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
