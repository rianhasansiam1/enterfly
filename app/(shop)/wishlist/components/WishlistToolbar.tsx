"use client";

import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WishlistView = "grid" | "list";

type WishlistSort =
  | "recent"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "rating";

type WishlistToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  sort: WishlistSort;
  onSortChange: (value: WishlistSort) => void;
  view: WishlistView;
  onViewChange: (value: WishlistView) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  totalCount: number;
  visibleCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
};

const SORT_OPTIONS: { value: WishlistSort; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export default function WishlistToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  categories,
  activeCategory,
  onCategoryChange,
  totalCount,
  visibleCount,
  allSelected,
  onToggleSelectAll,
}: WishlistToolbarProps) {
  return (
    <div className="sticky top-[68px] z-30 -mx-2 mt-6 rounded-2xl border border-violet-100 bg-white/85 px-3 py-3 shadow-sm backdrop-blur-lg sm:mx-0 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search your wishlist..."
            className="h-10 rounded-xl border-violet-200 bg-white pl-10 pr-9 text-sm focus-visible:border-violet-500 focus-visible:ring-violet-200"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select all */}
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-violet-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </button>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as WishlistSort)}
              className="h-10 cursor-pointer appearance-none rounded-xl border border-violet-200 bg-white pl-9 pr-8 text-sm font-medium text-gray-700 transition-colors hover:border-violet-400 hover:bg-violet-50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div
            role="group"
            aria-label="View"
            className="flex h-10 items-center rounded-xl border border-violet-200 bg-white p-0.5"
          >
            <ViewButton
              active={view === "grid"}
              onClick={() => onViewChange("grid")}
              label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </ViewButton>
            <ViewButton
              active={view === "list"}
              onClick={() => onViewChange("list")}
              label="List view"
            >
              <List className="h-4 w-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            label={`All (${totalCount})`}
            active={activeCategory === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => onCategoryChange(cat)}
            />
          ))}
          <span className="ml-auto whitespace-nowrap text-xs text-gray-500">
            {visibleCount} of {totalCount} shown
          </span>
        </div>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
        active
          ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-sm"
          : "text-gray-500 hover:bg-violet-50 hover:text-violet-700",
      )}
    >
      {children}
    </button>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-sm"
          : "border-violet-200 bg-white text-gray-700 hover:border-violet-400 hover:text-violet-700",
      )}
    >
      {label}
    </button>
  );
}
