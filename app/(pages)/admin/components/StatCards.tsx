import { ArrowDownRight, ArrowUpRight, IndianRupee, ShoppingBag, Users, Undo2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DASHBOARD_STATS } from "./data";
import type { Stat } from "./data";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  revenue: IndianRupee,
  orders: ShoppingBag,
  customers: Users,
  refunds: Undo2,
};

const ACCENT_STYLES: Record<Stat["accent"], { ring: string; tile: string; icon: string }> = {
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

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {DASHBOARD_STATS.map((stat) => {
        const Icon = ICONS[stat.id] ?? ShoppingBag;
        const styles = ACCENT_STYLES[stat.accent];
        const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

        return (
          <article
            key={stat.id}
            className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
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
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={cn("rounded-xl p-2.5", styles.tile)}>
                <Icon className={cn("h-5 w-5", styles.icon)} />
              </div>
            </div>

            <div className="relative mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600",
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {stat.delta}
              </span>
              <span className="text-[11px] font-medium text-gray-500">
                {stat.hint}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
