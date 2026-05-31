"use client";

import { Plus, RotateCcw } from "lucide-react";

import type { BannerKind } from "@/features/admin-banners/api";
import { cn } from "@/lib/utils";

import { TABS } from "./constants";

export default function BannerTabsBar({
  activeTab,
  onTabChange,
  onRefresh,
  onCreate,
}: {
  activeTab: BannerKind;
  onTabChange: (tab: BannerKind) => void;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const isActive = tab.kind === activeTab;
            return (
              <button
                key={tab.kind}
                type="button"
                onClick={() => onTabChange(tab.kind)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "border-violet-500 bg-violet-600 text-white shadow"
                    : "border-violet-200 text-violet-700 hover:bg-violet-50",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New {TABS.find((t) => t.kind === activeTab)?.label.toLowerCase()}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {TABS.find((t) => t.kind === activeTab)?.description}
      </p>
    </div>
  );
}
