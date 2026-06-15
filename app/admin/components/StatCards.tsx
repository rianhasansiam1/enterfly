"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { DashboardStats, DashboardTrend } from "@/features/admin-dashboard/api";
import { cn } from "@/lib/utils";

type Accent = "violet" | "emerald" | "amber" | "indigo";

const ACCENT_STYLES: Record<Accent, { ring: string; tile: string; icon: string }> = {
  violet: {
    ring: "from-violet-500/30 to-indigo-500/20",
    tile: "bg-violet-100 text-violet-700",
    icon: "text-violet-700",
  },
  indigo: {
    ring: "from-indigo-500/30 to-blue-500/20",
    tile: "bg-indigo-100 text-indigo-700",
    icon: "text-indigo-700",
  },
  emerald: {
    ring: "from-emerald-500/30 to-teal-500/20",
    tile: "bg-emerald-100 text-emerald-700",
    icon: "text-emerald-700",
  },
  amber: {
    ring: "from-amber-500/30 to-orange-500/20",
    tile: "bg-amber-100 text-amber-700",
    icon: "text-amber-700",
  },
};

type CardConfig = {
  id: keyof DashboardStats;
  label: string;
  hint: string;
  accent: Accent;
  icon: LucideIcon | string;
  format: (value: number) => string;
  /**
   * Some metrics (e.g. cancellations) are healthier when going down.
   * `up`/`down`/`flat` is computed by the service so the card just
   * needs to know which direction to colour as positive.
   */
  positiveTrend?: DashboardTrend;
};

function formatBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

const CARDS: readonly CardConfig[] = [
  {
    id: "revenue",
    label: "Revenue (all time)",
    hint: "growth this month",
    accent: "violet",
    icon: "",
    format: formatBdt,
    positiveTrend: "up",
  },
  {
    id: "profit",
    label: "Profit (all time)",
    hint: "revenue − cost",
    accent: "emerald",
    icon: TrendingUp,
    format: formatBdt,
    positiveTrend: "up",
  },
  {
    id: "orders",
    label: "Orders (all time)",
    hint: "growth this month",
    accent: "indigo",
    icon: ShoppingBag,
    format: formatCount,
    positiveTrend: "up",
  },
  {
    id: "customers",
    label: "Customers (all time)",
    hint: "growth this month",
    accent: "emerald",
    icon: Users,
    format: formatCount,
    positiveTrend: "up",
  },
  {
    id: "cancellations",
    label: "Cancellations (all time)",
    hint: "growth this month",
    accent: "amber",
    icon: Undo2,
    format: formatBdt,
    positiveTrend: "down",
  },
];

type StatCardsProps = {
  stats: DashboardStats | null;
  loading?: boolean;
};

export default function StatCards({ stats, loading }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {CARDS.map((card) => {
        const stat = stats?.[card.id] ?? null;
        return (
          <StatCard
            key={card.id}
            card={card}
            stat={stat}
            loading={loading || !stats}
          />
        );
      })}
    </div>
  );
}

type StatCardProps = {
  card: CardConfig;
  stat: DashboardStats[keyof DashboardStats] | null;
  loading: boolean;
};

function StatCard({ card, stat, loading }: StatCardProps) {
  const styles = ACCENT_STYLES[card.accent];
  const Icon = card.icon;

  const TrendIcon =
    stat?.trend === "down"
      ? ArrowDownRight
      : stat?.trend === "up"
        ? ArrowUpRight
        : ArrowRight;

  const positive = stat
    ? stat.trend === "flat"
      ? null
      : stat.trend === card.positiveTrend
    : null;

  const deltaPill =
    positive === null
      ? "bg-gray-100 text-gray-600"
      : positive
        ? "bg-emerald-50 text-emerald-700"
        : "bg-red-50 text-red-600";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          styles.ring,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {card.label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded-md bg-violet-50" />
          ) : (
            <p className="mt-2 text-2xl font-extrabold text-gray-900">
              {stat ? card.format(stat.current) : "—"}
            </p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5", styles.tile)}>
          {typeof Icon === "string" ? (
            <span className={cn("text-sm font-semibold", styles.icon)}>{Icon}</span>
          ) : (
            <Icon className={cn("h-5 w-5", styles.icon)} />
          )}
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        {loading ? (
          <span className="h-4 w-24 animate-pulse rounded-full bg-violet-50" />
        ) : stat ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              deltaPill,
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {formatDelta(stat.delta)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
            —
          </span>
        )}
        <span className="text-[11px] font-medium text-gray-500">
          {card.hint}
        </span>
      </div>
    </article>
  );
}

function formatDelta(delta: number): string {
  if (!Number.isFinite(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  // Trim a trailing .0 so 12.0% renders as 12%.
  const rounded = Math.round(delta * 10) / 10;
  return `${sign}${rounded}%`;
}
