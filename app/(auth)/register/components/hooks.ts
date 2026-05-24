"use client";

import { useEffect, useMemo, useState } from "react";

import {
  PASSWORD_COLOR_CLASSES,
  PASSWORD_LABELS,
} from "./constants";
import { getPasswordScore, isValidEmail } from "./helpers";
import type { RegisterForm, RegisterStep } from "./types";

export function useAutoRotatingIndex(total: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (total <= 1) return;

    const intervalId = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % total);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [total, intervalMs]);

  return [index, setIndex] as const;
}

export function useRegisterValidation(
  form: RegisterForm,
  currentStep: RegisterStep,
) {
  const emailValid = useMemo(() => isValidEmail(form.email), [form.email]);

  const passwordScore = useMemo(
    () => getPasswordScore(form.password),
    [form.password],
  );

  const accountStepValid = form.name.trim().length >= 2 && emailValid;

  const securityStepValid =
    passwordScore >= 2 &&
    form.password.length > 0 &&
    form.password === form.confirmPassword;

  const profileStepValid =
    form.phone.trim().length >= 6 &&
    form.city.trim().length >= 2 &&
    form.agreeToTerms;

  const canContinue =
    currentStep === 0
      ? accountStepValid
      : currentStep === 1
        ? securityStepValid
        : profileStepValid;

  return {
    emailValid,
    passwordScore,
    passwordLabel: PASSWORD_LABELS[passwordScore],
    passwordColorClass: PASSWORD_COLOR_CLASSES[passwordScore],
    accountStepValid,
    securityStepValid,
    profileStepValid,
    canContinue,
  };
}
