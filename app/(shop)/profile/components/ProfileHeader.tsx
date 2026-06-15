"use client";

import Image from "next/image";
import { CalendarDays, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";

import type { ProfileStats, ProfileUser } from "@/features/profile/api";

type ProfileHeaderProps = {
  user: ProfileUser;
  stats: ProfileStats;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

/**
 * The hero card at the top of the profile page.
 *
 * Shows the user's avatar, contact info, and a few headline metrics
 * (lifetime spend, total orders, wishlist size) so the customer gets
 * a quick read of their account before drilling into a tab.
 */
export default function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm sm:rounded-3xl">
      <div className="relative bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 px-4 py-5 text-white sm:px-6 sm:py-7 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                {user.role === "ADMIN" ? "Administrator" : "Member"}
              </p>
              <h1 className="mt-0.5 wrap-break-word text-xl font-extrabold tracking-tight sm:truncate sm:text-3xl">
                {user.name || "Welcome back"}
              </h1>
              <p className="mt-1 flex min-w-0 items-start gap-1.5 text-xs text-white/85 sm:items-center sm:text-sm">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                <span className="break-all sm:truncate">{user.email}</span>
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:max-w-sm">
            <Stat label="Orders" value={stats.totalOrders.toString()} />
            <Stat label="Wishlist" value={stats.wishlistCount.toString()} />
            <Stat
              label="Lifetime spend"
              value={formatBdt(stats.totalSpend)}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-violet-100 p-3 sm:grid-cols-2 sm:gap-3 sm:p-6 lg:grid-cols-4">
        <InfoTile
          icon={<User className="h-4 w-4" />}
          label="Display name"
          value={user.name || "—"}
        />
        <InfoTile
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={user.phone || "Not added"}
        />
        <InfoTile
          icon={<MapPin className="h-4 w-4" />}
          label="City"
          value={user.city || "Not added"}
        />
        <InfoTile
          icon={<CalendarDays className="h-4 w-4" />}
          label="Member since"
          value={formatDate(user.createdAt)}
        />
      </div>

      {user.provider === "GOOGLE" && (
        <div className="border-t border-violet-100 bg-violet-50/60 px-5 py-3 text-xs font-medium text-violet-800 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Connected with Google
          </span>
        </div>
      )}
    </section>
  );
}

function Avatar({ user }: { user: ProfileUser }) {
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white/40 bg-white/15 text-white shadow-md backdrop-blur-md sm:h-16 sm:w-16">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || "Profile"}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xl font-extrabold">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </span>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-white/30 bg-white/15 px-3 py-2 text-center backdrop-blur-md ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
        {label}
      </p>
      <p className="mt-0.5 wrap-break-word text-sm font-extrabold sm:truncate sm:text-base">
        {value}
      </p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-violet-100 bg-white p-2.5 sm:block sm:rounded-2xl sm:p-3">
      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:gap-2 sm:text-[11px] sm:tracking-wider">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700">
          {icon}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <p className="min-w-0 flex-1 truncate text-right text-xs font-bold text-gray-900 sm:mt-1.5 sm:flex-none sm:text-left sm:wrap-break-word sm:text-sm">
        {value}
      </p>
    </div>
  );
}
