"use client";

import { Star, RotateCcw } from "lucide-react";
import { BRANDS, CATEGORIES, PRICE_BOUNDS } from "./data";
import type { Filters } from "./data";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
};

export default function FilterSidebar({ filters, onChange, onReset }: Props) {


  const toggleCategory = (cat: string) => {

    const exists = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: exists
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    });
  };






  const toggleBrand = (brand: string) => {
    const exists = filters.brands.includes(brand);
    onChange({
      ...filters,
      brands: exists
        ? filters.brands.filter((b) => b !== brand)
        : [...filters.brands, brand],
    });
  };

  const setMaxPrice = (value: number) => {
    onChange({ ...filters, priceRange: [filters.priceRange[0], value] });
  };

  const setMinRating = (rating: number) => {
    onChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating });
  };

  const toggleInStock = () => {
    onChange({ ...filters, inStockOnly: !filters.inStockOnly });
  };

  return (
    <aside className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      {/* Header */}
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

      {/* Categories */}
      <FilterGroup title="Category">
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 cursor-pointer accent-violet-600 transition-transform duration-150 active:scale-90"
              />
              <span className="text-sm text-gray-700 transition-colors duration-200 group-hover:text-violet-700">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Price Range */}
      <FilterGroup title="Price Range">
        <div className="px-1">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>₹{filters.priceRange[0]}</span>
            <span className="font-semibold text-violet-700">
              ₹{filters.priceRange[1].toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={PRICE_BOUNDS[0]}
            max={PRICE_BOUNDS[1]}
            step={50}
            value={filters.priceRange[1]}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
            <span>Min</span>
            <span>Max ₹{PRICE_BOUNDS[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Customer Rating">
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                filters.minRating === r
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Brands */}
      <FilterGroup title="Brand">
        <div className="space-y-1.5">
          {BRANDS.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="h-4 w-4 cursor-pointer accent-violet-600 transition-transform duration-150 active:scale-90"
              />
              <span className="text-sm text-gray-700 transition-colors duration-200 group-hover:text-violet-700">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Availability */}
      <FilterGroup title="Availability" last>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={toggleInStock}
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
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
