"use client";

import { Plus, RotateCcw, Search, X } from "lucide-react";

import {
  REVIEW_SOURCE_VALUES,
  type ReviewSource,
} from "@/features/admin-reviews/api";

type SourceFilter = "ALL" | ReviewSource;
type RatingFilter = "ALL" | 1 | 2 | 3 | 4 | 5;

export default function ReviewsToolbar({
  query,
  sourceFilter,
  ratingFilter,
  visibleCount,
  totalCount,
  isLoading,
  showAddForm,
  onQueryChange,
  onSourceChange,
  onRatingChange,
  onToggleAddForm,
  onRefresh,
}: {
  query: string;
  sourceFilter: SourceFilter;
  ratingFilter: RatingFilter;
  visibleCount: number;
  totalCount: number;
  isLoading: boolean;
  showAddForm: boolean;
  onQueryChange: (value: string) => void;
  onSourceChange: (value: SourceFilter) => void;
  onRatingChange: (value: RatingFilter) => void;
  onToggleAddForm: () => void;
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
              placeholder="Search by author, phone, product, title, comment..."
              className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>

          <select
            value={sourceFilter}
            onChange={(event) => onSourceChange(event.target.value as SourceFilter)}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All sources</option>
            {REVIEW_SOURCE_VALUES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <select
            value={String(ratingFilter)}
            onChange={(event) => {
              const value = event.target.value;
              onRatingChange(
                value === "ALL" ? "ALL" : (Number(value) as RatingFilter),
              );
            }}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            <option value="ALL">All ratings</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {star} star{star === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAddForm}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? "Close" : "Add review"}
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
          {visibleCount} / {totalCount} reviews
        </span>
        {isLoading && <span>Syncing reviews...</span>}
      </div>
    </div>
  );
}
