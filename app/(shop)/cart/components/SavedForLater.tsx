"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";

type SavedItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
};

type SavedForLaterProps = {
  items: SavedItem[];
  onMoveToCart: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function SavedForLater({
  items,
  onMoveToCart,
  onRemove,
}: SavedForLaterProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            Saved for later
          </h2>
          <p className="text-xs text-gray-500">
            {items.length} item{items.length === 1 ? "" : "s"} parked for next
            time
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.article
              key={item.id}
              layout
              initial="initial"
              animate="animate"
              exit="exit"
              variants={LIST_ITEM_VARIANTS}
              transition={LIST_ITEM_TRANSITION}
              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative block aspect-square overflow-hidden bg-gray-50"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className={cn(
                    "object-cover transition-transform duration-500 group-hover:scale-110",
                    !item.inStock && "grayscale",
                  )}
                />
                {!item.inStock && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
                    Out of stock
                  </div>
                )}
              </Link>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label="Remove from saved items"
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-gray-600 shadow backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                  {item.brand}
                </p>
                <Link
                  href={`/products/${item.slug}`}
                  className="mt-0.5 line-clamp-1 text-xs font-semibold text-gray-900 hover:text-violet-700"
                >
                  {item.name}
                </Link>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-violet-700">
                    BDT {item.price.toLocaleString()}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      BDT {item.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!item.inStock}
                  onClick={() => onMoveToCart(item.id)}
                  className={cn(
                    "mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-200",
                    item.inStock
                      ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                      : "cursor-not-allowed bg-gray-50 text-gray-400",
                  )}
                >
                  <ShoppingCart className="h-3 w-3" />
                  {item.inStock ? "Move to cart" : "Notify me"}
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
