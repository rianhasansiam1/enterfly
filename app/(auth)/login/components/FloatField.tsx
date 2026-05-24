"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type FloatFieldProps = {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  trailing?: ReactNode;
  valid?: boolean | null;
};

export default function FloatField({
  icon,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  trailing,
  valid = null,
}: FloatFieldProps) {
  const [focused, setFocused] = useState(false);
  const float = focused || value.length > 0;

  const validationClass =
    valid === true
      ? "focus-within:border-emerald-500 focus-within:ring-emerald-200"
      : valid === false
        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-200"
        : "focus-within:border-violet-500 focus-within:ring-violet-200";

  const iconClass =
    valid === true
      ? "text-emerald-600"
      : valid === false
        ? "text-red-500"
        : "text-violet-500 group-focus-within:text-violet-600";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-violet-200 bg-white shadow-sm transition-all duration-300 focus-within:ring-4",
        validationClass,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
          iconClass,
        )}
      >
        {icon}
      </span>

      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        placeholder=" "
        className="h-12 w-full rounded-xl bg-transparent pl-9 pr-10 text-sm text-gray-900 outline-none placeholder:text-transparent"
      />

      <label
        className={cn(
          "pointer-events-none absolute transition-all duration-200 ease-out",
          float
            ? "-top-2 left-3 bg-white px-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700"
            : "left-9 top-1/2 -translate-y-1/2 text-sm font-normal normal-case tracking-normal text-gray-500",
        )}
      >
        {label}
      </label>

      {trailing && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}

      {valid !== null && !trailing && <ValidationIcon valid={valid} />}
    </div>
  );
}

function ValidationIcon({ valid }: { valid: boolean }) {
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2">
      {valid ? (
        <CheckCircle2
          className="h-4 w-4 text-emerald-500"
          style={{ animation: "pop 0.3s ease-out" }}
        />
      ) : (
        <span className="text-xs font-bold text-red-500">!</span>
      )}
    </span>
  );
}
