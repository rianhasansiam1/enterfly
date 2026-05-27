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
    <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
      <div className="relative bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 px-6 py-7 text-white sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                {user.role === "ADMIN" ? "Administrator" : "Member"}
              </p>
              <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                {user.name || "Welcome back"}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:max-w-sm sm:gap-3">
            <Stat label="Orders" value={stats.totalOrders.toString()} />
            <Stat label="Lifetime spend" value={formatBdt(stats.totalSpend)} />
            <Stat label="Wishlist" value={stats.wishlistCount.toString()} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-violet-100 p-5 sm:grid-cols-4 sm:p-6">
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
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white/40 bg-white/15 text-white shadow-md backdrop-blur-md">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/15 px-3 py-2 text-center backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-extrabold sm:text-base">
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
    <div className="rounded-2xl border border-violet-100 bg-white p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-violet-50 text-violet-700">
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-1.5 truncate text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}
