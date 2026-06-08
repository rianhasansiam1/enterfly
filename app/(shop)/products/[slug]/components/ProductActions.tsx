"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap, Ruler } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";

import {
  setCartData,
  setCartError as setCartErrorAction,
} from "@/store/slices/cart.slice";
import type { AppDispatch } from "@/store";
import {
  canUseServerCart,
  createCartItemOnServer,
  fetchServerCartSnapshot,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  readLocalCart,
  upsertLocalCartItem,
  writeLocalCart,
} from "@/features/cart/storage";
import type { CartItem } from "@/features/cart/api";
import { toast } from "@/lib/feedback";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const HEX_VALUE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** True when the variant's color is a hex value (vs a legacy color name). */
function colorIsHex(value: string | null): boolean {
  return typeof value === "string" && HEX_VALUE.test(value.trim());
}

export type ProductVariantOption = {
  id: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  stock: number;
};

/* ------------------------------------------------------------------ */
/*  Size-type detection                                                */
/* ------------------------------------------------------------------ */

/** Well-known letter/word sizes, order preserved for sorting. */
const LETTER_SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "2XL", "3XL", "4XL", "5XL",
  "FREE", "ONE SIZE",
];

/** Returns true when every size value looks purely numeric (e.g. 10, 24, 90). */
function allNumeric(sizes: string[]): boolean {
  return sizes.length > 0 && sizes.every((s) => /^\d+(\.\d+)?$/.test(s.trim()));
}

/** Returns true when every size value matches a known letter size token. */
function allLetterSizes(sizes: string[]): boolean {
  return (
    sizes.length > 0 &&
    sizes.every((s) => LETTER_SIZE_ORDER.includes(s.trim().toUpperCase()))
  );
}

type SizeType = "letter" | "numeric" | "mixed";

function detectSizeType(sizes: string[]): SizeType {
  if (allLetterSizes(sizes)) return "letter";
  if (allNumeric(sizes)) return "numeric";
  return "mixed";
}

/** Sort sizes according to their type so the UI ordering feels natural. */
function sortSizes(sizes: string[], type: SizeType): string[] {
  if (type === "letter") {
    return [...sizes].sort((a, b) => {
      const ai = LETTER_SIZE_ORDER.indexOf(a.trim().toUpperCase());
      const bi = LETTER_SIZE_ORDER.indexOf(b.trim().toUpperCase());
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }
  if (type === "numeric") {
    return [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b));
  }
  // mixed: keep original order
  return sizes;
}

/** Human-friendly label for the size picker heading. */
function sizeHeading(type: SizeType): string {
  switch (type) {
    case "letter":
      return "Size";
    case "numeric":
      return "Size";
    case "mixed":
      return "Size";
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Build a human label for a variant, e.g. "Black / Large".
 * Hex colors are omitted from the text (a swatch is shown beside the label
 * instead) so the button never prints a raw "#070716".
 */
function variantLabel(variant: ProductVariantOption): string {
  const textColor = colorIsHex(variant.color) ? null : variant.color;
  const parts = [textColor, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.sku ?? "Option";
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

const ProductActions = ({
  productId,
  productName,
  image,
  variants,
  salePrice,
  discountPrice,
}: {
  productId: string;
  productName: string;
  image?: string | null;
  variants: ProductVariantOption[];
  /** Regular selling price (product-level). */
  salePrice: number;
  /** Optional discounted price; when set it's the price the customer pays. */
  discountPrice: number | null;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data: session, status } = useSession();

  /* ---------- derived data ---------------------------------------- */

  /** Unique colors across all variants (preserve insertion order). */
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) {
        seen.add(v.color);
        result.push(v.color);
      }
    }
    return result;
  }, [variants]);

  /** Unique sizes across all variants (sorted by detected type). */
  const { uniqueSizes, sizeType } = useMemo(() => {
    const seen = new Set<string>();
    const raw: string[] = [];
    for (const v of variants) {
      if (v.size && !seen.has(v.size)) {
        seen.add(v.size);
        raw.push(v.size);
      }
    }
    const type = detectSizeType(raw);
    return { uniqueSizes: sortSizes(raw, type), sizeType: type };
  }, [variants]);

  const hasColors = uniqueColors.length > 0;
  const hasSizes = uniqueSizes.length > 0;
  const hasVariantChoice = variants.length > 1;

  /* ---------- initial selections ---------------------------------- */

  const initialVariant = useMemo(() => {
    const inStock = variants.find((v) => v.stock > 0);
    return inStock ?? variants[0] ?? null;
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialVariant?.color ?? uniqueColors[0] ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    initialVariant?.size ?? uniqueSizes[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isCartBusy, setIsCartBusy] = useState(false);

  /* ---------- resolve variant from color + size ------------------- */

  const resolveVariant = useCallback(
    (color: string | null, size: string | null): ProductVariantOption | null => {
      // Try exact match first
      const exact = variants.find(
        (v) =>
          (color === null ? v.color === null : v.color === color) &&
          (size === null ? v.size === null : v.size === size),
      );
      if (exact) return exact;

      // Fallback: match by whichever dimension is set
      if (color && !size) return variants.find((v) => v.color === color) ?? null;
      if (size && !color) return variants.find((v) => v.size === size) ?? null;

      return variants[0] ?? null;
    },
    [variants],
  );

  const selectedVariant = resolveVariant(selectedColor, selectedSize);

  /** Which sizes are available for the currently-selected color? */
  const sizesForColor = useMemo(() => {
    if (!hasColors || !selectedColor) return new Set(uniqueSizes);
    const available = new Set<string>();
    for (const v of variants) {
      if (v.color === selectedColor && v.size) available.add(v.size);
    }
    return available;
  }, [hasColors, selectedColor, variants, uniqueSizes]);

  /** Which colors are available for the currently-selected size? */
  const colorsForSize = useMemo(() => {
    if (!hasSizes || !selectedSize) return new Set(uniqueColors);
    const available = new Set<string>();
    for (const v of variants) {
      if (v.size === selectedSize && v.color) available.add(v.color);
    }
    return available;
  }, [hasSizes, selectedSize, variants, uniqueColors]);

  const stockCount = selectedVariant?.stock ?? 0;
  const inStock = stockCount > 0;
  // Pricing lives on the product: discount price when valid, else sale price.
  const currentListPrice = salePrice;
  const unitPrice =
    discountPrice != null && discountPrice < salePrice ? discountPrice : salePrice;
  const discount =
    currentListPrice > unitPrice
      ? Math.round(((currentListPrice - unitPrice) / currentListPrice) * 100)
      : 0;

  /* ---------- handlers -------------------------------------------- */

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    // If the current size isn't available in the new color, pick the first
    // available size for that color.
    if (hasSizes && selectedSize) {
      const sizesAvailable = new Set<string>();
      for (const v of variants) {
        if (v.color === color && v.size) sizesAvailable.add(v.size);
      }
      if (!sizesAvailable.has(selectedSize)) {
        const fallback = uniqueSizes.find((s) => sizesAvailable.has(s));
        setSelectedSize(fallback ?? null);
      }
    }
    setQuantity(1);
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    // If the current color isn't available in the new size, pick the first
    // available color for that size.
    if (hasColors && selectedColor) {
      const colorsAvailable = new Set<string>();
      for (const v of variants) {
        if (v.size === size && v.color) colorsAvailable.add(v.color);
      }
      if (!colorsAvailable.has(selectedColor)) {
        const fallback = uniqueColors.find((c) => colorsAvailable.has(c));
        setSelectedColor(fallback ?? null);
      }
    }
    setQuantity(1);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockCount || 1, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!inStock || isCartBusy || !selectedVariant) return;

    const canUseServer = canUseServerCart(session?.user?.role, status);
    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(productId, quantity, selectedVariant.id);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
        toast.success(`${productName} added to cart`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add item to cart.";
        dispatch(setCartErrorAction(message));
        toast.error(message);
      } finally {
        setIsCartBusy(false);
      }
      return;
    }

    const localBefore = readLocalCart();
    const optimisticItem: CartItem = {
      id: `local:${selectedVariant.id}`,
      productId,
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      name: productName,
      image: image ?? FALLBACK_PRODUCT_IMAGE,
      quantity,
      unitPrice,
      originalPrice: currentListPrice,
      lineTotal: unitPrice * quantity,
      stock: Math.max(stockCount, 1),
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
    toast.success(`${productName} added to cart`);
  };

  const handleBuyNow = () => {
    if (!inStock || !selectedVariant) return;
    const target = `/checkout?buy=${encodeURIComponent(
      `${productId}:${quantity}:${selectedVariant.id}`,
    )}`;
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  };

  /* ---------- render ---------------------------------------------- */

  return (
    <div className="space-y-5 pt-4 border-t border-gray-100">
      {/* Price for the selected variant */}
      {selectedVariant && (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-gray-900">
            {unitPrice.toLocaleString()} BDT
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {currentListPrice.toLocaleString()} BDT
              </span>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                -{discount}%
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Color picker ─────────────────────────────────────────── */}
      {hasColors && (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-gray-900">
            Color
            {selectedColor && (
              <span className="ml-1.5 font-normal text-gray-500">
                — {colorIsHex(selectedColor) ? "Selected" : selectedColor}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {uniqueColors.map((color) => {
              const isSelected = color === selectedColor;
              const isAvailable = colorsForSize.has(color);
              const isHex = colorIsHex(color);
              const isSingleOption = uniqueColors.length === 1;
              // Check if any variant with this color has stock
              const hasStock = variants.some(
                (v) => v.color === color && v.stock > 0,
              );
              const isDisabled = !hasStock;

              return (
                <button
                  key={color}
                  type="button"
                  title={isHex ? color : color}
                  onClick={() => handleSelectColor(color)}
                  disabled={isDisabled || isSingleOption}
                  className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                    isHex
                      ? /* Swatch circle for hex colors */
                        `h-9 w-9 ${
                          isSelected
                            ? "ring-2 ring-violet-600 ring-offset-2"
                            : isDisabled
                              ? "opacity-30 cursor-not-allowed"
                              : !isAvailable
                                ? "opacity-50"
                                : "hover:ring-2 hover:ring-violet-300 hover:ring-offset-1"
                        }`
                      : /* Text button for named colors */
                        `rounded-lg border px-3.5 py-2 text-sm font-medium ${
                          isSelected
                            ? "border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600"
                            : isDisabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through"
                              : !isAvailable
                                ? "border-gray-200 bg-gray-50 text-gray-400"
                                : "border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                        }`
                  }`}
                >
                  {isHex ? (
                    <>
                      <span
                        className="h-full w-full rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      {isDisabled && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block h-px w-6 rotate-45 bg-gray-400" />
                        </span>
                      )}
                    </>
                  ) : (
                    color
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Size picker ──────────────────────────────────────────── */}
      {hasSizes && (
        <div>
          <div className="mb-2.5 flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">
              {sizeHeading(sizeType)}
              {selectedSize && (
                <span className="ml-1.5 font-normal text-gray-500">
                  — {selectedSize}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueSizes.map((size) => {
              const isSelected = size === selectedSize;
              const isAvailable = sizesForColor.has(size);
              const isSingleOption = uniqueSizes.length === 1;
              // Check if any variant with this size has stock
              const hasStock = variants.some(
                (v) => v.size === size && v.stock > 0,
              );
              const isDisabled = !hasStock;
              const isNumeric = sizeType === "numeric";

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSelectSize(size)}
                  disabled={isDisabled || isSingleOption}
                  className={`relative inline-flex items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-200 ${
                    isNumeric ? "min-w-[3rem] px-3 py-2.5" : "min-w-[2.75rem] px-3.5 py-2"
                  } ${
                    isSelected
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200"
                      : isDisabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                        : !isAvailable
                          ? "border-gray-200 bg-gray-50 text-gray-400"
                          : "border-gray-200 bg-white text-gray-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {size}
                  {isDisabled && !isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg">
                      <span className="block h-px w-full rotate-[-18deg] bg-gray-300" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Fallback: flat variant picker (single dimension only) ─ */}
      {hasVariantChoice && !hasColors && !hasSizes && (
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Select option
            {selectedVariant && (
              <span className="ml-1 font-normal text-gray-500">
                ({variantLabel(selectedVariant)})
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;
              const isOut = variant.stock <= 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedColor(variant.color);
                    setSelectedSize(variant.size);
                    setQuantity(1);
                  }}
                  disabled={isOut}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 text-violet-700 ring-1 ring-violet-600"
                      : isOut
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 line-through"
                        : "border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  {colorIsHex(variant.color) && (
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/15"
                      style={{ backgroundColor: variant.color as string }}
                      aria-hidden
                    />
                  )}
                  {variantLabel(variant)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock hint */}
      {selectedVariant && (
        <p className="text-xs font-medium text-gray-500">
          {inStock ? (
            <>
              <span className="text-emerald-600">In stock</span>
              {stockCount <= 5 && (
                <span className="ml-1 text-amber-600">
                  · only {stockCount} left
                </span>
              )}
            </>
          ) : (
            <span className="text-rose-600">Out of stock</span>
          )}
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockCount}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={!inStock || isCartBusy}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            inStock
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {isCartBusy ? "Adding…" : "Add to cart"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
          inStock
            ? "bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Zap className="h-4 w-4" />
        Buy now
      </button>
    </div>
  );
};

export default ProductActions;
