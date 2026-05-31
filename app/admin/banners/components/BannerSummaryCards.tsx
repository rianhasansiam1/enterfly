"use client";

import { Image as ImageIcon, Layers, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
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

export default function BannerSummaryCards({
  totals,
}: {
  totals: {
    carousel: number;
    category: number;
    top: number;
    deal: number;
    promo: number;
    activeCarousel: number;
    activeCategory: number;
    activeTop: number;
    activeDeal: number;
    activePromo: number;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <SummaryCard
        icon={<Layers className="h-4 w-4" />}
        label="Hero carousel"
        value={`${totals.activeCarousel} / ${totals.carousel} active`}
        accent="violet"
      />
      <SummaryCard
        icon={<ImageIcon className="h-4 w-4" />}
        label="Category banners"
        value={`${totals.activeCategory} / ${totals.category} active`}
        accent="emerald"
      />
      <SummaryCard
        icon={<Sparkles className="h-4 w-4" />}
        label="Top strip"
        value={`${totals.activeTop} / ${totals.top} active`}
        accent="amber"
      />
      <SummaryCard
        icon={<Layers className="h-4 w-4" />}
        label="Product deals"
        value={`${totals.activeDeal} / ${totals.deal} active`}
        accent="violet"
      />
      <SummaryCard
        icon={<ImageIcon className="h-4 w-4" />}
        label="Product promos"
        value={`${totals.activePromo} / ${totals.promo} active`}
        accent="emerald"
      />
    </div>
  );
}
