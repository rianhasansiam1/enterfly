"use client";

import ProductCard from "@/components/product/ProductCard";
import { Heart, ShoppingCart, Star, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setCartData, setCartError as setCartErrorAction } from "@/store/slices/cart.slice";
import type { AppDispatch } from "@/store";
import {
  canUseServerCart,
  createCartItemOnServer,
  fetchServerCartSnapshot,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  DEFAULT_CART_STOCK,
  readLocalCart,
  upsertLocalCartItem,
  writeLocalCart,
} from "@/features/cart/storage";
import type { CartItem } from "@/features/cart/api";
import type { Product } from "@/features/products/api";

type ViewMode = "grid" | "list";

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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <PackageX className="h-10 w-10 text-violet-600" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          No products found
        </h3>
        <p className="mb-5 max-w-md text-sm text-gray-500">
          Try adjusting your filters to find what you&apos;re looking for.
        </p>
        <button
          onClick={onClearFilters}
          className="rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg"
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
              idx >= animateFrom
                ? "animate-in fade-in slide-in-from-bottom-2 duration-500"
                : undefined
            }
            style={
              idx >= animateFrom
                ? {
                    animationDelay: `${Math.min((idx - animateFrom) * 40, 400)}ms`,
                    animationFillMode: "backwards",
                  }
                : undefined
            }
          >
            <ListItem product={p} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 transition-[grid-template-columns] duration-300 ease-in-out sm:grid-cols-3 sm:gap-4 md:grid-cols-3 ${
        wide ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-3 xl:grid-cols-4"
      }`}
    >
      {products.map((p, idx) => (
        <div
          key={p.id}
          className={
            idx >= animateFrom
              ? "animate-in fade-in slide-in-from-bottom-3 duration-500"
              : undefined
          }
          style={
            idx >= animateFrom
              ? {
                  animationDelay: `${Math.min((idx - animateFrom) * 40, 400)}ms`,
                  animationFillMode: "backwards",
                }
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
            badge={p.badge ?? undefined}
          />
        </div>
      ))}
    </div>
  );
}

function ListItem({ product }: { product: Product }) {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const [isCartBusy, setIsCartBusy] = useState(false);

  const finalPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice != null;
  const discount = hasDiscount
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (isCartBusy) return;

    const canUseServer = canUseServerCart(session?.user?.role, status);

    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(product.id);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add item to cart.";
        dispatch(setCartErrorAction(message));
      } finally {
        setIsCartBusy(false);
      }
      return;
    }

    const localBefore = readLocalCart();
    const optimisticItem: CartItem = {
      id: `local:${product.id}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity: 1,
      unitPrice: finalPrice,
      originalPrice: hasDiscount ? product.price : finalPrice,
      lineTotal: finalPrice,
      stock: Math.max(DEFAULT_CART_STOCK, product.stock),
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
  };

  return (
    <div className="group flex gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-md sm:gap-4">
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square w-28 shrink-0 overflow-hidden bg-gray-50 sm:w-40 md:w-48"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 112px, (max-width: 768px) 160px, 192px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-2 top-2 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            {product.badge}
          </span>
        ) : (
          discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              -{discount}%
            </span>
          )
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-2 pr-3 sm:py-3 sm:pr-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition hover:text-violet-700 sm:text-base">
              {product.name}
            </h3>
          </Link>
          <button
            aria-label="Add to wishlist"
            className="shrink-0 rounded-full p-1.5 transition hover:bg-violet-50"
          >
            <Heart className="h-4 w-4 text-gray-500 transition-colors hover:text-red-500" />
          </button>
        </div>

        <div className="mb-1 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.round(product.rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          ))}
          <span className="ml-0.5 text-[11px] text-gray-500">
            ({product.reviewCount})
          </span>
        </div>

        {product.description && (
          <p className="mb-2 hidden line-clamp-2 text-xs text-gray-600 md:block">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-base font-bold text-violet-700 sm:text-lg">
              BDT {finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  BDT {product.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-green-600 sm:text-xs">
                  {discount}% off
                </span>
              </>
            )}
          </div>
          {product.inStock ? (
            <button
              type="button"
              onClick={() => {
                void handleAddToCart();
              }}
              disabled={isCartBusy}
              className="hidden items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          ) : (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
