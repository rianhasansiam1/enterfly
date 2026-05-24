"use client";

import { useEffect, useMemo, useState } from "react";

import { isValidEmail } from "./helpers";
import type { LoginForm } from "./types";

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

export function useLoginValidation(form: LoginForm) {
  const emailValid = useMemo(() => isValidEmail(form.email), [form.email]);

  const canSubmit = emailValid && form.password.length >= 1;

  return { emailValid, canSubmit };
}
