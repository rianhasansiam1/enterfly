"use client";

import {
  BarChart3,
  Boxes,
  FolderTree,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { REPORT_DEFS, type ReportType } from "@/features/admin-reports/api";
import { cn } from "@/lib/utils";

const ICONS: Record<ReportType, LucideIcon> = {
  sales: BarChart3,
  orders: ShoppingBag,
  products: Sparkles,
  profit: TrendingUp,
  inventory: Boxes,
  customers: Users,
  categories: FolderTree,
};

const TYPE_ORDER: ReportType[] = [
  "sales",
  "orders",
  "products",
  "profit",
  "inventory",
  "customers",
  "categories",
];

type Props = {
  value: ReportType;
  onChange: (type: ReportType) => void;
  disabled?: boolean;
};

/**
 * Card grid the admin uses to choose which report to generate.
 * The active card is highlighted with the violet/indigo brand gradient
 * to match the rest of the admin console.
 */
export default function ReportTypePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TYPE_ORDER.map((type) => {
        const def = REPORT_DEFS[type];
        const Icon = ICONS[type];
        const active = value === type;

        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200",
              "shadow-sm hover:-translate-y-0.5 hover:shadow-md",
              active
                ? "border-violet-300 bg-linear-to-br from-violet-50 via-white to-indigo-50"
                : "border-violet-100 bg-white hover:border-violet-200",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  active
                    ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white"
                    : "bg-violet-100 text-violet-700",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{def.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {def.description}
                </p>
              </div>
            </div>

            {active && (
              <span className="absolute right-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Selected
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
