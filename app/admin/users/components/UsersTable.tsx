"use client";

/* eslint-disable @next/next/no-img-element */

import { ShieldCheck, Users } from "lucide-react";

import {
  formatCurrency,
  formatDate,
  getInitials,
  type AdminUserRow,
  type Role,
} from "@/features/admin-users/api";
import { cn } from "@/lib/utils";
import { LoadingSpinner, TableSkeleton } from "@/components/ui/loading";

const ROLE_BADGE: Record<Role, string> = {
  USER: "bg-violet-50 text-violet-700 ring-violet-200",
  ADMIN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function UsersTable({
  users,
  isLoading,
  totalCount,
  busyUserId,
  currentUserId,
  onToggleRole,
}: {
  users: AdminUserRow[];
  isLoading: boolean;
  totalCount: number;
  busyUserId: string | null;
  currentUserId: string | null;
  onToggleRole: (user: AdminUserRow) => void;
}) {
  if (isLoading && totalCount === 0) {
    return <TableSkeleton rows={6} columns={7} caption="Loading customers" />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <Users className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No customers match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isBusy = busyUserId === user.id;
              const isSelf = user.id === currentUserId;
              const nextRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN";

              return (
                <tr
                  key={user.id}
                  className="border-t border-violet-100/70 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-10 w-10 rounded-full border border-violet-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                          {getInitials(user.name, user.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user.name || "—"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {user.city || "No city set"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate text-gray-700">{user.email}</p>
                    <p className="truncate text-xs text-gray-500">
                      {user.phone || "No phone"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        ROLE_BADGE[user.role],
                      )}
                    >
                      {user.role}
                    </span>
                    {isSelf && (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-violet-500">
                        You
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <p className="font-semibold text-gray-900">
                      {user.ordersCount}
                    </p>
                    {user.liveOrdersCount > 0 && (
                      <p className="text-xs text-gray-500">
                        {user.liveOrdersCount} active
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(user.totalSpend)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last: {formatDate(user.lastOrderAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onToggleRole(user)}
                        disabled={isBusy || isSelf}
                        aria-busy={isBusy || undefined}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                          user.role === "ADMIN"
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                        )}
                      >
                        {isBusy ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                        Make {nextRole}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
