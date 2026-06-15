"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  canUseServerCart,
  fetchServerCartSnapshot,
  removeCartItemOnServer,
  syncCartToServer,
  updateCartItemOnServer,
} from "@/features/cart/api";
import type { CartItem } from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import { readLocalCart, writeLocalCart } from "@/features/cart/storage";
import {
  setCartData,
  setCartError,
  setCartLoading,
  setCartMode,
} from "@/store/slices/cart.slice";
import type { AppDispatch, RootState } from "@/store";
import ColorBadge from "@/components/ui/ColorBadge";
import { toast } from "@/lib/feedback";
import { useAnimatedRemoval } from "@/hooks/useAnimatedRemoval";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";

import { FALLBACK_PRODUCT_IMAGE } from "./constants";

const PROFILE_PREVIEW_LIMIT = 6;

function formatBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

/**
 * Cart preview tab on the profile page.
 *
 * Hydrates from the same server / local storage as `/cart`, but
 * presents a compact list with quantity steppers and a deep link to
 * the full cart for promo codes, "save for later", and checkout.
 */
export default function CartTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();

  const items = useSelector((state: RootState) => state.cart.items);
  const summary = useSelector((state: RootState) => state.cart.summary);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  const error = useSelector((state: RootState) => state.cart.error);
  const itemsRef = useRef(items);

  const canUseServer = canUseServerCart(session?.user?.role, status);
  const { visibleItems, queueRemoval } = useAnimatedRemoval({
    items,
    getId: (item) => item.id,
  });

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (status === "loading") return;

    let ignore = false;

    const hydrate = async () => {
      const localItems = readLocalCart({ dedupeByProductId: true });
      dispatch(setCartError(null));
      dispatch(setCartLoading(true));

      if (!canUseServer) {
        dispatch(setCartMode("local"));
        dispatch(
          setCartData({
            items: localItems,
            summary: computeCartSummary(localItems),
          }),
        );
        dispatch(setCartLoading(false));
        return;
      }

      dispatch(setCartMode("server"));

      try {
        const serverCart = await syncCartToServer(localItems);
        if (ignore) return;
        dispatch(setCartData(serverCart));
        writeLocalCart(serverCart.items);
      } catch (err) {
        if (ignore) return;
        const message =
          err instanceof Error ? err.message : "Failed to load cart from server.";
        dispatch(setCartError(message));
        dispatch(setCartMode("local"));
        dispatch(
          setCartData({
            items: localItems,
            summary: computeCartSummary(localItems),
          }),
        );
      } finally {
        if (!ignore) {
          dispatch(setCartLoading(false));
        }
      }
    };

    void hydrate();

    return () => {
      ignore = true;
    };
  }, [canUseServer, dispatch, status]);

  const handleQuantityChange = async (item: CartItem, nextQty: number) => {
    const safeQty = Math.max(1, Math.min(item.stock || 1, nextQty));
    if (safeQty === item.quantity) return;

    dispatch(setCartError(null));

    if (canUseServer) {
      try {
        await updateCartItemOnServer(item.id, safeQty);
        const snapshot = await fetchServerCartSnapshot();
        dispatch(setCartData(snapshot));
        writeLocalCart(snapshot.items);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update cart.";
        dispatch(setCartError(message));
      }
      return;
    }

    const next = items.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            quantity: safeQty,
            lineTotal: entry.unitPrice * safeQty,
          }
        : entry,
    );
    writeLocalCart(next);
    dispatch(
      setCartData({ items: next, summary: computeCartSummary(next) }),
    );
  };

  const handleRemove = (item: CartItem) => {
    queueRemoval(
      item.id,
      async () => {
        dispatch(setCartError(null));

        if (canUseServer) {
          try {
            await removeCartItemOnServer(item.id);
            const snapshot = await fetchServerCartSnapshot();
            dispatch(setCartData(snapshot));
            writeLocalCart(snapshot.items);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to remove cart item.";
            dispatch(setCartError(message));
            throw new Error(message);
          }
        } else {
          const next = itemsRef.current.filter((entry) => entry.id !== item.id);
          writeLocalCart(next);
          dispatch(setCartData({ items: next, summary: computeCartSummary(next) }));
        }

        toast.success("Item removed from cart");
      },
      (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to remove cart item.";
        toast.error(message);
      },
    );
  };

  const previewItems = visibleItems.slice(0, PROFILE_PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, items.length - PROFILE_PREVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                Cart
              </h2>
              <p className="text-xs text-gray-500">
                {summary.totalItems}{" "}
                {summary.totalItems === 1 ? "item" : "items"} ready to check
                out · subtotal {formatBdt(summary.subtotal)}
              </p>
            </div>
          </div>
          <Link
            href="/cart"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 sm:w-auto"
          >
            Open cart
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading && items.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700 shadow-sm sm:rounded-3xl sm:p-10">
          Loading cart...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-violet-100 text-violet-700">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-gray-900">
            Your cart is empty
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add products to your cart to see them here.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {previewItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3 overflow-hidden rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:p-4"
                >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-violet-100 bg-violet-50 sm:h-16 sm:w-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productId}`}
                    className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-violet-700"
                  >
                    {item.name}
                  </Link>
                  {[item.color, item.size].filter(Boolean).length > 0 && (
                    <ColorBadge
                      color={item.color}
                      size={item.size}
                      className="mt-0.5"
                    />
                  )}
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatBdt(item.unitPrice)}
                    {item.originalPrice > item.unitPrice && (
                      <span className="ml-1.5 text-gray-400 line-through">
                        {formatBdt(item.originalPrice)}
                      </span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-xl border border-violet-100 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="grid h-8 w-8 place-items-center rounded-l-xl text-gray-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 px-2 text-center text-sm font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        aria-label="Increase quantity"
                        className="grid h-8 w-8 place-items-center rounded-r-xl text-gray-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      aria-label="Remove from cart"
                      className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="col-start-2 shrink-0 text-left text-sm font-extrabold text-gray-900 sm:col-start-3 sm:row-start-1 sm:text-right">
                  {formatBdt(item.lineTotal)}
                </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {hiddenCount > 0 && (
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-violet-300 bg-white px-4 py-3 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-50"
            >
              View {hiddenCount} more {hiddenCount === 1 ? "item" : "items"} in cart
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <section className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm sm:rounded-3xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Subtotal
                </p>
                <p className="text-xl font-extrabold text-violet-700 sm:text-2xl">
                  {formatBdt(summary.subtotal)}
                </p>
              </div>
              <Link
                href="/checkout"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
              >
                <Lock className="h-4 w-4" />
                Checkout
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
