"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
};

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating = 0,
  reviewCount = 0,
  badge,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
        <Link href={`/product/${id}`}>
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </Link>

        {/* Badge */}
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-full">
            {badge}
          </span>
        )}

        {/* Discount Badge */}
        {discount > 0 && !badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white bg-red-500 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-500 hover:text-red-400"
            }`}
          />
        </button>

        {/* Add to Cart - appears on hover */}
        <button
          aria-label="Add to cart"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-violet-700 font-semibold text-xs rounded-full shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-violet-600 hover:text-white"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Content Section */}
      <div className="p-2 sm:p-2.5">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-0.5 mb-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 ml-0.5">({reviewCount})</span>
          </div>
        )}

        {/* Product Name */}
        <Link href={`/product/${id}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1 hover:text-violet-700 transition-colors leading-tight">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-violet-700">
            ₹{price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-[11px] text-gray-400 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
