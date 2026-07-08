"use client";

import { RotateCcw, Search } from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading";
import { ROLE_VALUES, type Role } from "@/features/admin-users/api";

type RoleFilter = "ALL" | Role;

export default function UsersToolbar({
  query,
  roleFilter,
  visibleCount,
  totalCount,
  isLoading,
  onQueryChange,
  onRoleChange,
  onRefresh,
}: {
  query: string;
  roleFilter: RoleFilter;
  visibleCount: number;
  totalCount: number;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onRoleChange: (value: RoleFilter) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by name, email, phone, or city..."
              className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => onRoleChange(event.target.value as RoleFilter)}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All roles</option>
            {ROLE_VALUES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {visibleCount} / {totalCount} customers
        </span>
        {isLoading && (
          <span className="inline-flex items-center gap-1.5">
            <LoadingSpinner size="xs" />
            Syncing customers...
          </span>
        )}
      </div>
    </div>
  );
}
