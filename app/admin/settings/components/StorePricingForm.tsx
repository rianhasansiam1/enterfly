"use client";

import { CircleDollarSign, Loader2, Percent, RotateCcw, Truck } from "lucide-react";

import type { SettingsFormState } from "@/features/admin-settings/api";

import Field from "./Field";

export default function StorePricingForm({
  form,
  setForm,
  hasSettings,
  isLoading,
  isSaving,
  settingsError,
  settingsNote,
  onRefresh,
  onSubmit,
}: {
  form: SettingsFormState;
  setForm: React.Dispatch<React.SetStateAction<SettingsFormState>>;
  hasSettings: boolean;
  isLoading: boolean;
  isSaving: boolean;
  settingsError: string | null;
  settingsNote: string | null;
  onRefresh: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <CircleDollarSign className="h-4 w-4 text-violet-600" />
            Store pricing
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Tax rate, delivery charges, and free shipping threshold. Applied to
            every cart on the next pricing pass.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-200 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </header>

      {settingsError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {settingsError}
        </div>
      )}
      {settingsNote && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {settingsNote}
        </div>
      )}

      {isLoading && !hasSettings ? (
        <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-6 text-center text-sm text-violet-700">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings...
          </span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field
              label="Tax rate (%)"
              hint="Customer's cart shows this percentage of subtotal."
              icon={<Percent className="h-3.5 w-3.5" />}
              required
            >
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRatePercent}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, taxRatePercent: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                placeholder="5"
              />
            </Field>

            <Field
              label="Currency"
              hint="ISO-style code shown in the cart, e.g. BDT."
              required
            >
              <input
                type="text"
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm uppercase outline-none transition focus:border-violet-500"
                placeholder="BDT"
              />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field
              label="Standard delivery fee"
              icon={<Truck className="h-3.5 w-3.5" />}
              required
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.standardShippingFee}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    standardShippingFee: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                placeholder="120"
              />
            </Field>

            <Field
              label="Express delivery fee"
              icon={<Truck className="h-3.5 w-3.5" />}
              required
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.expressShippingFee}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expressShippingFee: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                placeholder="250"
              />
            </Field>

            <Field
              label="Free shipping above"
              hint="Subtotal at which delivery is free."
              required
            >
              <input
                type="number"
                step="1"
                min="0"
                value={form.freeShippingThreshold}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    freeShippingThreshold: e.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                placeholder="50000"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving || !hasSettings}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
