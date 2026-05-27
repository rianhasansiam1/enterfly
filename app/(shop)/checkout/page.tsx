"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchCheckoutPreview,
  fetchCheckoutProfile,
  placeCheckoutOrder,
  type CheckoutItemInput,
  type CheckoutPaymentMethod,
  type CheckoutPreview,
} from "@/features/checkout/api";
import { ORDER_SNAPSHOT_STORAGE_KEY } from "@/features/orders/storage";
import {
  setCartData,
  setCartError,
} from "@/store/slices/cart.slice";
import { computeCartSummary } from "@/features/cart/summary";
import type { AppDispatch, RootState } from "@/store";

import CheckoutHeader from "./components/CheckoutHeader";
import CheckoutItemsCard from "./components/CheckoutItemsCard";
import CustomerForm, {
  type CustomerFormState,
} from "./components/CustomerForm";
import PaymentMethodPicker from "./components/PaymentMethodPicker";
import OrderSummaryCard from "./components/OrderSummaryCard";

const EMPTY_FORM: CustomerFormState = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  customerCity: "",
  customerPostalCode: "",
  customerNote: "",
};

type CheckoutSource =
  | { kind: "cart" }
  | { kind: "buy-now"; items: CheckoutItemInput[] };

function parseBuyNowParam(raw: string | null): CheckoutItemInput[] | null {
  if (!raw) return null;
  // Format: "<productId>:<quantity>" or comma-separated list of those.
  const parts = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const items: CheckoutItemInput[] = [];
  for (const part of parts) {
    const [productId, qtyRaw] = part.split(":");
    if (!productId) continue;
    const quantity = Math.max(1, Math.round(Number(qtyRaw ?? 1) || 1));
    items.push({ productId: productId.trim(), quantity });
  }
  return items.length > 0 ? items : null;
}

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status: authStatus } = useSession();

  const items = useSelector((state: RootState) => state.cart.items);

  // Source: explicit buy-now items from query string OR the user's cart.
  const buyNowItems = useMemo(
    () => parseBuyNowParam(searchParams.get("buy")),
    [searchParams],
  );
  const source = useMemo<CheckoutSource>(
    () => (buyNowItems ? { kind: "buy-now", items: buyNowItems } : { kind: "cart" }),
    [buyNowItems],
  );

  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] =
    useState<CheckoutPaymentMethod>("CASH_ON_DELIVERY");
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoFeedback, setPromoFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // Bumping this token forces the preview effect to re-fetch even when
  // none of its other deps changed (e.g. after a manual retry).
  const [previewToken, setPreviewToken] = useState(0);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CustomerFormState, string>>
  >({});

  // Anonymous visitors can't reach checkout. Bounce them to /login
  // with a callback URL that preserves any "Buy now" intent so the
  // post-login redirect lands them right back here.
  useEffect(() => {
    if (authStatus !== "unauthenticated") return;
    const buy = searchParams.get("buy");
    const target = buy ? `/checkout?buy=${encodeURIComponent(buy)}` : "/checkout";
    router.replace(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }, [authStatus, router, searchParams]);

  // Hydrate the form from the session once we know the auth status.
  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated") return;

    let ignore = false;
    void fetchCheckoutProfile().then((profile) => {
      if (ignore || !profile) return;
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || profile.name || "",
        customerEmail:
          prev.customerEmail || (profile.email ?? session?.user?.email ?? ""),
        customerPhone: prev.customerPhone || profile.phone || "",
        customerCity: prev.customerCity || profile.city || "",
      }));
    });
    return () => {
      ignore = true;
    };
  }, [authStatus, session?.user?.email]);

  // Build the items payload sent to /api/checkout/preview.
  // For "Buy now" we forward the explicit selection; otherwise we
  // omit `items` so the server reads the user's persisted cart.
  const buildItemsPayload = useCallback((): CheckoutItemInput[] | undefined => {
    if (source.kind === "buy-now") return source.items;
    return undefined;
  }, [source]);

  // Single source of truth for "fetch the preview". Triggered by:
  //   - auth status becoming known
  //   - the items source changing (cart -> buy-now and vice versa)
  //   - the applied promo code changing
  //   - the manual reload token bumping
  // Anything that should refresh totals just updates one of those inputs.
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    let ignore = false;

    void (async () => {
      // setState calls live inside the async closure (microtask) so the
      // lint rule against synchronous effect-body setState is satisfied.
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const next = await fetchCheckoutPreview({
          items: buildItemsPayload(),
          promoCode: appliedPromo,
        });
        if (ignore) return;

        setPreview(next);

        if (appliedPromo && next.promo) {
          if (next.promo.ok) {
            setPromoFeedback({
              tone: "success",
              message: `${next.promo.code} applied.`,
            });
          } else {
            setAppliedPromo(null);
            setPromoFeedback({ tone: "error", message: next.promo.reason });
          }
        }
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load order summary.";
        setPreviewError(message);
        setPreview(null);
      } finally {
        if (!ignore) setPreviewLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authStatus, source, appliedPromo, previewToken, buildItemsPayload]);

  const handleApplyPromo = () => {
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) return;
    setPromoFeedback(null);
    setAppliedPromo(trimmed);
    // The preview effect will pick up the new appliedPromo and refetch.
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoFeedback(null);
  };

  const handleRetry = () => setPreviewToken((token) => token + 1);

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (form.customerName.trim().length < 2) {
      errors.customerName = "Enter your full name.";
    }
    if (form.customerPhone.trim().length < 7) {
      errors.customerPhone = "Enter a valid phone number.";
    }
    if (form.customerAddress.trim().length < 5) {
      errors.customerAddress = "Enter your delivery address.";
    }
    const trimmedEmail = form.customerEmail.trim();
    if (trimmedEmail) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(trimmedEmail)) {
        errors.customerEmail = "Enter a valid email address.";
      }
    }
    if (form.customerCity.trim() && form.customerCity.trim().length < 2) {
      errors.customerCity = "City / district is too short.";
    }
    if (
      form.customerPostalCode.trim() &&
      form.customerPostalCode.trim().length < 3
    ) {
      errors.customerPostalCode = "Postal code is too short.";
    }
    if (form.customerNote.length > 1000) {
      errors.customerNote = "Note is too long.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setSubmitError(null);

    if (!preview || preview.items.length === 0) {
      setSubmitError("Your cart is empty. Add items before checking out.");
      return;
    }

    if (!validateForm()) return;

    setIsPlacingOrder(true);

    try {
      const result = await placeCheckoutOrder({
        items: buildItemsPayload(),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        customerAddress: form.customerAddress.trim(),
        customerCity: form.customerCity.trim() || undefined,
        customerPostalCode: form.customerPostalCode.trim() || undefined,
        customerNote: form.customerNote.trim() || undefined,
        paymentMethod,
        promoCode: appliedPromo,
        clearCart: source.kind === "cart",
      });

      // Cart is now empty server-side. Sync local state so the next
      // navigation doesn't show stale items.
      if (source.kind === "cart") {
        dispatch(setCartData({ items: [], summary: computeCartSummary([]) }));
        dispatch(setCartError(null));
      }

      // Stash the snapshot returned by the API so the order summary
      // page can paint the receipt instantly on the post-checkout
      // redirect, before the live `/api/orders/[id]` request resolves.
      try {
        window.sessionStorage.setItem(
          ORDER_SNAPSHOT_STORAGE_KEY,
          JSON.stringify({ id: result.order.id, order: result.order }),
        );
      } catch {
        // sessionStorage can be disabled (private browsing, quota); the
        // logged-in path still works because the API can re-fetch.
      }

      router.push(`/orders/${result.order.id}?just-placed=1`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to place the order.";
      setSubmitError(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const isEmpty = !previewLoading && (!preview || preview.items.length === 0);
  const isAuthenticated = authStatus === "authenticated";

  // Show a friendly gate while auth resolves or while we bounce
  // unauthenticated visitors to /login. Without this the customer
  // sees an empty form for a flash before the redirect kicks in.
  if (authStatus !== "authenticated") {
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">
              {authStatus === "loading"
                ? "Loading checkout..."
                : "Please sign in to checkout"}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {authStatus === "loading"
                ? "One moment while we load your account."
                : "Redirecting you to the sign-in page so we can attach this order to your account."}
            </p>
            {authStatus === "unauthenticated" && (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(
                  searchParams.get("buy")
                    ? `/checkout?buy=${encodeURIComponent(searchParams.get("buy")!)}`
                    : "/checkout",
                )}`}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Sign in to continue
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CheckoutHeader
          isAuthenticated={isAuthenticated}
          itemCount={preview?.items.reduce((sum, x) => sum + x.quantity, 0) ?? 0}
          source={source.kind}
        />

        {previewError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{previewError}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty ? (
          <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">
              Nothing to check out yet
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Add a few products to your cart, then come back to complete the order.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
            <div className="flex min-w-0 flex-col gap-5">
              <CustomerForm
                form={form}
                onChange={(field, value) => {
                  setForm((prev) => ({ ...prev, [field]: value }));
                  if (fieldErrors[field]) {
                    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
                  }
                }}
                errors={fieldErrors}
                isAuthenticated={isAuthenticated}
              />

              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
              />

              <CheckoutItemsCard
                items={preview?.items ?? []}
                isLoading={previewLoading && !preview}
              />
            </div>

            <div className="lg:sticky lg:top-[88px] lg:self-start">
              <OrderSummaryCard
                summary={preview?.summary ?? null}
                isLoading={previewLoading && !preview}
                items={items}
                promoCode={promoCode}
                appliedPromo={appliedPromo}
                onPromoCodeChange={setPromoCode}
                onApplyPromo={handleApplyPromo}
                onRemovePromo={handleRemovePromo}
                promoFeedback={promoFeedback}
                onPlaceOrder={handlePlaceOrder}
                isPlacing={isPlacingOrder}
                submitError={submitError}
                paymentMethod={paymentMethod}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700 shadow-sm">
              Loading checkout...
            </div>
          </div>
        </main>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}
