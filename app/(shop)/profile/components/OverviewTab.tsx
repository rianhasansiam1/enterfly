"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Gift,
  Heart,
  Package,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";

import type { ProfileStats, ProfileUser } from "@/features/profile/api";
import { ORDER_STATUS_TONE } from "./constants";
import type { ProfileTabId } from "./constants";

type OverviewTabProps = {
  user: ProfileUser;
  stats: ProfileStats;
  onJumpToTab: (tabId: ProfileTabId) => void;
};

function formatBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function OverviewTab({
  user,
  stats,
  onJumpToTab,
}: OverviewTabProps) {
  // Headline milestones for the overview widget (fits the 5-col grid).
  // The full per-status breakdown lives on the Orders tab.
  const ordered = (
    [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
    ] as const
  ).map((key) => ({
    key,
    count: stats.ordersByStatus[key] ?? 0,
  }));

  const incompleteProfile = !user.phone || !user.city;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Headline metrics */}
      <section className="grid grid-cols-1 gap-2 @xs:grid-cols-2 sm:gap-3 @3xl:grid-cols-4">
        <MetricCard
          icon={<Wallet className="h-4 w-4" />}
          label="Lifetime spend"
          value={formatBdt(stats.totalSpend)}
          tone="violet"
        />
        <MetricCard
          icon={<Package className="h-4 w-4" />}
          label="Total orders"
          value={stats.totalOrders.toString()}
          tone="indigo"
        />
        <MetricCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="In your cart"
          value={stats.cartCount.toString()}
          tone="fuchsia"
          actionLabel="Open cart"
          onAction={() => onJumpToTab("cart")}
        />
        <MetricCard
          icon={<Heart className="h-4 w-4" />}
          label="Wishlist"
          value={stats.wishlistCount.toString()}
          tone="rose"
          actionLabel="Open wishlist"
          onAction={() => onJumpToTab("wishlist")}
        />
      </section>

      {incompleteProfile && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-900">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-amber-900">
                Finish setting up your profile
              </h3>
              <p className="mt-0.5 text-xs text-amber-800">
                Add your{" "}
                {[
                  !user.phone ? "phone number" : null,
                  !user.city ? "city" : null,
                ]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                so checkout is one click away.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onJumpToTab("settings")}
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-3 py-2 text-xs font-bold text-amber-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-950 sm:w-auto sm:py-1.5"
            >
              Edit profile
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Order status breakdown */}
      <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
              <ClipboardList className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">
              Order activity
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onJumpToTab("orders")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-800"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-2 @xs:grid-cols-2 @lg:grid-cols-3 @3xl:grid-cols-5">
          {ordered.map(({ key, count }) => {
            const tone = ORDER_STATUS_TONE[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-violet-100 bg-white p-3"
              >
                <span
                  className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight ${tone.pill}`}
                >
                  {tone.label}
                </span>
                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  {count}
                </p>
                <p className="text-[11px] text-gray-500">
                  {count === 1 ? "order" : "orders"}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Last order placed:{" "}
          <span className="font-semibold text-gray-700">
            {formatDate(stats.lastOrderAt)}
          </span>
        </p>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <header className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <Gift className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            Quick actions
          </h2>
        </header>
        <div className="grid gap-3 @md:grid-cols-2 @2xl:grid-cols-3">
          <QuickAction
            label="Browse products"
            description="Discover what's new in store."
            href="/products"
            icon={<ShoppingBag className="h-4 w-4" />}
          />
          <QuickAction
            label="Update profile"
            description="Keep contact details current."
            onClick={() => onJumpToTab("settings")}
            icon={<Sparkles className="h-4 w-4" />}
          />
          <QuickAction
            label="Change password"
            description="Rotate credentials regularly."
            onClick={() => onJumpToTab("security")}
            icon={<Heart className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}

const TONE_STYLES: Record<
  "violet" | "indigo" | "fuchsia" | "rose",
  { surface: string; iconBg: string; iconText: string }
> = {
  violet: {
    surface: "from-violet-50 to-white",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
  },
  indigo: {
    surface: "from-indigo-50 to-white",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
  },
  fuchsia: {
    surface: "from-fuchsia-50 to-white",
    iconBg: "bg-fuchsia-100",
    iconText: "text-fuchsia-700",
  },
  rose: {
    surface: "from-rose-50 to-white",
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
  },
};

function MetricCard({
  icon,
  label,
  value,
  tone,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: keyof typeof TONE_STYLES;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={`min-w-0 rounded-2xl border border-violet-100 bg-linear-to-br ${styles.surface} p-3 shadow-sm sm:rounded-3xl sm:p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
        >
          {icon}
        </span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-violet-700 hover:text-violet-800"
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 wrap-break-word text-xl font-extrabold text-gray-900 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  label,
  description,
  href,
  onClick,
  icon,
}: {
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  const className =
    "group flex items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md";

  const inner = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-gray-900">
            {label}
          </span>
          <span className="block truncate text-[11px] text-gray-500">
            {description}
          </span>
        </span>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-violet-700" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
