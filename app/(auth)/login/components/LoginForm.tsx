"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Lock, LogIn, Mail, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { FIELD_LIMITS } from "@/lib/auth/policy";

import FloatField from "@/app/(auth)/_components/FloatField";
import {
  GoogleSignInButton,
  SocialDivider,
} from "@/app/(auth)/_components/GoogleSignInButton";
import PasswordVisibilityButton from "@/app/(auth)/_components/PasswordVisibilityButton";

import type { LoginFieldUpdater, LoginForm, LoginStatus } from "../page";

type LoginFormProps = {
  form: LoginForm;
  status: LoginStatus;
  emailValid: boolean;
  canSubmit: boolean;
  showPassword: boolean;
  errorMessage: string | null;
  callbackUrl?: string;
  onFieldChange: LoginFieldUpdater;
  onTogglePassword: () => void;
  onSubmit: () => void;
};

export default function LoginFormView({
  form,
  status,
  emailValid,
  canSubmit,
  showPassword,
  errorMessage,
  callbackUrl,
  onFieldChange,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  const isSubmitting = status === "submitting";
  const isError = status === "error";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className={cn(
        "mt-6 grid gap-4",
        isError && "animate-[shake_0.4s_ease-in-out]",
      )}
      noValidate
    >
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-700"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <FloatField
        icon={<Mail className="h-4 w-4" />}
        label="Email address"
        value={form.email}
        onChange={(value) => onFieldChange("email", value)}
        type="email"
        autoComplete="email"
        maxLength={FIELD_LIMITS.EMAIL_MAX}
        valid={form.email.length > 0 ? emailValid : null}
      />

      <FloatField
        icon={<Lock className="h-4 w-4" />}
        label="Password"
        value={form.password}
        onChange={(value) => onFieldChange("password", value)}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        maxLength={FIELD_LIMITS.PASSWORD_MAX}
        trailing={
          <PasswordVisibilityButton
            visible={showPassword}
            onClick={onTogglePassword}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Link
          href="/login"
          className="text-xs font-semibold text-violet-700 underline-offset-2 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        aria-busy={isSubmitting}
        className="group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-violet-600 to-purple-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing you in...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <SocialDivider />
      <GoogleSignInButton callbackUrl={callbackUrl} />

      <p className="mt-2 text-center text-[11px] text-gray-500">
        By signing in you agree to our{" "}
        <Link
          href="/about"
          className="font-semibold text-violet-700 hover:underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/about"
          className="font-semibold text-violet-700 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
