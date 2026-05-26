"use client";

import { useState } from "react";
import { Tag, Check, X, AlertCircle } from "lucide-react";
import { Input } from "@/app/CommonComponents/ui/input";

type AppliedPromo = {
  code: string;
  discount: number;
  description: string;
};

type PromoCodeInputProps = {
  applied: AppliedPromo | null;
  onApply: (code: string) => AppliedPromo | null;
  onRemove: () => void;
};

export default function PromoCodeInput({
  applied,
  onApply,
  onRemove,
}: PromoCodeInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return;
    const result = onApply(trimmed);
    if (!result) {
      setError("That code didn't work. Try ENTERFLY10");
      return;
    }
    setError(null);
    setValue("");
  };

  if (applied) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
            <Check className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
              <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-xs text-emerald-700">
                {applied.code}
              </span>
              applied
            </p>
            <p className="truncate text-xs text-emerald-700">
              {applied.description} • -BDT {applied.discount.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove promo code"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-100"
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
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Promo code"
            className="h-11 rounded-xl border-violet-200 bg-white pl-10 pr-3 text-sm font-medium uppercase tracking-wide focus-visible:border-violet-500 focus-visible:ring-violet-200"
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          Apply
        </button>
      </form>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      <p className="text-[11px] text-gray-500">
        Try{" "}
        <button
          type="button"
          onClick={() => setValue("ENTERFLY10")}
          className="font-mono font-semibold text-violet-700 underline-offset-2 hover:underline"
        >
          ENTERFLY10
        </button>{" "}
        for 10% off
      </p>
    </div>
  );
}
