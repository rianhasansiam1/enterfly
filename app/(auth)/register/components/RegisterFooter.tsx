"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { REGISTER_STEPS } from "./constants";
import type { RegisterStatus, RegisterStep } from "../page";

type RegisterFooterProps = {
  currentStep: RegisterStep;
  status: RegisterStatus;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
};

export default function RegisterFooter({
  currentStep,
  status,
  canContinue,
  onBack,
  onNext,
}: RegisterFooterProps) {
  const isSubmitting = status === "submitting";
  const isLastStep = currentStep === REGISTER_STEPS.length - 1;

  return (
    <div className="mt-7 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 0 || isSubmitting}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:-translate-x-0.5 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue || isSubmitting}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-violet-600 to-purple-600 px-7 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : isLastStep ? (
          <>
            Create account
            <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </div>
  );
}
