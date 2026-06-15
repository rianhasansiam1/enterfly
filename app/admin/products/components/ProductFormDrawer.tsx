"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  makeEmptyVariant,
  normalizeImagesInput,
  type ProductFormState,
  type ProductStatus,
  type VariantFormRow,
} from "@/features/admin-products/api";
import ImageUploader from "@/components/ui/ImageUploader";
import MultiImageUploader from "@/components/ui/MultiImageUploader";
import AdvancedColorPicker from "@/components/ui/AdvancedColorPicker";
import { cn } from "@/lib/utils";

import Field from "./Field";

type CategoryChoice = { id: string; name: string };

const inputClass =
  "h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500";

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
  const updateVariant = (index: number, patch: Partial<VariantFormRow>) =>
    onChange((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant,
      ),
    }));

  const addVariant = () =>
    onChange((prev) => ({
      ...prev,
      variants: [...prev.variants, makeEmptyVariant()],
    }));

  const removeVariant = (index: number) =>
    onChange((prev) => ({
      ...prev,
      variants:
        prev.variants.length <= 1
          ? prev.variants
          : prev.variants.filter((_, i) => i !== index),
    }));

  // Highlight duplicate size+color rows in the UI before submit.
  const comboCounts = new Map<string, number>();
  for (const variant of form.variants) {
    const key = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
    if (!variant.size.trim() || !variant.color.trim()) continue;
    comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
  }

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
          "fixed inset-y-0 right-0 z-70 w-full max-w-lg border-l border-violet-100 bg-white shadow-2xl transition-transform duration-300",
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
                ? "Add product details, pricing, and size-color variants."
                : "Update product details, pricing, and variants."}
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
                  className={inputClass}
                  placeholder="Product name"
                />
              </Field>

              <Field label="Category" required>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    onChange((prev) => ({ ...prev, categoryId: event.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Pricing — buyingPrice is admin-only and never shown publicly. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Buying Price" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.buyingPrice}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, buyingPrice: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Internal source cost — admin only
                  </p>
                </Field>

                <Field label="Sale Price" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.salePrice}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, salePrice: event.target.value }))
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    className={inputClass}
                    placeholder="Optional"
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
                    className={inputClass}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </Field>
              </div>

              {/* Variants — one purchasable size + color combination per row. */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Variants</p>
                    <p className="text-[11px] text-gray-500">
                      Each row is one purchasable size + color combination.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-300 bg-white px-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {form.variants.map((variant, index) => {
                    const comboKey = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
                    const isDuplicate =
                      variant.size.trim() !== "" &&
                      variant.color.trim() !== "" &&
                      (comboCounts.get(comboKey) ?? 0) > 1;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "rounded-xl border bg-white p-3",
                          isDuplicate ? "border-red-300" : "border-violet-100",
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">
                            Variant {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            disabled={form.variants.length <= 1}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Remove variant ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Field label="Size" required>
                            <input
                              value={variant.size}
                              onChange={(event) =>
                                updateVariant(index, { size: event.target.value })
                              }
                              className={inputClass}
                              placeholder="M"
                            />
                          </Field>

                          <Field label="Color" required>
                            <AdvancedColorPicker
                              label="Variant color"
                              alpha={false}
                              value={variant.color}
                              onChange={(color) => updateVariant(index, { color })}
                              disabled={isSubmitting}
                            />
                          </Field>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Field label="SKU">
                            <input
                              value={variant.sku}
                              onChange={(event) =>
                                updateVariant(index, { sku: event.target.value })
                              }
                              className={inputClass}
                              placeholder="Optional"
                            />
                          </Field>

                          <Field label="Stock" required>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={variant.stock}
                              onChange={(event) =>
                                updateVariant(index, { stock: event.target.value })
                              }
                              className={inputClass}
                              placeholder="0"
                            />
                          </Field>
                        </div>

                        <div className="mt-2">
                          <Field label="Variant Image">
                            <ImageUploader
                              value={variant.image}
                              onChange={(url) => updateVariant(index, { image: url })}
                              disabled={isSubmitting}
                            />
                          </Field>
                        </div>

                        <label className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(event) =>
                              updateVariant(index, { isActive: event.target.checked })
                            }
                            className="h-4 w-4 rounded border-violet-300 text-violet-600"
                          />
                          Active (available for purchase)
                        </label>

                        {isDuplicate && (
                          <p className="mt-2 text-[11px] font-semibold text-red-600">
                            Duplicate size + color combination.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
