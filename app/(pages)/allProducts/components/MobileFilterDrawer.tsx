"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/CommonComponents/ui/sheet";
import FilterSidebar from "./FilterSidebar";
import type { Filters } from "./data";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
};

export default function MobileFilterDrawer({
  open,
  onClose,
  filters,
  onChange,
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
            filters={filters}
            onChange={onChange}
            onReset={onReset}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
