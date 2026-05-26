"use client";

import {
  Bookmark,
  Trash2,
  Truck,
  Tag,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import QuantityStepper from "./QuantityStepper";

type CartItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  variant?: string;
  inStock: boolean;
  deliveryDays?: number;
  perks?: string[];
};

type CartItemCardProps = {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (id: string) => void;
};

export default function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: CartItemCardProps) {
  const hasDiscount =
    typeof item.originalPrice === "number" && item.originalPrice > item.price;
  const lineTotal = item.price * item.quantity;
  const lineSavings = hasDiscount
    ? (item.originalPrice! - item.price) * item.quantity
    : 0;
  const nearMax = item.quantity >= item.maxQuantity;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-md sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <Link
          href={`/products/${item.id}`}
          className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-gray-50 sm:w-32"
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 96px, 128px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hasDiscount && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
              -
              {Math.round(
                ((item.originalPrice! - item.price) / item.originalPrice!) *
                  100,
              )}
              %
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                {item.brand}
              </p>
              <Link
                href={`/products/${item.id}`}
                className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-violet-700 sm:text-base"
              >
                {item.name}
              </Link>
              {item.variant && (
                <p className="mt-1 text-xs text-gray-500">{item.variant}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-base font-extrabold text-violet-700 sm:text-lg">
                BDT {lineTotal.toLocaleString()}
              </p>
              {hasDiscount && (
                <p className="text-xs text-gray-400 line-through">
                  BDT {(item.originalPrice! * item.quantity).toLocaleString()}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-500">
                BDT {item.price.toLocaleString()} each
              </p>
            </div>
          </div>

          {/* Perks */}
          {(item.perks?.length || item.deliveryDays) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {item.deliveryDays && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <Truck className="h-3 w-3" />
                  {item.deliveryDays}-day delivery
                </span>
              )}
              {item.perks?.map((perk) => (
                <span
                  key={perk}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700"
                >
                  <Sparkles className="h-3 w-3" />
                  {perk}
                </span>
              ))}
            </div>
          )}

          {hasDiscount && (
            <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Tag className="h-3 w-3" />
              You&apos;re saving BDT {lineSavings.toLocaleString()}
            </p>
          )}

          {/* Bottom row: quantity + actions */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={item.quantity}
                min={1}
                max={item.maxQuantity}
                onChange={(q) => onQuantityChange(item.id, q)}
              />
              {nearMax && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  Max {item.maxQuantity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSaveForLater(item.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save for later</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label="Remove from cart"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
