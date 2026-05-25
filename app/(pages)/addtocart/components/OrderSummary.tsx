"use client";

import {
  ShieldCheck,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import PromoCodeInput from "./PromoCodeInput";
import type { AppliedPromo } from "./types";

type OrderSummaryProps = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  totalSavings: number;
  itemCount: number;
  promo: AppliedPromo | null;
  onApplyPromo: (code: string) => AppliedPromo | null;
  onRemovePromo: () => void;
  onCheckout: () => void;
};

export default function OrderSummary({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  totalSavings,
  itemCount,
  promo,
  onApplyPromo,
  onRemovePromo,
  onCheckout,
}: OrderSummaryProps) {
  const totalSaved = totalSavings + discount;

  return (
    <aside className="sticky top-[88px] flex flex-col gap-4 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <PromoCodeInput
        applied={promo}
        onApply={onApplyPromo}
        onRemove={onRemovePromo}
      />

      <div className="space-y-2.5 border-t border-dashed border-violet-100 pt-4 text-sm">
        <SummaryRow label="Subtotal" value={subtotal} />
        {discount > 0 && (
          <SummaryRow
            label={`Promo (${promo?.code})`}
            value={-discount}
            tone="success"
          />
        )}
        <SummaryRow
          label="Shipping"
          value={shipping}
          freeLabel={shipping === 0 ? "FREE" : undefined}
        />
        <SummaryRow label="Tax (5%)" value={tax} />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-gray-700">Total</span>
          <span className="text-2xl font-extrabold text-violet-700 sm:text-3xl">
            BDT {total.toLocaleString()}
          </span>
        </div>
        {totalSaved > 0 && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" />
            You&apos;re saving BDT {totalSaved.toLocaleString()} today
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-base font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      >
        <Lock className="h-4 w-4" />
        Secure Checkout
        <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        SSL encrypted • Buyer protection included
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
