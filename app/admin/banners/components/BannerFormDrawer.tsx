"use client";

import type {
  CarouselFormState,
  CategoryBannerFormState,
  DealFormState,
  PromoFormState,
  TopFormState,
} from "@/features/admin-banners/api";
import type { CategoryOption } from "@/features/admin-products/api";
import { cn } from "@/lib/utils";
import { ButtonLoader } from "@/components/ui/loading";

import { TABS, type EditingState } from "./constants";
import {
  CarouselFormFields,
  CategoryBannerFormFields,
  DealFormFields,
  PromoFormFields,
  TopFormFields,
} from "./BannerFormFields";

export default function BannerFormDrawer({
  editing,
  isSubmitting,
  categories,
  carouselForm,
  setCarouselForm,
  categoryForm,
  setCategoryForm,
  topForm,
  setTopForm,
  dealForm,
  setDealForm,
  promoForm,
  setPromoForm,
  onClose,
  onSubmit,
}: {
  editing: EditingState;
  isSubmitting: boolean;
  categories: CategoryOption[];
  carouselForm: CarouselFormState;
  setCarouselForm: React.Dispatch<React.SetStateAction<CarouselFormState>>;
  categoryForm: CategoryBannerFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryBannerFormState>>;
  topForm: TopFormState;
  setTopForm: React.Dispatch<React.SetStateAction<TopFormState>>;
  dealForm: DealFormState;
  setDealForm: React.Dispatch<React.SetStateAction<DealFormState>>;
  promoForm: PromoFormState;
  setPromoForm: React.Dispatch<React.SetStateAction<PromoFormState>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-60 bg-gray-900/35 backdrop-blur-[1px] transition-opacity duration-300",
          editing ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-70 w-full max-w-md border-l border-violet-100 bg-white shadow-2xl transition-transform duration-300",
          editing ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-violet-100 bg-linear-to-r from-violet-600 to-indigo-700 px-5 py-4 text-white">
            <h2 className="text-lg font-bold">
              {editing?.mode === "create" ? "Create banner" : "Edit banner"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              {editing
                ? TABS.find((t) => t.kind === editing.kind)?.description
                : ""}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={isSubmitting || undefined}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {editing?.kind === "carousel" && (
                <CarouselFormFields form={carouselForm} setForm={setCarouselForm} />
              )}
              {editing?.kind === "category" && (
                <CategoryBannerFormFields
                  form={categoryForm}
                  setForm={setCategoryForm}
                  categories={categories}
                />
              )}
              {editing?.kind === "top" && (
                <TopFormFields form={topForm} setForm={setTopForm} />
              )}
              {editing?.kind === "deal" && (
                <DealFormFields form={dealForm} setForm={setDealForm} />
              )}
              {editing?.kind === "promo" && (
                <PromoFormFields form={promoForm} setForm={setPromoForm} />
              )}
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
                  disabled={isSubmitting || !editing}
                  aria-busy={isSubmitting || undefined}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <ButtonLoader
                      label={editing?.mode === "create" ? "Creating..." : "Saving..."}
                    />
                  ) : editing?.mode === "create" ? (
                    "Create"
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
