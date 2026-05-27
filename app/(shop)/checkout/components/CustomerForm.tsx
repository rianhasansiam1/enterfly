"use client";

import {
  Building2,
  Hash,
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
};

export default function CustomerForm({
  form,
  onChange,
  errors,
  isAuthenticated,
}: CustomerFormProps) {
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
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Auto-filled
          </span>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          icon={<User className="h-4 w-4" />}
          label="Full name"
          value={form.customerName}
          onChange={(value) => onChange("customerName", value)}
          error={errors.customerName}
          autoComplete="name"
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
          required
        />
        <div className="sm:col-span-2">
          <Field
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={form.customerEmail}
            onChange={(value) => onChange("customerEmail", value)}
            error={errors.customerEmail}
            autoComplete="email"
            type="email"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldTextarea
            icon={<MapPin className="h-4 w-4" />}
            label="Delivery address"
            value={form.customerAddress}
            onChange={(value) => onChange("customerAddress", value)}
            error={errors.customerAddress}
            autoComplete="street-address"
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
        />
        <Field
          icon={<Hash className="h-4 w-4" />}
          label="Postal code"
          value={form.customerPostalCode}
          onChange={(value) => onChange("customerPostalCode", value)}
          error={errors.customerPostalCode}
          autoComplete="postal-code"
          inputMode="text"
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
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 outline-none transition-all duration-200",
          "focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-200",
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
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
        className={cn(
          "min-h-[88px] w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all duration-200",
          "focus-visible:border-violet-500 focus-visible:ring-4 focus-visible:ring-violet-200",
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
