"use client";

import {
  Heart,
  ShoppingCart,
  Star,
  Trash2,
  TrendingDown,
  Share2,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type WishlistItem = {
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

type WishlistView = "grid" | "list";

type WishlistCardProps = {
  item: WishlistItem;
  view: WishlistView;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveToCart: (id: string) => void;
  onShare: (id: string) => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function WishlistCard({
  item,
  view,
  selected,
  onToggleSelect,
  onRemove,
  onMoveToCart,
  onShare,
}: WishlistCardProps) {
  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  const hasPriceDrop =
    typeof item.priceDropFromAdded === "number" && item.priceDropFromAdded > 0;

  if (view === "list") {
    return (
      <article
        className={cn(
          "group relative flex gap-4 rounded-2xl border bg-white p-3 shadow-sm transition-all duration-300 sm:p-4",
          selected
            ? "border-violet-500 ring-2 ring-violet-200"
            : "border-gray-100 hover:border-violet-200 hover:shadow-md",
        )}
      >
        <SelectCheckbox
          selected={selected}
          onToggle={() => onToggleSelect(item.id)}
        />

        <Link
          href={`/productDetails/${item.id}`}
          className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50 sm:w-32"
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 96px, 128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!item.inStock && (
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-[11px] font-semibold uppercase tracking-wide text-white">
              Out of stock
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
                {item.brand} • {item.category}
              </p>
              <Link
                href={`/productDetails/${item.id}`}
                className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-violet-700 sm:text-base"
              >
                {item.name}
              </Link>
            </div>
            <Badges item={item} discount={discount} />
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <RatingStars rating={item.rating} />
            <span>({item.reviewCount.toLocaleString()})</span>
            <span aria-hidden>•</span>
            <span>Saved {timeAgo(item.addedAt)}</span>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
            <PriceBlock item={item} hasPriceDrop={hasPriceDrop} />
            <ActionButtons
              inStock={item.inStock}
              onRemove={() => onRemove(item.id)}
              onMoveToCart={() => onMoveToCart(item.id)}
              onShare={() => onShare(item.id)}
            />
          </div>
        </div>
      </article>
    );
  }

  // Grid view
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300",
        selected
          ? "border-violet-500 ring-2 ring-violet-200"
          : "border-gray-100 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl",
      )}
    >
      {/* Image */}
      <div className="relative aspect-4/5 overflow-hidden bg-gray-50">
        <Link href={`/productDetails/${item.id}`}>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover:scale-110",
              !item.inStock && "grayscale",
            )}
          />
        </Link>

        {/* Top row: select + remove + share */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <SelectCheckbox
            selected={selected}
            onToggle={() => onToggleSelect(item.id)}
          />
          <div className="flex flex-col gap-1.5">
            <IconAction
              label="Share"
              onClick={() => onShare(item.id)}
              tone="neutral"
            >
              <Share2 className="h-4 w-4" />
            </IconAction>
            <IconAction
              label="Remove from wishlist"
              onClick={() => onRemove(item.id)}
              tone="danger"
            >
              <Trash2 className="h-4 w-4" />
            </IconAction>
          </div>
        </div>

        {/* Badges (left) */}
        <div className="pointer-events-none absolute left-2.5 top-12 flex flex-col gap-1.5">
          {item.badge && (
            <span className="rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
              {item.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              -{discount}%
            </span>
          )}
        </div>

        {hasPriceDrop && (
          <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
            <TrendingDown className="h-3 w-3" />
            Dropped BDT {item.priceDropFromAdded?.toLocaleString()}
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400 opacity-60" />
          </div>
        )}

        {!item.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Out of stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600">
          {item.brand} • {item.category}
        </p>
        <Link href={`/productDetails/${item.id}`}>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-tight text-gray-900 transition-colors hover:text-violet-700">
            {item.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
          <RatingStars rating={item.rating} />
          <span>({item.reviewCount.toLocaleString()})</span>
        </div>

        <div className="mt-auto pt-3">
          <PriceBlock item={item} hasPriceDrop={hasPriceDrop} />
          <p className="mt-1 text-[11px] text-gray-400">
            Saved {timeAgo(item.addedAt)}
          </p>

          <button
            type="button"
            disabled={!item.inStock}
            onClick={() => onMoveToCart(item.id)}
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
              item.inStock
                ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md"
                : "cursor-not-allowed bg-gray-100 text-gray-400",
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            {item.inStock ? "Move to cart" : "Notify me"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* -------------------- Sub-components -------------------- */

function Badges({
  item,
  discount,
}: {
  item: WishlistItem;
  discount: number;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {item.badge && (
        <span className="rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {item.badge}
        </span>
      )}
      {discount > 0 && (
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
          -{discount}%
        </span>
      )}
    </div>
  );
}

function PriceBlock({
  item,
  hasPriceDrop,
}: {
  item: WishlistItem;
  hasPriceDrop: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-base font-extrabold text-violet-700 sm:text-lg">
        BDT {item.price.toLocaleString()}
      </span>
      {item.originalPrice && item.originalPrice > item.price && (
        <span className="text-xs text-gray-400 line-through">
          BDT {item.originalPrice.toLocaleString()}
        </span>
      )}
      {hasPriceDrop && (
        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          <TrendingDown className="h-3 w-3" />
          Drop
        </span>
      )}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200",
          )}
        />
      ))}
    </div>
  );
}

function SelectCheckbox({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={selected ? "Deselect item" : "Select item"}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-lg border-2 backdrop-blur-md transition-all duration-200",
        selected
          ? "border-violet-600 bg-violet-600 text-white shadow-md"
          : "border-white/80 bg-white/70 text-transparent hover:border-violet-400 hover:text-violet-400",
      )}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

function IconAction({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "neutral" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95",
        tone === "danger"
          ? "text-rose-600 hover:bg-rose-50"
          : "text-gray-600 hover:bg-violet-50 hover:text-violet-700",
      )}
    >
      {children}
    </button>
  );
}

function ActionButtons({
  inStock,
  onRemove,
  onMoveToCart,
  onShare,
}: {
  inStock: boolean;
  onRemove: () => void;
  onMoveToCart: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        aria-label="Share"
        className="grid h-9 w-9 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from wishlist"
        className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
      >
        <Heart className="h-4 w-4 fill-current" />
      </button>
      <button
        type="button"
        disabled={!inStock}
        onClick={onMoveToCart}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all duration-200",
          inStock
            ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            : "cursor-not-allowed bg-gray-100 text-gray-400",
        )}
      >
        <ShoppingCart className="h-4 w-4" />
        {inStock ? "Add to cart" : "Notify"}
      </button>
    </div>
  );
}
