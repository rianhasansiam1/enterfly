import { Activity, Package, ShoppingBag, Star, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTIVITY_FEED } from "./data";
import type { Activity as ActivityItem } from "./data";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  ActivityItem["kind"],
  { icon: LucideIcon; tile: string }
> = {
  order: { icon: ShoppingBag, tile: "bg-violet-100 text-violet-700" },
  product: { icon: Package, tile: "bg-indigo-100 text-indigo-700" },
  review: { icon: Star, tile: "bg-amber-100 text-amber-700" },
  user: { icon: UserPlus, tile: "bg-emerald-100 text-emerald-700" },
};

export default function ActivityFeed() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
      </header>

      <ol className="relative space-y-4 border-l border-dashed border-violet-200 pl-5">
        {ACTIVITY_FEED.map((entry) => {
          const meta = KIND_META[entry.kind];
          const Icon = meta.icon;

          return (
            <li key={entry.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute left-[-26px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white",
                  meta.tile,
                )}
              >
                <Icon className="h-3 w-3" />
              </span>
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-gray-900">{entry.actor}</span>{" "}
                {entry.action}
                {entry.target && (
                  <>
                    {" "}
                    <span className="font-semibold text-violet-700">
                      {entry.target}
                    </span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">{entry.at}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
