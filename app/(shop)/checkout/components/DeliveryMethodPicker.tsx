"use client";

import { Sparkles, Truck, Zap } from "lucide-react";

import type {
  CheckoutDeliveryMethod,
  CheckoutSummary,
} from "@/features/checkout/api";
import { cn } from "@/lib/utils";

type DeliveryMethodPickerProps = {
  value: CheckoutDeliveryMethod;
  onChange: (value: CheckoutDeliveryMethod) => void;
  summary: CheckoutSummary | null;
  isLoading?: boolean;
};

type DeliveryOption = {
  value: CheckoutDeliveryMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
  charge: number | null;
  free: boolean;
  badge?: string;
};

export default function DeliveryMethodPicker({
  value,
  onChange,
  summary,
  isLoading,
}: DeliveryMethodPickerProps) {
  const options: DeliveryOption[] = [
    {
      value: "STANDARD",
      label: "Standard delivery",
      description: "Regular courier delivery for everyday orders.",
      icon: <Truck className="h-5 w-5" />,
      charge: summary?.standardDeliveryCharge ?? null,
      free: Boolean(summary && summary.standardDeliveryCharge === 0),
      badge: summary?.standardDeliveryCharge === 0 ? "Free" : undefined,
    },
    // {
    //   value: "EXPRESS",
    //   label: "Express delivery",
    //   description: "Priority delivery when the order needs faster handling.",
    //   icon: <Zap className="h-5 w-5" />,
    //   charge: summary?.expressDeliveryCharge ?? null,
    //   free: Boolean(summary && summary.expressDeliveryCharge === 0),
    //   badge: "Fastest",
    // },
  ];

  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Delivery method</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Choose how this order should be delivered.
          </p>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Server-priced
        </span>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200",
                active
                  ? "border-violet-500 bg-violet-50/70 shadow-sm ring-2 ring-violet-200"
                  : "border-violet-100 bg-white hover:border-violet-300 hover:bg-violet-50/30",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                  active
                    ? "bg-violet-600 text-white"
                    : "bg-violet-100 text-violet-700 group-hover:bg-violet-200",
                )}
              >
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {option.label}
                  </span>
                  {option.badge && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        active
                          ? "bg-violet-600 text-white"
                          : option.free
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {option.badge}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  {option.description}
                </span>
                <span
                  className={cn(
                    "mt-2 block text-sm font-extrabold",
                    option.free ? "text-emerald-600" : "text-gray-900",
                  )}
                >
                  {isLoading && option.charge == null
                    ? "Calculating..."
                    : formatCharge(option.charge, option.free)}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  active
                    ? "border-violet-600 bg-violet-600"
                    : "border-violet-300 bg-white",
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

function formatCharge(value: number | null, free: boolean): string {
  if (free) return "FREE";
  if (value == null) return "-";
  return `BDT ${value.toLocaleString()}`;
}
