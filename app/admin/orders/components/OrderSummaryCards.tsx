"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/features/admin-orders/api";

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-xl bg-linear-to-r px-3 py-1.5 text-sm font-bold",
          ACCENT_STYLES[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function OrderSummaryCards({
  totalOrders,
  revenue,
  pending,
  unpaid,
}: {
  totalOrders: number;
  revenue: number;
  pending: number;
  unpaid: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard
        label="Total orders"
        value={totalOrders.toLocaleString()}
        accent="violet"
      />
      <SummaryCard
        label="Merchandise revenue"
        value={formatCurrency(revenue)}
        accent="emerald"
      />
      <SummaryCard
        label="Pending / unpaid"
        value={`${pending} pending · ${unpaid} unpaid`}
        accent="amber"
      />
    </div>
  );
}
