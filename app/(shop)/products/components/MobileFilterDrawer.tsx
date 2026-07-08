"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import FilterSidebar from "./FilterSidebar";
import type { CategoryOption } from "@/features/products/api";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  maxPrice: number | undefined;
  onMaxPriceChange: (max: number) => void;
  inStockOnly: boolean;
  onInStockChange: () => void;
  onReset: () => void;
};

export default function MobileFilterDrawer({
  open,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  maxPrice,
  onMaxPriceChange,
  inStockOnly,
  onInStockChange,
  onReset,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-[85%] max-w-sm bg-[#E6E6FA] p-0 lg:hidden"
      >
        <SheetHeader className="bg-linear-to-r from-violet-600 to-indigo-700 px-4 py-3 text-white">
          <SheetTitle className="text-base font-bold text-white">
            Filters
          </SheetTitle>
        </SheetHeader>

        <div className="h-[calc(100%-3.25rem)] overflow-y-auto p-3">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            maxPrice={maxPrice}
            onMaxPriceChange={onMaxPriceChange}
            inStockOnly={inStockOnly}
            onInStockChange={onInStockChange}
            onReset={onReset}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
