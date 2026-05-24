"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type RememberMeCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function RememberMeCheckbox({
  checked,
  onChange,
}: RememberMeCheckboxProps) {
  return (
    <label className="group inline-flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-gray-700">
      <span className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border border-violet-300 bg-white transition-colors group-hover:border-violet-500">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <Check
          className={cn(
            "relative z-10 h-3 w-3 text-white transition-all duration-200",
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />

        <span
          className={cn(
            "absolute inset-0 z-0 rounded-md bg-linear-to-br from-violet-600 to-purple-600 transition-opacity duration-200",
            checked ? "opacity-100" : "opacity-0",
          )}
        />
      </span>

      Remember me for 30 days
    </label>
  );
}
