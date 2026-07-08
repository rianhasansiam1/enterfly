"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
};

/**
 * Numbered pagination bar that matches the violet/indigo design system.
 *
 * Shows first, last, current, and ±2 surrounding pages with ellipsis
 * when the range is truncated.
 */
export default function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <nav
      aria-label="Product pagination"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      {/* Previous */}
      <button
        type="button"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all duration-200",
          hasPreviousPage
            ? "border-violet-200 bg-white text-violet-700 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-sm active:translate-y-0"
            : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {pages.map((entry, idx) =>
        entry === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-all duration-200",
              entry === page
                ? "border-violet-600 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                : "border-violet-100 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:shadow-sm active:translate-y-0",
            )}
          >
            {entry}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all duration-200",
          hasNextPage
            ? "border-violet-200 bg-white text-violet-700 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-sm active:translate-y-0"
            : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/**
 * Build a compact page number range: 1 … 4 5 [6] 7 8 … 20
 *
 * Always includes the first and last page, plus up to 2 pages on
 * each side of the current page. Uses `"..."` as the ellipsis marker.
 */
function buildPageRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const rangeStart = Math.max(2, current - 2);
  const rangeEnd = Math.min(total - 1, current + 2);

  pages.push(1);

  if (rangeStart > 2) pages.push("...");

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < total - 1) pages.push("...");

  pages.push(total);

  return pages;
}
