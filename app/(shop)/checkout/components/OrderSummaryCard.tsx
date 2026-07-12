"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { ButtonLoader, LoadingSpinner } from "@/components/ui/loading";
import type {
  CheckoutPaymentMethod,
  CheckoutSummary,
} from "@/features/checkout/api";

type CartItemBrief = {
  id: string;
  productId: string;
  quantity: number;
};

type OrderSummaryCardProps = {
  summary: CheckoutSummary | null;
  items: CartItemBrief[];
  isLoading: boolean;
  promoCode: string;
  appliedPromo: string | null;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  promoFeedback: { tone: "success" | "error"; message: string } | null;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  submitError: string | null;
  paymentMethod: CheckoutPaymentMethod;
};

export default function OrderSummaryCard({
  summary,
  isLoading,
  promoCode,
  appliedPromo,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
  promoFeedback,
  onPlaceOrder,
  isPlacing,
  submitError,
  paymentMethod,
}: OrderSummaryCardProps) {
  const totalSaved = summary
    ? summary.totalSavings + summary.discount
    : 0;
  const isCheckingPromo = Boolean(appliedPromo && isLoading);
  const shippingLabel =
    summary?.deliveryMethod === "EXPRESS" ? "Express delivery" : "Standard delivery";

  const buttonLabel = isPlacing
    ? "Placing order..."
    : paymentMethod === "ONLINE"
      ? "Pay now (coming soon)"
      : "Place order";
  const onlineDisabled = paymentMethod === "ONLINE";

  return (
    <aside className="flex flex-col gap-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
          Server-priced
        </span>
      </div>

      {/* Promo code */}
      {appliedPromo ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
              <Check className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-xs text-emerald-700">
                  {appliedPromo}
                </span>
                {isCheckingPromo ? (
                  <LoadingSpinner size="xs" label="Checking promo" />
                ) : (
                  "applied"
                )}
              </p>
              {isCheckingPromo ? (
                <p className="truncate text-xs text-emerald-700">
                  Verifying with checkout pricing...
                </p>
              ) : summary ? (
                <p className="truncate text-xs text-emerald-700">
                  -BDT {summary.discount.toLocaleString()} off
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              aria-label="Remove promo"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onApplyPromo();
            }}
            className="flex items-stretch gap-2"
          >
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <Input
                type="text"
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                placeholder="Promo code"
                className="h-11 rounded-xl border-violet-200 bg-white pl-10 pr-3 text-sm font-medium uppercase tracking-wide focus-visible:border-violet-500 focus-visible:ring-violet-200"
              />
            </div>
            <button
              type="submit"
              disabled={!promoCode.trim() || isCheckingPromo}
              aria-busy={isCheckingPromo || undefined}
              className="rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {isCheckingPromo ? <ButtonLoader label="Checking..." /> : "Apply"}
            </button>
          </form>
          {promoFeedback && (
            <p
              className={`flex items-center gap-1.5 text-xs font-medium ${
                promoFeedback.tone === "error"
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {promoFeedback.message}
            </p>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2.5 border-t border-dashed border-violet-100 pt-4 text-sm">
        {isLoading || !summary ? (
          <p className="text-sm text-gray-500">
            <LoadingSpinner label="Calculating totals..." showLabel />
          </p>
        ) : (
          <>
            <SummaryRow label="Subtotal" value={summary.subtotal} />
            {summary.discount > 0 && appliedPromo && (
              <SummaryRow
                label={`Promo (${appliedPromo})`}
                value={-summary.discount}
                tone="success"
              />
            )}
            <SummaryRow
              label={shippingLabel}
              value={summary.shipping}
              freeLabel={summary.isFreeShippingApplied ? "FREE" : undefined}
            />
            <SummaryRow
              label={`Tax (${Math.round(summary.taxRate * 100)}%)`}
              value={summary.tax}
            />
          </>
        )}
      </div>

      {summary && (
        <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-extrabold text-violet-700 sm:text-3xl">
              BDT {summary.total.toLocaleString()}
            </span>
          </div>
          {totalSaved > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Sparkles className="h-3 w-3" />
              You saved BDT {totalSaved.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <p className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={isPlacing || !summary || onlineDisabled}
        aria-busy={isPlacing}
        title={
          onlineDisabled
            ? "Online payment is coming soon. Switch to Cash on delivery to place the order."
            : undefined
        }
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-base font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:hover:translate-y-0"
      >
        {isPlacing ? (
          <ButtonLoader label={buttonLabel} />
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {buttonLabel}
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>
      {onlineDisabled && (
        <p className="-mt-1 text-center text-[11px] font-medium text-amber-700">
          Online payment isn&apos;t live yet. Pick Cash on delivery to finish your order.
        </p>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        Pricing verified by server • Buyer protection included
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
  freeLabel,
}: {
  label: string;
  value: number;
  tone?: "default" | "success";
  freeLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      {freeLabel ? (
        <span className="font-bold uppercase tracking-wider text-emerald-600">
          {freeLabel}
        </span>
      ) : (
        <span
          className={`font-semibold ${
            tone === "success" ? "text-emerald-600" : "text-gray-900"
          }`}
        >
          {value < 0 ? "-" : ""}BDT {Math.abs(value).toLocaleString()}
        </span>
      )}
    </div>
  );
}
