"use client";

import { RotateCcw } from "lucide-react";
import type { CategoryOption } from "@/features/products/api";

const PRICE_BOUNDS: [number, number] = [0, 50000];

type Props = {
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  maxPrice: number | undefined;
  onMaxPriceChange: (max: number) => void;
  inStockOnly: boolean;
  onInStockChange: () => void;
  onReset: () => void;
};

export default function FilterSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
  onReset,
}: Props) {
  const currentMax = maxPrice ?? PRICE_BOUNDS[1];

  return (
    <aside className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="group flex items-center gap-1 text-xs font-semibold text-violet-600 transition-colors duration-200 hover:text-violet-800"
        >
          <RotateCcw className="h-3 w-3 transition-transform duration-500 group-hover:-rotate-180" />
          Reset
        </button>
      </div>

      {/* ── Category ─────────────────────────────────────── */}
      <FilterGroup title="Category">
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <label key={cat.slug} className="group flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCategory === cat.slug}
                onChange={() => onCategoryChange(cat.slug)}
                className="h-4 w-4 cursor-pointer accent-violet-600 transition-transform duration-150 active:scale-90"
              />
              <span className="text-sm text-gray-700 transition-colors duration-200 group-hover:text-violet-700">
                {cat.name}
              </span>
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-gray-400">Loading categories…</p>
          )}
        </div>
      </FilterGroup>

      {/* ── Price Range ───────────────────────────────────── */}
      <FilterGroup title="Price Range">
        <div className="px-1">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
            <span>BDT {PRICE_BOUNDS[0]}</span>
            <span className="font-semibold text-violet-700">
              BDT {currentMax.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={PRICE_BOUNDS[0]}
            max={PRICE_BOUNDS[1]}
            step={50}
            value={currentMax}
            onChange={(e) => onMaxPriceChange(Number(e.target.value))}
            className="w-full cursor-pointer accent-violet-600"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
            <span>Min</span>
            <span>Max BDT {PRICE_BOUNDS[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterGroup>

      {/* ── Availability ──────────────────────────────────── */}
      <FilterGroup title="Availability" last>
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onInStockChange}
            className="h-4 w-4 cursor-pointer accent-violet-600 transition-transform duration-150 active:scale-90"
          />
          <span className="text-sm text-gray-700 transition-colors duration-200 group-hover:text-violet-700">
            In stock only
          </span>
        </label>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`py-4 ${last ? "" : "border-b border-gray-100"}`}>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-900">
        {title}
      </h3>
      {children}
    </div>
  );
}
