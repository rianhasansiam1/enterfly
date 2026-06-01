"use client";

import { Loader2 } from "lucide-react";

import {
  normalizeImagesInput,
  type ProductFormState,
  type ProductStatus,
} from "@/features/admin-products/api";
import ImageUploader from "@/components/ui/ImageUploader";
import MultiImageUploader from "@/components/ui/MultiImageUploader";
import AdvancedColorPicker from "@/components/ui/AdvancedColorPicker";
import { cn } from "@/lib/utils";

import Field from "./Field";

type CategoryChoice = { id: string; name: string };

export default function ProductFormDrawer({
  open,
  mode,
  form,
  categoryOptions,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: ProductFormState;
  categoryOptions: CategoryChoice[];
  isSubmitting: boolean;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<ProductFormState>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-60 bg-gray-900/35 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-70 w-full max-w-md border-l border-violet-100 bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-violet-100 bg-linear-to-r from-violet-600 to-indigo-700 px-5 py-4 text-white">
            <h2 className="text-lg font-bold">
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              {mode === "create"
                ? "Add product details and publish immediately."
                : "Update product details and visibility."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <Field label="Name" required>
                <input
                  value={form.name}
                  onChange={(event) =>
                    onChange((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Product name"
                />
              </Field>

              <Field label="Category" required>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    onChange((prev) => ({ ...prev, categoryId: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, price: event.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="0"
                  />
                </Field>

                <Field label="Discount Price">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountPrice}
                    onChange={(event) =>
                      onChange((prev) => ({
                        ...prev,
                        discountPrice: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock" required>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.stock}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, stock: event.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="0"
                  />
                </Field>

                <Field label="Status" required>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      onChange((prev) => ({
                        ...prev,
                        status: event.target.value as ProductStatus,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Color">
                  <AdvancedColorPicker
                    label="Product color"
                    alpha={false}
                    value={form.color}
                    onChange={(color) =>
                      onChange((prev) => ({ ...prev, color }))
                    }
                    disabled={isSubmitting}
                  />
                </Field>

                <Field label="Size">
                  <input
                    value={form.size}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, size: event.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="S, M, L, XL  or  10, 24, 30"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Comma-separated sizes create separate variants
                  </p>
                </Field>
              </div>

              <Field label="Primary Image">
                <ImageUploader
                  value={form.image}
                  onChange={(url) => onChange((prev) => ({ ...prev, image: url }))}
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Extra Images">
                <MultiImageUploader
                  value={normalizeImagesInput(form.images)}
                  onChange={(urls) =>
                    onChange((prev) => ({ ...prev, images: urls.join("\n") }))
                  }
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    onChange((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-28 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Product description"
                />
              </Field>
            </div>

            <div className="border-t border-violet-100 bg-white px-5 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
