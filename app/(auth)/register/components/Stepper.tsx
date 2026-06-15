"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { REGISTER_STEPS } from "./constants";
import type { RegisterStep } from "../page";

export default function Stepper({ currentStep }: { currentStep: RegisterStep }) {
  return (
    <ol className="flex items-center">
      {REGISTER_STEPS.map((stepItem, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <li
            key={stepItem.label}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                  isCompleted
                    ? "bg-linear-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30"
                    : isActive
                      ? "bg-white text-violet-700 ring-2 ring-violet-500"
                      : "bg-violet-50 text-gray-400 ring-1 ring-violet-100",
                )}
              >
                {isCompleted ? (
                  <Check
                    className="h-4 w-4"
                    style={{ animation: "pop 0.4s ease-out" }}
                  />
                ) : (
                  index + 1
                )}

                {isActive && (
                  <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-violet-400/30" />
                )}
              </div>

              <p
                className={cn(
                  "mt-2 hidden text-[11px] font-bold uppercase tracking-wide transition-colors sm:block",
                  isCompleted || isActive ? "text-violet-700" : "text-gray-400",
                )}
              >
                {stepItem.label}
              </p>
            </div>

            {index < REGISTER_STEPS.length - 1 && (
              <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-violet-100 sm:mx-3">
                <div
                  className="absolute inset-y-0 left-0 bg-linear-to-r from-violet-500 via-purple-500 to-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: index < currentStep ? "100%" : "0%" }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
