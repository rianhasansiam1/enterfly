"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";

import { Input } from "@/components/ui/input";

type PromoCodeInputProps = {
  promoCode: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
};

export default function PromoCodeInput({
  promoCode,
  onApply,
  onRemove,
}: PromoCodeInputProps) {
  const [value, setValue] = useState("");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    onApply(trimmed);
    setValue("");
  };

  if (promoCode) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white">
            <Tag className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-violet-800">
              <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-xs text-violet-700">
                {promoCode}
              </span>
              ready for checkout
            </p>
            <p className="truncate text-xs text-violet-700">
              This code will be verified before any discount is applied.
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove promo code"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-violet-700 transition-colors hover:bg-violet-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleApply} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Promo code"
            maxLength={40}
            className="h-11 rounded-xl border-violet-200 bg-white pl-10 pr-3 text-sm font-medium uppercase tracking-wide focus-visible:border-violet-500 focus-visible:ring-violet-200"
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          Continue
        </button>
      </form>
      <p className="text-[11px] text-gray-500">
        Promo codes are checked during checkout before totals are updated.
      </p>
    </div>
  );
}
