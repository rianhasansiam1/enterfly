"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { PasswordScore } from "../page";

type PasswordStrengthMeterProps = {
  password: string;
  score: PasswordScore;
  label: string;
  colorClass: string;
};

export default function PasswordStrengthMeter({
  password,
  score,
  label,
  colorClass,
}: PasswordStrengthMeterProps) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              index < score ? colorClass : "bg-violet-100",
            )}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="font-bold uppercase tracking-wide text-gray-500">
          Strength
        </span>

        <span
          className={cn(
            "font-bold",
            score >= 3
              ? "text-emerald-600"
              : score >= 2
                ? "text-yellow-600"
                : "text-red-500",
          )}
        >
          {password ? label : "—"}
        </span>
      </div>

      <PasswordHints password={password} />
    </div>
  );
}

function PasswordHints({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase", passed: /[A-Z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Symbol", passed: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="mt-3 grid grid-cols-2 gap-1.5">
      {checks.map((check) => (
        <li
          key={check.label}
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            check.passed ? "text-emerald-600" : "text-gray-400",
          )}
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300",
              check.passed
                ? "bg-emerald-500 text-white"
                : "bg-violet-100 text-gray-400",
            )}
          >
            <Check className="h-3 w-3" />
          </span>

          {check.label}
        </li>
      ))}
    </ul>
  );
}
