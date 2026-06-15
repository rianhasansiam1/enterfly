"use client";

import { Banknote, Clock, CreditCard, ShieldCheck } from "lucide-react";

import type { CheckoutPaymentMethod } from "@/features/checkout/api";
import { cn } from "@/lib/utils";

type PaymentMethodPickerProps = {
  value: CheckoutPaymentMethod;
  onChange: (value: CheckoutPaymentMethod) => void;
};

type PaymentOption = {
  value: CheckoutPaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
};

const OPTIONS: PaymentOption[] = [
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on delivery",
    description: "Pay in cash when the order arrives at your address.",
    icon: <Banknote className="h-5 w-5" />,
    badge: "No prepayment",
  },
  {
    value: "ONLINE",
    label: "Pay now",
    description: "Card or mobile wallet checkout — gateway integration is on the way.",
    icon: <CreditCard className="h-5 w-5" />,
    comingSoon: true,
    disabled: true,
  },
];

export default function PaymentMethodPicker({
  value,
  onChange,
}: PaymentMethodPickerProps) {
  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Payment method</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Pick how you&apos;d like to pay. You can change it before placing the order.
          </p>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Buyer protection
        </span>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const active = value === option.value && !option.disabled;
          const disabled = option.disabled === true;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (disabled) return;
                onChange(option.value);
              }}
              disabled={disabled}
              aria-disabled={disabled || undefined}
              aria-pressed={active}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200",
                active
                  ? "border-violet-500 bg-violet-50/70 shadow-sm ring-2 ring-violet-200"
                  : "border-violet-100 bg-white hover:border-violet-300 hover:bg-violet-50/30",
                disabled && "cursor-not-allowed opacity-70 hover:border-violet-100 hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                  active
                    ? "bg-violet-600 text-white"
                    : "bg-violet-100 text-violet-700 group-hover:bg-violet-200",
                  disabled && "bg-gray-100 text-gray-400 group-hover:bg-gray-100",
                )}
              >
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      disabled ? "text-gray-500" : "text-gray-900",
                    )}
                  >
                    {option.label}
                  </span>
                  {option.comingSoon ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                      <Clock className="h-3 w-3" />
                      Coming soon
                    </span>
                  ) : option.badge ? (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        active
                          ? "bg-violet-600 text-white"
                          : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {option.badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  {option.description}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  active
                    ? "border-violet-600 bg-violet-600"
                    : "border-violet-300 bg-white",
                  disabled && "border-gray-200 bg-gray-100",
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
