"use client";

import { ShoppingCart, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BulkActionsBarProps = {
  selectedCount: number;
  onClear: () => void;
  onMoveAllToCart: () => void;
  onRemoveAll: () => void;
};

export default function BulkActionsBar({
  selectedCount,
  onClear,
  onMoveAllToCart,
  onRemoveAll,
}: BulkActionsBarProps) {
  const visible = selectedCount > 0;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-12 opacity-0",
      )}
    >
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-violet-300/60 bg-gray-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500 text-sm font-bold">
            {selectedCount}
          </span>
          <p className="text-sm font-medium">
            <span className="hidden sm:inline">item</span>
            {selectedCount === 1 ? "" : "s"} selected
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveAllToCart}
            className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-400 hover:to-indigo-400"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Move to cart</span>
            <span className="sm:hidden">Cart</span>
          </button>
          <button
            type="button"
            onClick={onRemoveAll}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/30 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
