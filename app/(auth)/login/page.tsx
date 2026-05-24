"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import BackgroundFX from "./components/BackgroundFX";
import BrandPanel from "./components/BrandPanel";
import LocalAnimationStyles from "./components/LocalAnimationStyles";
import LoginFormView from "./components/LoginForm";
import LoginHeader from "./components/LoginHeader";
import SuccessState from "./components/SuccessState";
import { BRAND_PERKS, INITIAL_FORM } from "./components/constants";
import { useAutoRotatingIndex, useLoginValidation } from "./components/hooks";
import type { LoginForm, LoginStatus } from "./components/types";

const DEFAULT_REDIRECT = "/";
const GENERIC_LOGIN_ERROR = "Invalid email or password. Please try again.";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_REDIRECT;

  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous guard: React state updates are async, so a fast double-click
  // can fire two requests in the same tick. A ref flips immediately.
  const inFlightRef = useRef(false);

  const [activePerkIndex, setActivePerkIndex] = useAutoRotatingIndex(
    BRAND_PERKS.length,
    3500,
  );

  const validation = useLoginValidation(form);
  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  const updateField = <Field extends keyof LoginForm>(
    field: Field,
    value: LoginForm[Field],
  ) => {
    setForm((previousForm) => ({ ...previousForm, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setErrorMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (inFlightRef.current) return;
    if (!validation.canSubmit) return;

    inFlightRef.current = true;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!response || response.error) {
        // Always show the same generic message regardless of the underlying
        // failure (wrong password, no such user, rate-limited).
        setStatus("error");
        setErrorMessage(GENERIC_LOGIN_ERROR);
        return;
      }

      setStatus("success");
      router.refresh();
      router.push(callbackUrl);
    } catch (error) {
      console.error("Login failed", error);
      setStatus("error");
      setErrorMessage(GENERIC_LOGIN_ERROR);
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#E6E6FA]">
      <BackgroundFX />

      <section className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <BrandPanel
          activePerkIndex={activePerkIndex}
          onSelectPerk={setActivePerkIndex}
        />

        <section className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-violet-100 sm:p-9">
            <div className="pointer-events-none absolute -top-px left-0 h-1 w-full bg-linear-to-r from-violet-500 via-purple-500 to-indigo-500" />

            <LoginHeader />

            {isSuccess ? (
              <div className="mt-6">
                <SuccessState email={form.email} />
              </div>
            ) : (
              <LoginFormView
                form={form}
                status={status}
                emailValid={validation.emailValid}
                canSubmit={validation.canSubmit && !isSubmitting}
                showPassword={showPassword}
                errorMessage={errorMessage}
                onFieldChange={updateField}
                onTogglePassword={() => setShowPassword((value) => !value)}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </section>
      </section>

      <LocalAnimationStyles />
    </main>
  );
}
