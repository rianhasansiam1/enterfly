"use client";

import Link from "next/link";

import { REGISTER_STEPS } from "./constants";
import Stepper from "./Stepper";
import type { RegisterStep } from "../page";

type RegisterHeaderProps = {
  currentStep: RegisterStep;
};

export default function RegisterHeader({ currentStep }: RegisterHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Create your{" "}
            <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              account
            </span>
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Already a member?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-700 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <span className="hidden shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200 sm:inline-flex">
          Step {currentStep + 1} of {REGISTER_STEPS.length}
        </span>
      </div>

      <Stepper currentStep={currentStep} />
    </header>
  );
}
