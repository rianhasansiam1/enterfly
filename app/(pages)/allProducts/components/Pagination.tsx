"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {







  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8 flex-wrap">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:-translate-x-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
              currentPage === p
                ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                : "border border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:translate-x-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}









function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
