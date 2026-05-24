"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EMAIL_REGEX,
  FIELD_LIMITS,
  PHONE_REGEX,
  meetsPasswordPolicy,
} from "@/lib/auth/policy";

import { PASSWORD_COLOR_CLASSES, PASSWORD_LABELS } from "./constants";
import { getPasswordScore } from "./helpers";
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

/**
 * Mirrors the backend Zod rules in `lib/auth/schemas.ts`. If the server
 * tightens its rules, update `lib/auth/policy.ts` and both stay in sync.
 */
export function useRegisterValidation(
  form: RegisterForm,
  currentStep: RegisterStep,
) {
  const emailValid = useMemo(
    () =>
      EMAIL_REGEX.test(form.email) &&
      form.email.length <= FIELD_LIMITS.EMAIL_MAX,
    [form.email],
  );

  const passwordScore = useMemo(
    () => getPasswordScore(form.password),
    [form.password],
  );

  const passwordValid = meetsPasswordPolicy(form.password);

  const accountStepValid =
    form.name.trim().length >= FIELD_LIMITS.NAME_MIN &&
    form.name.trim().length <= FIELD_LIMITS.NAME_MAX &&
    emailValid;

  const securityStepValid =
    passwordValid && form.password === form.confirmPassword;

  const phoneTrimmed = form.phone.trim();
  const cityTrimmed = form.city.trim();

  const profileStepValid =
    phoneTrimmed.length >= FIELD_LIMITS.PHONE_MIN &&
    phoneTrimmed.length <= FIELD_LIMITS.PHONE_MAX &&
    PHONE_REGEX.test(phoneTrimmed) &&
    cityTrimmed.length >= FIELD_LIMITS.CITY_MIN &&
    cityTrimmed.length <= FIELD_LIMITS.CITY_MAX &&
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
    passwordValid,
    passwordLabel: PASSWORD_LABELS[passwordScore],
    passwordColorClass: PASSWORD_COLOR_CLASSES[passwordScore],
    accountStepValid,
    securityStepValid,
    profileStepValid,
    canContinue,
  };
}
