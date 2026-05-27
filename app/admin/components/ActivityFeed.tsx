"use client";

import Link from "next/link";
import {
  Activity,
  Inbox,
  Mail,
  Package,
  ShoppingBag,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type {
  DashboardActivity,
  DashboardActivityKind,
} from "@/features/admin-dashboard/api";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  DashboardActivityKind,
  { icon: LucideIcon; tile: string }
> = {
  order: { icon: ShoppingBag, tile: "bg-violet-100 text-violet-700" },
  product: { icon: Package, tile: "bg-indigo-100 text-indigo-700" },
  message: { icon: Mail, tile: "bg-amber-100 text-amber-700" },
  user: { icon: UserPlus, tile: "bg-emerald-100 text-emerald-700" },
};

type ActivityFeedProps = {
  activity: DashboardActivity[];
  loading?: boolean;
};

export default function ActivityFeed({ activity, loading }: ActivityFeedProps) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
      </header>

      {loading ? (
        <ol className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex gap-3">
              <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-violet-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-violet-50" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-violet-50" />
              </div>
            </li>
          ))}
        </ol>
      ) : activity.length === 0 ? (
        <div className="grid place-items-center rounded-xl bg-violet-50/40 px-4 py-10 text-center">
          <Inbox className="h-7 w-7 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-gray-700">
            Nothing yet
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Recent customer and catalog activity will appear here.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-dashed border-violet-200 pl-5">
          {activity.map((entry) => {
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
                  <span className="font-semibold text-gray-900">
                    {entry.actor}
                  </span>{" "}
                  {entry.action}
                  {entry.target && (
                    <>
                      {" "}
                      {entry.href ? (
                        <Link
                          href={entry.href}
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          {entry.target}
                        </Link>
                      ) : (
                        <span className="font-semibold text-violet-700">
                          {entry.target}
                        </span>
                      )}
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {formatRelative(entry.at)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
