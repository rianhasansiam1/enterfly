"use client";

import { ChevronDown, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/app/CommonComponents/ui/dropdown-menu";
import { Button } from "@/app/CommonComponents/ui/button";
import { cn } from "@/lib/utils";
import type { SortOption, ViewMode } from "./data";

type Props = {
  resultsCount: number;
  totalCount: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenMobileFilter: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const SORT_LABELS: Record<SortOption, string> = {
  popular: "Most Popular",
  newest: "Newest First",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
  rating: "Top Rated",
};

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

export default function ProductToolbar({
  resultsCount,
  totalCount,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilter,
  sidebarOpen,
  onToggleSidebar,
}: Props) {










  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:px-4">
      {/* Left: count + filter toggles */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onOpenMobileFilter}
          variant="secondary"
          size="sm"
          className="lg:hidden bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>

        <Button
          type="button"
          onClick={onToggleSidebar}
          variant="secondary"
          size="sm"
          aria-label={sidebarOpen ? "Hide filters" : "Show filters"}
          aria-pressed={sidebarOpen}
          className="hidden lg:flex bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <SlidersHorizontal
            className={cn(
              "size-4 transition-transform duration-300",
              sidebarOpen ? "rotate-0" : "rotate-180",
            )}
          />
          {sidebarOpen ? "Hide Filters" : "Show Filters"}
        </Button>

        <p className="hidden text-xs text-gray-600 sm:block sm:text-sm">
          Showing{" "}
          <span className="font-semibold text-gray-900 transition-colors">
            {resultsCount}
          </span>{" "}
          of <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
          products
        </p>
        <p className="text-xs text-gray-600 sm:hidden">
          <span className="font-semibold text-gray-900">{resultsCount}</span>{" "}
          results
        </p>
      </div>

      {/* Right: sort + view toggle */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="group bg-gray-50 text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-700 active:translate-y-0 data-[state=open]:bg-violet-50 data-[state=open]:text-violet-700"
            >
              <span className="hidden sm:inline">Sort:</span>
              <span className="font-semibold">{SORT_LABELS[sort]}</span>
              <ChevronDown className="size-3.5 transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(v) => onSortChange(v as SortOption)}
            >
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt} value={opt}>
                  {SORT_LABELS[opt]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:flex">
          <ViewToggle
            active={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            label="Grid view"
          >
            <Grid3x3 className="size-4" />
          </ViewToggle>
          <ViewToggle
            active={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
            label="List view"
          >
            <List className="size-4" />
          </ViewToggle>
        </div>
      </div>
    </div>
  );
}

function ViewToggle({
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
        "rounded-md p-1.5 transition-all duration-200",
        active
          ? "bg-white text-violet-700 shadow-sm scale-100"
          : "text-gray-500 hover:scale-105 hover:text-violet-600",
      )}
    >
      {children}
    </button>
  );
}
