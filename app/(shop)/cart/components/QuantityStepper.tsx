"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
};

export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = "md",
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  const buttonClasses = cn(
    "grid place-items-center rounded-lg text-violet-700 transition-all duration-200 hover:bg-violet-100 hover:text-violet-900 active:scale-95 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent",
    size === "sm" ? "h-7 w-7" : "h-8 w-8",
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50/50 p-1",
        size === "sm" ? "text-xs" : "text-sm",
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={buttonClasses}
      >
        <Minus className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-[2ch] select-none text-center font-bold text-gray-900",
          size === "sm" ? "px-1 text-xs" : "px-2 text-sm",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={buttonClasses}
      >
        <Plus className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </div>
  );
}
