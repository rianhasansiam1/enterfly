"use client";

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

import ProductCard from "@/components/product/ProductCard";
import { setHomeCategories } from "@/store/slices/home-categories.slice";
import type { AppDispatch, RootState } from "@/store";

import { CategoriesBanner } from "./CategoriesBanner";

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

type CategoriesProps = {
  initialCategories: HomeCategory[];
};

export default function Categories({ initialCategories }: CategoriesProps) {
  const dispatch = useDispatch<AppDispatch>();
  const categoriesFromStore = useSelector(
    (state: RootState) => state.homeCategories.items,
  );

  useEffect(() => {
    dispatch(setHomeCategories(initialCategories));
  }, [dispatch, initialCategories]);

  const categories =
    categoriesFromStore.length > 0 ? categoriesFromStore : initialCategories;

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
        No categories available right now.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map((category, index) => (
        <section key={category.id} className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="transition-colors hover:text-violet-700"
                  >
                    {category.name}
                  </Link>
                </h2>
                <p className="hidden text-xs text-gray-500 sm:block">
                  {category.products.length} products available
                </p>
              </div>
            </div>

            <Link
              href={`/categories/${category.slug}`}
              className="group flex items-center gap-1 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-800"
            >
              View All
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mb-4 h-0.5 rounded-full bg-linear-to-r from-violet-500 via-purple-400 to-transparent" />

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {category.products.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  name={item.name}
                  price={item.discountPrice ?? item.price}
                  originalPrice={
                    item.discountPrice != null ? item.price : undefined
                  }
                  image={item.image}
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                  badge={item.badge ?? undefined}
                  variantCount={item.variantCount}
                />
              ))}
            </div>

            {category.categoryBanner && (
              <CategoriesBanner
                saleBanner={{
                  image: category.categoryBanner.image,
                  label: category.categoryBanner.label,
                  heading: category.categoryBanner.heading,
                  discount: category.categoryBanner.discount,
                  description: category.categoryBanner.description,
                }}
              />
            )}
          </div>

          <div className="mt-5 text-center">
            <Link
              href={`/categories/${category.slug}`}
              className="inline-block rounded-full bg-linear-to-r from-violet-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-purple-600 hover:shadow-lg"
            >
              Load More Products
            </Link>
          </div>

          {index < categories.length - 1 && (
            <div className="mt-8 border-b border-gray-100" />
          )}
        </section>
      ))}
    </div>
  );
}
