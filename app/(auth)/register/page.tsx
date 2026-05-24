"use client";

import { useState } from "react";

import AccountStep from "./components/AccountStep";
import BackgroundFX from "./components/BackgroundFX";
import BrandPanel from "./components/BrandPanel";
import LocalAnimationStyles from "./components/LocalAnimationStyles";
import ProfileStep from "./components/ProfileStep";
import RegisterFooter from "./components/RegisterFooter";
import RegisterHeader from "./components/RegisterHeader";
import SecurityStep from "./components/SecurityStep";
import StepPanel from "./components/StepPanel";
import SuccessState from "./components/SuccessState";
import {
  BRAND_PERKS,
  DEMO_FORM,
  DEMO_SUBMIT_DELAY_MS,
  INITIAL_FORM,
  REGISTER_STEPS,
} from "./components/constants";
import {
  useAutoRotatingIndex,
  useRegisterValidation,
} from "./components/hooks";
import type {
  PasswordField,
  RegisterForm,
  RegisterStatus,
  RegisterStep,
} from "./components/types";


export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegisterStep>(0);
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [visiblePasswordField, setVisiblePasswordField] =
    useState<PasswordField | null>(null);

  const [activePerkIndex, setActivePerkIndex] = useAutoRotatingIndex(
    BRAND_PERKS.length,
    3500,
  );

  const validation = useRegisterValidation(form, currentStep);

  const isLastStep = currentStep === REGISTER_STEPS.length - 1;
  const isSubmitting = status === "submitting";

  const updateField = <Field extends keyof RegisterForm>(
    field: Field,
    value: RegisterForm[Field],
  ) => {
    setForm((previousForm) => ({ ...previousForm, [field]: value }));
  };

  const fillWithDemoData = () => {
    setForm(DEMO_FORM);
    setCurrentStep(0);
    setStatus("idle");
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) =>
      step === 0 ? step : ((step - 1) as RegisterStep),
    );
  };

  const goToNextStep = () => {
    setCurrentStep((step) =>
      step >= REGISTER_STEPS.length - 1
        ? step
        : ((step + 1) as RegisterStep),
    );
  };

  const handleSubmit = async () => {
    setStatus("submitting");

    // TODO(api): replace this fake delay with a real registration request.
    //
    // try {
    //   const response = await fetch("/api/auth/register", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       name: form.name,
    //       email: form.email,
    //       password: form.password,
    //       phone: form.phone,
    //       city: form.city,
    //     }),
    //   });
    //
    //   if (!response.ok) throw new Error("Registration failed");
    //
    //   setStatus("success");
    // } catch (error) {
    //   console.error(error);
    //   setStatus("idle");
    // }

    window.setTimeout(() => {
      setStatus("success");
    }, DEMO_SUBMIT_DELAY_MS);
  };

  const handleNextAction = () => {
    if (!validation.canContinue || isSubmitting) return;

    if (!isLastStep) {
      goToNextStep();
      return;
    }

    handleSubmit();
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

            <RegisterHeader
              currentStep={currentStep}
              onUseDemoData={
                status === "success" || isSubmitting
                  ? undefined
                  : fillWithDemoData
              }
            />

            <div className="mt-7">
              {status === "success" ? (
                <SuccessState name={form.name} />
              ) : (
                <div className="relative">
                  <StepPanel active={currentStep === 0}>
                    <AccountStep
                      form={form}
                      emailValid={validation.emailValid}
                      onFieldChange={updateField}
                    />
                  </StepPanel>

                  <StepPanel active={currentStep === 1}>
                    <SecurityStep
                      form={form}
                      passwordScore={validation.passwordScore}
                      passwordLabel={validation.passwordLabel}
                      passwordColorClass={validation.passwordColorClass}
                      visiblePasswordField={visiblePasswordField}
                      onFieldChange={updateField}
                      onTogglePassword={setVisiblePasswordField}
                    />
                  </StepPanel>

                  <StepPanel active={currentStep === 2}>
                    <ProfileStep form={form} onFieldChange={updateField} />
                  </StepPanel>
                </div>
              )}
            </div>

            {status !== "success" && (
              <RegisterFooter
                currentStep={currentStep}
                status={status}
                canContinue={validation.canContinue}
                onBack={goToPreviousStep}
                onNext={handleNextAction}
              />
            )}
          </div>
        </section>
      </section>

      <LocalAnimationStyles />
    </main>
  );
}
