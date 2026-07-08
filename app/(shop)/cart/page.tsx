"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import CartHeader from "./components/CartHeader";
import CartItemCard from "./components/CartItemCard";
import EmptyCart from "./components/EmptyCart";
import FreeShippingBar from "./components/FreeShippingBar";
import OrderSummary from "./components/OrderSummary";
import SavedForLater from "./components/SavedForLater";
import {
  setCartData,
  setCartError,
  setCartLoading,
  setCartMode,
} from "@/store/slices/cart.slice";
import type { AppDispatch, RootState } from "@/store";
import { buildCheckoutPath } from "@/features/checkout/promo-query";
import {
  addToCartOnServer,
  canUseServerCart,
  fetchServerCartSnapshot,
  removeCartItemOnServer,
  syncCartToServer,
  updateCartItemOnServer,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  readLocalCart as readCartFromStorage,
  writeLocalCart,
  cartItemKey,
} from "@/features/cart/storage";
import type { CartItem } from "@/features/cart/api";
import {
  type SavedItem,
  readLocalSaved,
  writeLocalSaved,
} from "@/features/cart/saved-storage";
import { useAnimatedRemoval } from "@/hooks/useAnimatedRemoval";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { confirm, toast } from "@/lib/feedback";
import { ButtonLoader, LoadingSpinner, SectionLoader } from "@/components/ui/loading";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const FREE_SHIPPING_THRESHOLD = 50000;
const STANDARD_SHIPPING_FEE = 120;
const TAX_RATE = 0.05;

function readLocalCart(): CartItem[] {
  return readCartFromStorage({ dedupeByProductId: true });
}

function toSavedItem(item: CartItem): SavedItem {
  return {
    id: `saved:${item.variantId ?? item.productId}`,
    productId: item.productId,
    slug: item.slug ?? item.productId,
    variantId: item.variantId ?? null,
    sku: item.sku ?? null,
    color: item.color ?? null,
    size: item.size ?? null,
    name: item.name,
    brand: "EnterFly",
    image: item.image ?? FALLBACK_PRODUCT_IMAGE,
    price: item.unitPrice,
    originalPrice: item.originalPrice > item.unitPrice ? item.originalPrice : undefined,
    inStock: item.status === "ACTIVE" && item.stock > 0,
  };
}

function toCartViewModel(item: CartItem) {
  return {
    id: item.id,
    productId: item.productId,
    slug: item.slug ?? item.productId,
    name: item.name,
    brand: "EnterFly",
    image: item.image ?? FALLBACK_PRODUCT_IMAGE,
    price: item.unitPrice,
    originalPrice: item.originalPrice > item.unitPrice ? item.originalPrice : undefined,
    quantity: item.quantity,
    maxQuantity: Math.max(1, item.stock),
    color: item.color ?? undefined,
    size: item.size ?? undefined,
    inStock: item.status === "ACTIVE" && item.stock > 0,
    deliveryDays: 4,
    perks: ["Free returns"],
  };
}

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const items = useSelector((state: RootState) => state.cart.items);
  const summary = useSelector((state: RootState) => state.cart.summary);
  const mode = useSelector((state: RootState) => state.cart.mode);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  const error = useSelector((state: RootState) => state.cart.error);

  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const [isCheckoutPending, startCheckoutTransition] = useTransition();

  const canUseServer = canUseServerCart(session?.user?.role, status);

  const {
    visibleItems: visibleCartItems,
    queueRemoval: queueCartRemoval,
  } = useAnimatedRemoval({
    items,
    getId: (item) => item.id,
  });

  const {
    visibleItems: visibleSavedItems,
    queueRemoval: queueSavedRemoval,
  } = useAnimatedRemoval({
    items: saved,
    getId: (item) => item.id,
  });

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (status === "loading") return;

    let ignore = false;

    const hydrate = async () => {
      const localItems = readLocalCart();
      const localSaved = readLocalSaved();

      if (!ignore) {
        setSaved(localSaved);
      }

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

  const totals = useMemo(() => {
    const localItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const localSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const localSavings = items.reduce(
      (sum, item) =>
        sum + Math.max(0, (item.originalPrice - item.unitPrice) * item.quantity),
      0,
    );

    const itemCount = mode === "server" ? summary.totalItems : localItemCount;
    const subtotal = mode === "server" ? summary.subtotal : localSubtotal;
    const totalSavings = mode === "server" ? summary.totalDiscount : localSavings;

    const afterDiscount = subtotal;
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
      shipping,
      tax,
      total,
      totalSavings,
    };
  }, [items, mode, summary]);

  const handleQuantityChange = async (id: string, quantity: number) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const safeQuantity = Math.max(1, Math.min(target.stock || 1, quantity));
    dispatch(setCartError(null));

    if (canUseServer) {
      try {
        await updateCartItemOnServer(id, safeQuantity);
        const snapshot = await fetchServerCartSnapshot();
        dispatch(setCartData(snapshot));
        writeLocalCart(snapshot.items);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update cart quantity.";
        dispatch(setCartError(message));
        toast.error(message);
      }
      return;
    }

    // Local path: build the updated list directly from Redux state (the
    // source of truth) — do NOT re-read from localStorage, because
    // readLocalCart({ dedupeByProductId: true }) sums duplicate quantities
    // and would inflate the count on every change.
    const updatedItems = items.map((item) =>
      item.id === id
        ? { ...item, quantity: safeQuantity, lineTotal: item.unitPrice * safeQuantity }
        : item,
    );
    writeLocalCart(updatedItems);
    dispatch(setCartData({ items: updatedItems, summary: computeCartSummary(updatedItems) }));
  };

  const removeSavedFromLocal = (id: string) => {
    setSaved((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeLocalSaved(next);
      return next;
    });
  };

  const commitRemoveFromCart = async (id: string) => {
    dispatch(setCartError(null));

    if (canUseServer) {
      try {
        await removeCartItemOnServer(id);
        const snapshot = await fetchServerCartSnapshot();
        dispatch(setCartData(snapshot));
        writeLocalCart(snapshot.items);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove item from cart.";
        dispatch(setCartError(message));
        throw new Error(message);
      }
      return;
    }

    const next = itemsRef.current.filter((item) => item.id !== id);
    writeLocalCart(next);
    dispatch(setCartData({ items: next, summary: computeCartSummary(next) }));
  };

  const handleRemove = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const ok = await confirm({
      title: "Remove item?",
      description: `"${target.name}" will be removed from your cart.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!ok) return;

    queueCartRemoval(
      id,
      async () => {
        await commitRemoveFromCart(id);
        toast.success("Item removed from cart");
      },
      (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to remove item from cart.";
        toast.error(message);
      },
    );
  };

  const handleSaveForLater = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const savedItem = toSavedItem(target);

    queueCartRemoval(
      id,
      async () => {
        await commitRemoveFromCart(id);
        setSaved((prev) => {
          const next = [savedItem, ...prev.filter((item) => item.id !== savedItem.id)];
          writeLocalSaved(next);
          return next;
        });
        toast.info("Saved for later");
      },
      (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to save item for later.";
        toast.error(message);
      },
    );
  };

  const handleSavedRemove = (id: string) => {
    queueSavedRemoval(id, () => {
      removeSavedFromLocal(id);
      toast.success("Removed from saved items");
    });
  };

  const handleSavedMoveToCart = (id: string) => {
    const target = saved.find((item) => item.id === id);
    if (!target || !target.inStock) return;

    queueSavedRemoval(
      id,
      async () => {
        if (canUseServer) {
          dispatch(setCartError(null));

          try {
            await addToCartOnServer(target.productId, 1, target.variantId);
            const snapshot = await fetchServerCartSnapshot();
            dispatch(setCartData(snapshot));
            writeLocalCart(snapshot.items);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to move saved item to cart.";
            dispatch(setCartError(message));
            throw new Error(message);
          }
        } else {
          const localCartBefore = readLocalCart();
          const savedKey = cartItemKey(target);
          const existing = localCartBefore.find(
            (item) => cartItemKey(item) === savedKey,
          );
          const nextItem: CartItem = existing
            ? {
                ...existing,
                quantity: existing.quantity + 1,
                lineTotal: existing.unitPrice * (existing.quantity + 1),
              }
            : {
                id: `local:${target.variantId ?? target.productId}`,
                productId: target.productId,
                variantId: target.variantId ?? null,
                sku: target.sku ?? null,
                color: target.color ?? null,
                size: target.size ?? null,
                name: target.name,
                image: target.image,
                quantity: 1,
                unitPrice: target.price,
                originalPrice: target.originalPrice ?? target.price,
                lineTotal: target.price,
                stock: 10,
                status: "ACTIVE",
              };

          const localCartAfter = existing
            ? localCartBefore.map((item) =>
                cartItemKey(item) === savedKey ? nextItem : item,
              )
            : [nextItem, ...localCartBefore];

          writeLocalCart(localCartAfter);
          dispatch(
            setCartData({
              items: localCartAfter,
              summary: computeCartSummary(localCartAfter),
            }),
          );
        }

        removeSavedFromLocal(id);
        toast.success(`${target.name} moved to cart`);
      },
      (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to move saved item to cart.";
        toast.error(message);
      },
    );
  };

  const handleApplyPromo = (code: string) => {
    setPromoCode(code);
    toast.info("Promo code will be checked at checkout.");
  };

  const handleRemovePromo = () => {
    setPromoCode(null);
    toast.info("Promo code removed");
  };

  const handleCheckout = () => {
    if (isCheckoutPending) return;

    const checkoutPath = buildCheckoutPath({ promoCode });

    // Checkout requires authentication so the order can be attached
    // to a real user record. Bounce unauthenticated visitors to the
    // sign-in page first, with a callbackUrl that lands them right
    // back on /checkout.
    if (status !== "authenticated") {
      startCheckoutTransition(() => {
        router.push(`/login?callbackUrl=${encodeURIComponent(checkoutPath)}`);
      });
      return;
    }
    startCheckoutTransition(() => {
      router.push(checkoutPath);
    });
  };

  const itemCards = visibleCartItems.map(toCartViewModel);
  const isEmpty = items.length === 0;

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CartHeader itemCount={totals.itemCount} />

        <div className="mt-2 flex items-center justify-between px-1 text-xs text-gray-500">
          <span>Storage mode: {mode === "server" ? "Server + Local" : "Local only"}</span>
          {isLoading && (
            <span className="inline-flex items-center gap-1.5">
              <LoadingSpinner size="xs" />
              Syncing cart...
            </span>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && isEmpty ? (
          <div className="mt-6">
            <SectionLoader label="Loading cart..." />
          </div>
        ) : isEmpty ? (
          <>
            <EmptyCart />
            {visibleSavedItems.length > 0 && (
              <div className="mt-6">
                <SavedForLater
                  items={visibleSavedItems}
                  onMoveToCart={handleSavedMoveToCart}
                  onRemove={handleSavedRemove}
                />
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            <div className="flex min-w-0 flex-col gap-4">
              <FreeShippingBar
                subtotal={totals.subtotal}
                threshold={FREE_SHIPPING_THRESHOLD}
              />

              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {itemCards.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={LIST_ITEM_VARIANTS}
                      transition={LIST_ITEM_TRANSITION}
                      className="overflow-hidden"
                    >
                      <CartItemCard
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                        onSaveForLater={handleSaveForLater}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-dashed border-violet-200 bg-white/60 px-4 py-3 text-sm">
                <p className="text-gray-600">Looking for something else?</p>
                <Link
                  href="/products"
                  className="font-semibold text-violet-700 hover:underline"
                >
                  Continue shopping {"->"}
                </Link>
              </div>

              <SavedForLater
                items={visibleSavedItems}
                onMoveToCart={handleSavedMoveToCart}
                onRemove={handleSavedRemove}
              />
            </div>

            <div className="hidden lg:block">
              <OrderSummary
                subtotal={totals.subtotal}
                shipping={totals.shipping}
                tax={totals.tax}
                total={totals.total}
                totalSavings={totals.totalSavings}
                itemCount={totals.itemCount}
                promoCode={promoCode}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                onCheckout={handleCheckout}
                isCheckingOut={isCheckoutPending}
              />
            </div>

            <div className="lg:hidden">
              <OrderSummary
                subtotal={totals.subtotal}
                shipping={totals.shipping}
                tax={totals.tax}
                total={totals.total}
                totalSavings={totals.totalSavings}
                itemCount={totals.itemCount}
                promoCode={promoCode}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                onCheckout={handleCheckout}
                isCheckingOut={isCheckoutPending}
              />
            </div>
          </div>
        )}

        {!isEmpty && <div className="h-24 lg:hidden" />}
      </div>

      {!isEmpty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 px-4 py-3 backdrop-blur-lg shadow-[0_-8px_24px_-12px_rgba(124,58,237,0.25)] lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-gray-500">
                Total ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})
              </p>
              <p className="text-lg font-extrabold text-violet-700">
                BDT {totals.total.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckoutPending}
              aria-busy={isCheckoutPending || undefined}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isCheckoutPending ? (
                <ButtonLoader label="Opening checkout..." />
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Checkout
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
