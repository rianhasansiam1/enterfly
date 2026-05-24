"use client";

import { useState } from "react";

import BackgroundFX from "./components/BackgroundFX";
import BrandPanel from "./components/BrandPanel";
import LocalAnimationStyles from "./components/LocalAnimationStyles";
import LoginFormView from "./components/LoginForm";
import LoginHeader from "./components/LoginHeader";
import SuccessState from "./components/SuccessState";
import {
  BRAND_PERKS,
  DEMO_FORM,
  DEMO_SUBMIT_DELAY_MS,
  INITIAL_FORM,
} from "./components/constants";
import { useAutoRotatingIndex, useLoginValidation } from "./components/hooks";
import type { LoginForm, LoginStatus } from "./components/types";

/**
 * Login page — DEMO MODE.
 *
 * No real APIs are wired up yet. The submit handler simulates a network
 * delay then flips to the success state. Look for the `TODO(api)` markers
 * below to see exactly where to plug in your auth endpoint later.
 */
export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    // Clear error feedback as soon as the user edits anything.
    if (status === "error") {
      setStatus("idle");
      setErrorMessage(null);
    }
  };

  const fillWithDemoData = () => {
    setForm(DEMO_FORM);
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!validation.canSubmit || isSubmitting) return;

    setStatus("submitting");
    setErrorMessage(null);

    // TODO(api): replace this fake delay with a real sign-in request.
    //
    // try {
    //   const response = await fetch("/api/auth/login", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       email: form.email,
    //       password: form.password,
    //       rememberMe: form.rememberMe,
    //     }),
    //   });
    //
    //   if (!response.ok) {
    //     setStatus("error");
    //     setErrorMessage("Invalid email or password. Please try again.");
    //     return;
    //   }
    //
    //   setStatus("success");
    // } catch (error) {
    //   console.error(error);
    //   setStatus("error");
    //   setErrorMessage("Something went wrong. Please try again.");
    // }

    window.setTimeout(() => {
      setStatus("success");
    }, DEMO_SUBMIT_DELAY_MS);
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

            <LoginHeader
              onUseDemoData={
                isSuccess || isSubmitting ? undefined : fillWithDemoData
              }
            />

            {isSuccess ? (
              <div className="mt-6">
                <SuccessState email={form.email} />
              </div>
            ) : (
              <LoginFormView
                form={form}
                status={status}
                emailValid={validation.emailValid}
                canSubmit={validation.canSubmit}
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
