"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import CartHeader from "./components/CartHeader";
import CartItemCard from "./components/CartItemCard";
import EmptyCart from "./components/EmptyCart";
import FreeShippingBar from "./components/FreeShippingBar";
import OrderSummary from "./components/OrderSummary";
import SavedForLater from "./components/SavedForLater";
import {
  FREE_SHIPPING_THRESHOLD,
  MOCK_CART,
  MOCK_SAVED,
  STANDARD_SHIPPING_FEE,
  TAX_RATE,
  VALID_PROMO_CODES,
} from "./components/mockData";
import type { AppliedPromo, CartItem, SavedItem } from "./components/types";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(MOCK_CART);
  const [saved, setSaved] = useState<SavedItem[]>(MOCK_SAVED);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalSavings = items.reduce((sum, i) => {
      if (typeof i.originalPrice !== "number") return sum;
      return sum + Math.max(0, (i.originalPrice - i.price) * i.quantity);
    }, 0);
    const discount = promo
      ? Math.min(promo.discount, subtotal) // never discount past free
      : 0;
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping =
      subtotal === 0
        ? 0
        : afterDiscount >= FREE_SHIPPING_THRESHOLD
          ? 0
          : STANDARD_SHIPPING_FEE;
    const tax = Math.round(afterDiscount * TAX_RATE);
    const total = afterDiscount + shipping + tax;
    return {
      itemCount,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      totalSavings,
    };
  }, [items, promo]);

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity: Math.max(1, Math.min(i.maxQuantity, quantity)),
            }
          : i,
      ),
    );
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveForLater = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSaved((prev) => [
      {
        id: target.id,
        name: target.name,
        brand: target.brand,
        image: target.image,
        price: target.price,
        originalPrice: target.originalPrice,
        inStock: target.inStock,
      },
      ...prev,
    ]);
  };

  const handleSavedRemove = (id: string) => {
    setSaved((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSavedMoveToCart = (id: string) => {
    const target = saved.find((i) => i.id === id);
    if (!target || !target.inStock) return;
    setSaved((prev) => prev.filter((i) => i.id !== id));
    setItems((prev) => [
      ...prev,
      {
        id: target.id,
        name: target.name,
        brand: target.brand,
        image: target.image,
        price: target.price,
        originalPrice: target.originalPrice,
        quantity: 1,
        maxQuantity: 10,
        inStock: target.inStock,
        deliveryDays: 4,
      },
    ]);
  };

  const handleApplyPromo = (code: string) => {
    const match = VALID_PROMO_CODES[code];
    if (!match) return null;
    const next: AppliedPromo = {
      code,
      discount: match.discount,
      description: match.description,
    };
    setPromo(next);
    return next;
  };

  const handleRemovePromo = () => setPromo(null);

  const handleCheckout = () => {
    // Hook into your checkout flow here.
    console.info("Proceed to checkout", { items, promo, totals });
  };

  const isEmpty = items.length === 0;

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CartHeader itemCount={totals.itemCount} />

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            {/* LEFT: items */}
            <div className="flex min-w-0 flex-col gap-4">
              <FreeShippingBar
                subtotal={totals.subtotal - totals.discount}
                threshold={FREE_SHIPPING_THRESHOLD}
              />

              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                    onSaveForLater={handleSaveForLater}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-dashed border-violet-200 bg-white/60 px-4 py-3 text-sm">
                <p className="text-gray-600">
                  Looking for something else?
                </p>
                <Link
                  href="/allProducts"
                  className="font-semibold text-violet-700 hover:underline"
                >
                  Continue shopping →
                </Link>
              </div>

              <SavedForLater
                items={saved}
                onMoveToCart={handleSavedMoveToCart}
                onRemove={handleSavedRemove}
              />
            </div>

            {/* RIGHT: summary */}
            <div className="hidden lg:block">
              <OrderSummary
                subtotal={totals.subtotal}
                discount={totals.discount}
                shipping={totals.shipping}
                tax={totals.tax}
                total={totals.total}
                totalSavings={totals.totalSavings}
                itemCount={totals.itemCount}
                promo={promo}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                onCheckout={handleCheckout}
              />
            </div>

            {/* MOBILE: full summary above sticky bar */}
            <div className="lg:hidden">
              <OrderSummary
                subtotal={totals.subtotal}
                discount={totals.discount}
                shipping={totals.shipping}
                tax={totals.tax}
                total={totals.total}
                totalSavings={totals.totalSavings}
                itemCount={totals.itemCount}
                promo={promo}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        )}

        {/* Spacer so sticky mobile bar doesn't overlap content */}
        {!isEmpty && <div className="h-24 lg:hidden" />}
      </div>

      {/* Sticky mobile checkout bar */}
      {!isEmpty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 px-4 py-3 backdrop-blur-lg shadow-[0_-8px_24px_-12px_rgba(124,58,237,0.25)] lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-gray-500">
                Total ({totals.itemCount}{" "}
                {totals.itemCount === 1 ? "item" : "items"})
              </p>
              <p className="text-lg font-extrabold text-violet-700">
                BDT {totals.total.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Lock className="h-4 w-4" />
              Checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
