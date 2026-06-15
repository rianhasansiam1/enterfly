"use client";

import { Loader2, X } from "lucide-react";

import {
  STATUS_VALUES,
  type TestimonialFormState,
  type TestimonialStatus,
} from "@/features/admin-testimonials/api";
import ImageUploader from "@/components/ui/ImageUploader";

export default function TestimonialForm({
  mode,
  form,
  setForm,
  saving,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: TestimonialFormState;
  setForm: React.Dispatch<React.SetStateAction<TestimonialFormState>>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const update = <K extends keyof TestimonialFormState>(
    key: K,
    value: TestimonialFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          {mode === "create" ? "Add testimonial" : "Edit testimonial"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ImageUploader
            label="Avatar (optional)"
            value={form.image}
            onChange={(url) => update("image", url)}
            disabled={saving}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Sneha Iyer"
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Location (optional)
            <input
              type="text"
              value={form.location}
              onChange={(event) => update("location", event.target.value)}
              placeholder="e.g. Dhaka"
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Rating
            <select
              value={String(form.rating)}
              onChange={(event) => update("rating", Number(event.target.value))}
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            >
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>
                  {star} star{star === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Display order
            <input
              type="number"
              min={0}
              value={form.position}
              onChange={(event) =>
                update("position", Number(event.target.value) || 0)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 sm:col-span-2">
            Testimonial
            <textarea
              value={form.text}
              onChange={(event) => update("text", event.target.value)}
              placeholder="What did the shopper say?"
              rows={3}
              className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                update("status", event.target.value as TestimonialStatus)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
            >
              {STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Add testimonial" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
