"use client";

import ProductCard from "@/app/CommonComponents/Cards";
import { Heart, ShoppingCart, Star, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ViewMode } from "./data";

type Props = {
  products: Product[];
  viewMode: ViewMode;
  onClearFilters: () => void;
  wide?: boolean;
  animateFrom?: number;
};

export default function ProductsGrid({
  products,
  viewMode,
  onClearFilters,
  wide,
  animateFrom = 0,
}: Props) {



  if (products.length === 0) {


    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border border-violet-100 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-4">
          <PackageX className="w-10 h-10 text-violet-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          No products found
        </h3>
        <p className="text-sm text-gray-500 mb-5 max-w-md">
          Try adjusting your filters to find what you&apos;re looking for.
        </p>
        <button
          onClick={onClearFilters}
          className="px-5 py-2 text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className={
              idx >= animateFrom ? "animate-in fade-in slide-in-from-bottom-2 duration-500" : undefined
            }
            style={
              idx >= animateFrom
                ? { animationDelay: `${Math.min((idx - animateFrom) * 40, 400)}ms`, animationFillMode: "backwards" }
                : undefined
            }
          >
            <ListItem product={p} />
          </div>
        ))}
      </div>
    );
  }


//main part
  return (
    <div
      className={`grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 transition-[grid-template-columns] duration-300 ease-in-out ${
        wide
          ? "xl:grid-cols-5 lg:grid-cols-4"
          : "xl:grid-cols-4 lg:grid-cols-3"
      }`}
    >
      {products.map((p, idx) => (
        <div
          key={p.id}
          className={
            idx >= animateFrom ? "animate-in fade-in slide-in-from-bottom-3 duration-500" : undefined
          }
          style={
            idx >= animateFrom
              ? { animationDelay: `${Math.min((idx - animateFrom) * 40, 400)}ms`, animationFillMode: "backwards" }
              : undefined
          }
        >
          <ProductCard
            id={p.id}
            name={p.name}
            price={p.discountPrice ?? p.price}
            originalPrice={p.discountPrice ? p.price : undefined}
            image={p.image}
            rating={p.rating}
            reviewCount={p.reviewCount}
            badge={p.badge}
          />
        </div>
      ))}
    </div>
  );
}








function ListItem({ product }: { product: Product }) {

  const finalPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice != null;
  const discount = hasDiscount
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;

  return (
    <div className="group flex gap-3 sm:gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <Link
        href={`/product/${product.id}`}
        className="relative w-28 sm:w-40 md:w-48 aspect-square shrink-0 bg-gray-50 overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 112px, (max-width: 768px) 160px, 192px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-full">
            {product.badge}
          </span>
        ) : (
          discount > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white bg-red-500 rounded-full">
              -{discount}%
            </span>
          )
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2 sm:py-3 pr-3 sm:pr-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/product/${product.id}`} className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 hover:text-violet-700 transition line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          <button
            aria-label="Add to wishlist"
            className="shrink-0 p-1.5 hover:bg-violet-50 rounded-full transition"
          >
            <Heart className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.round(product.rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          ))}
          <span className="text-[11px] text-gray-500 ml-0.5">
            ({product.reviewCount})
          </span>
        </div>

        {/* Description (md+) */}
        {product.description && (
          <p className="hidden md:block text-xs text-gray-600 line-clamp-2 mb-2">
            {product.description}
          </p>
        )}

        {/* Footer: price + cta */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-violet-700">
              ₹{finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.price.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-green-600">
                  {discount}% off
                </span>
              </>
            )}
          </div>
          {product.inStock ? (
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full shadow-sm hover:shadow-md transition">
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
      </div>



    </div>
  );



}
