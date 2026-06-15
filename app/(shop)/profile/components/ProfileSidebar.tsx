"use client";

import { cn } from "@/lib/utils";
import type { ProfileStats } from "@/features/profile/api";

import { PROFILE_TABS, type ProfileTabId } from "./constants";

type ProfileSidebarProps = {
  activeTab: ProfileTabId;
  onTabChange: (tabId: ProfileTabId) => void;
  stats: ProfileStats;
};

/**
 * Side rail of tabs on the profile dashboard.
 *
 * On mobile we collapse to a horizontal scroller so the rail doesn't
 * eat half the screen. The badge counts (orders / wishlist / cart)
 * come straight from the overview payload so they stay in sync with
 * the hero stats.
 */
export default function ProfileSidebar({
  activeTab,
  onTabChange,
  stats,
}: ProfileSidebarProps) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
      {/* Mobile: horizontal scroller */}
      <nav
        className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:hidden"
        aria-label="Profile sections"
      >
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:text-sm",
                active
                  ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                  : "border-violet-100 bg-white text-gray-700 hover:border-violet-200 hover:text-violet-700",
              )}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <Badge tabId={tab.id} stats={stats} />
            </button>
          );
        })}
      </nav>

      {/* Desktop: vertical rail */}
      <ul className="hidden flex-col gap-1.5 rounded-3xl border border-violet-100 bg-white p-3 shadow-sm lg:flex">
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-pressed={active}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                  active
                    ? "bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-violet-50 hover:text-violet-700",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-violet-50 text-violet-700 group-hover:bg-violet-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {tab.label}
                    </span>
                    <Badge tabId={tab.id} stats={stats} active={active} />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[11px]",
                      active ? "text-white/85" : "text-gray-500",
                    )}
                  >
                    {tab.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Badge({
  tabId,
  stats,
  active,
}: {
  tabId: ProfileTabId;
  stats: ProfileStats;
  active?: boolean;
}) {
  let value: number | null = null;

  if (tabId === "orders") value = stats.totalOrders;
  else if (tabId === "wishlist") value = stats.wishlistCount;
  else if (tabId === "cart") value = stats.cartCount;

  if (value === null || value <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
        active
          ? "bg-white/25 text-white"
          : "bg-violet-100 text-violet-700",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}
