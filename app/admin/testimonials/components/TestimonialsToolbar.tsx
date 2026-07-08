"use client";

import { Download, Plus, RotateCcw, Search } from "lucide-react";

import { LoadingSpinner } from "@/components/ui/loading";
import {
  STATUS_VALUES,
  type TestimonialStatus,
} from "@/features/admin-testimonials/api";

type StatusFilter = "ALL" | TestimonialStatus;

export default function TestimonialsToolbar({
  query,
  statusFilter,
  visibleCount,
  totalCount,
  isLoading,
  onQueryChange,
  onStatusChange,
  onToggleImport,
  onCreate,
  onRefresh,
}: {
  query: string;
  statusFilter: StatusFilter;
  visibleCount: number;
  totalCount: number;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onToggleImport: () => void;
  onCreate: () => void;
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
              placeholder="Search by name, location, text..."
              className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All status</option>
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleImport}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <Download className="h-4 w-4" />
            Import from reviews
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add testimonial
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {visibleCount} / {totalCount} testimonials
        </span>
        {isLoading && (
          <span className="inline-flex items-center gap-1.5">
            <LoadingSpinner size="xs" />
            Syncing...
          </span>
        )}
      </div>
    </div>
  );
}
