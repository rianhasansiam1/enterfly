"use client";

import { Plus, RotateCcw } from "lucide-react";

import type { ProductStatus } from "@/features/admin-products/api";

type CategoryChoice = { id: string; name: string };

export default function ProductsToolbar({
  query,
  statusFilter,
  categoryFilter,
  categoryOptions,
  visibleCount,
  totalCount,
  isLoading,
  onQueryChange,
  onStatusChange,
  onCategoryChange,
  onRefresh,
  onCreate,
}: {
  query: string;
  statusFilter: "ALL" | ProductStatus;
  categoryFilter: "ALL" | string;
  categoryOptions: CategoryChoice[];
  visibleCount: number;
  totalCount: number;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "ALL" | ProductStatus) => void;
  onCategoryChange: (value: "ALL" | string) => void;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by name, code, category..."
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(event.target.value as "ALL" | ProductStatus)
            }
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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
            Create Product
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          {visibleCount} / {totalCount} products
        </span>
        {isLoading && <span>Syncing products...</span>}
      </div>
    </div>
  );
}
