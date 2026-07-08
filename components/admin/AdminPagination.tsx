"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Shared pagination footer for all admin tables.
 *
 * Renders prev/next buttons and a page indicator driven entirely by
 * server-supplied meta.  Accepts an `onPageChange` callback so the
 * parent page can trigger a new server fetch.
 */
export default function AdminPagination({
  meta,
  isLoading,
  onPageChange,
}: {
  meta: PaginationMeta;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}) {
  const { page, total, totalPages } = meta;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const start = (page - 1) * meta.pageSize + 1;
  const end = Math.min(page * meta.pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-violet-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-gray-500">
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total.toLocaleString()}`}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!hasPrev || isLoading}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition",
            hasPrev && !isLoading
              ? "border-violet-200 text-violet-700 hover:bg-violet-50"
              : "cursor-not-allowed border-gray-100 text-gray-300",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 text-xs font-semibold text-gray-600">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition",
            hasNext && !isLoading
              ? "border-violet-200 text-violet-700 hover:bg-violet-50"
              : "cursor-not-allowed border-gray-100 text-gray-300",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
