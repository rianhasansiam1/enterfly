"use client";

import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Hash,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type CustomerFormState = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  customerNote: string;
};

type CustomerFormProps = {
  form: CustomerFormState;
  onChange: <K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K],
  ) => void;
  errors: Partial<Record<keyof CustomerFormState, string>>;
  isAuthenticated: boolean;
  profileStatus: "idle" | "loading" | "loaded" | "error";
  onRetryProfile: () => void;
};

export default function CustomerForm({
  form,
  onChange,
  errors,
  isAuthenticated,
  profileStatus,
  onRetryProfile,
}: CustomerFormProps) {
  const isProfileLoading = profileStatus === "loading";

  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Delivery details</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {isAuthenticated
              ? "Pulled from your profile - update anything that's changed."
              : "We use these details only to deliver your order."}
          </p>
        </div>
        {isAuthenticated && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              isProfileLoading
                ? "bg-violet-50 text-violet-700"
                : "bg-emerald-50 text-emerald-700",
            )}
          >
            {isProfileLoading ? "Loading profile..." : "Auto-filled"}
          </span>
        )}
      </header>

      {profileStatus === "error" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            We couldn&apos;t load your saved profile. You can still fill the
            form in manually.
          </span>
          <button
            type="button"
            onClick={onRetryProfile}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          icon={<User className="h-4 w-4" />}
          label="Full name"
          value={form.customerName}
          onChange={(value) => onChange("customerName", value)}
          error={errors.customerName}
          autoComplete="name"
          disabled={isProfileLoading}
          required
        />
        <Field
          icon={<Phone className="h-4 w-4" />}
          label="Phone number"
          value={form.customerPhone}
          onChange={(value) => onChange("customerPhone", value)}
          error={errors.customerPhone}
          autoComplete="tel"
          inputMode="tel"
          disabled={isProfileLoading}
          required
        />
        <div className="sm:col-span-2">
          <EmailField email={form.customerEmail} loading={isProfileLoading} />
        </div>
        <div className="sm:col-span-2">
          <FieldTextarea
            icon={<MapPin className="h-4 w-4" />}
            label="Delivery address"
            value={form.customerAddress}
            onChange={(value) => onChange("customerAddress", value)}
            error={errors.customerAddress}
            autoComplete="street-address"
            disabled={isProfileLoading}
            required
            placeholder="House / Road / Area"
          />
        </div>
        <Field
          icon={<Building2 className="h-4 w-4" />}
          label="City / district"
          value={form.customerCity}
          onChange={(value) => onChange("customerCity", value)}
          error={errors.customerCity}
          autoComplete="address-level2"
          disabled={isProfileLoading}
        />
        <Field
          icon={<Hash className="h-4 w-4" />}
          label="Postal code"
          value={form.customerPostalCode}
          onChange={(value) => onChange("customerPostalCode", value)}
          error={errors.customerPostalCode}
          autoComplete="postal-code"
          inputMode="text"
          disabled={isProfileLoading}
        />
        <div className="sm:col-span-2">
          <FieldTextarea
            icon={<MessageSquare className="h-4 w-4" />}
            label="Additional note (optional)"
            value={form.customerNote}
            onChange={(value) => onChange("customerNote", value)}
            error={errors.customerNote}
            placeholder="Delivery instructions, gate code, preferred time..."
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Read-only email field. The email is linked to the authenticated
 * account and can only be changed from the profile page, so it's
 * rendered locked (visible but not editable) with a helper note and a
 * shortcut to the profile settings.
 */
function EmailField({
  email,
  loading,
}: {
  email: string;
  loading: boolean;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <span className="text-violet-600">
          <Mail className="h-4 w-4" />
        </span>
        Email
        <Lock className="h-3 w-3 text-gray-400" />
      </span>
      <div className="relative">
        <input
          value={loading ? "" : email}
          type="email"
          readOnly
          disabled
          aria-label="Email (linked to your account)"
          placeholder={loading ? "Loading your email..." : undefined}
          autoComplete="email"
          className={cn(
            "h-11 w-full cursor-not-allowed rounded-xl border border-violet-200 bg-violet-50/60 px-3 pr-10 text-sm font-medium text-gray-600 outline-none",
          )}
        />
        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-gray-500">
        <span>
          Email is linked to your account. Update it from your profile page if
          needed.
        </span>
        <Link
          href="/profile?tab=settings"
          className="font-semibold text-violet-600 underline-offset-2 hover:text-violet-700 hover:underline"
        >
          Update Profile
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  error,
  autoComplete,
  inputMode,
  type = "text",
  required,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <span className="text-violet-600">{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        disabled={disabled}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 outline-none transition-all duration-200",
          "focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-200",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
          error
            ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-200"
            : "border-violet-200",
        )}
      />
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function FieldTextarea({
  icon,
  label,
  value,
  onChange,
  error,
  autoComplete,
  required,
  placeholder,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <span className="text-violet-600">{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[88px] w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all duration-200",
          "focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-200",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
          error
            ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-200"
            : "border-violet-200",
        )}
      />
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
