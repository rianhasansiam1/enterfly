"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  FolderTree,
  Loader2,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminCategory,
  setAdminCategories,
  setAdminCategoriesError,
  setAdminCategoriesLoading,
  upsertAdminCategory,
} from "@/store/slices/admin-categories.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  buildFormFromCategory,
  createCategory,
  deleteCategory,
  EMPTY_FORM,
  fetchAllAdminCategoriesSnapshot,
  formatDate,
  STATUS_VALUES,
  updateCategory,
  type AdminCategoryRow,
  type CategoryFormState,
  type CategoryStatus,
} from "@/features/admin-categories/api";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ui/ImageUploader";

const STATUS_BADGE: Record<CategoryStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-200",
};

type StatusFilter = "ALL" | CategoryStatus;

export default function AdminCategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(
    (state: RootState) => state.adminCategories.items,
  );
  const isLoading = useSelector(
    (state: RootState) => state.adminCategories.isLoading,
  );
  const isHydrated = useSelector(
    (state: RootState) => state.adminCategories.isHydrated,
  );
  const error = useSelector((state: RootState) => state.adminCategories.error);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const refreshCategories = useCallback(async () => {
    dispatch(setAdminCategoriesLoading(true));
    dispatch(setAdminCategoriesError(null));
    try {
      const items = await fetchAllAdminCategoriesSnapshot();
      dispatch(setAdminCategories(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load categories.";
      dispatch(setAdminCategoriesError(message));
    } finally {
      dispatch(setAdminCategoriesLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshCategories();
  }, [isHydrated, refreshCategories]);

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((category) => {
      const matchQuery =
        !q ||
        category.name.toLowerCase().includes(q) ||
        category.slug.toLowerCase().includes(q) ||
        (category.description ?? "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || category.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [categories, query, statusFilter]);

  const totals = useMemo(() => {
    let active = 0;
    let products = 0;
    for (const category of categories) {
      if (category.status === "ACTIVE") active += 1;
      products += category.productCount;
    }
    return { active, products };
  }, [categories]);

  const openCreatePanel = () => {
    setPanelMode("create");
    setEditing(null);
    setForm(EMPTY_FORM);
    setMutationError(null);
    setPanelOpen(true);
  };

  const openEditPanel = (category: AdminCategoryRow) => {
    setPanelMode("edit");
    setEditing(category);
    setForm(buildFormFromCategory(category));
    setMutationError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setMutationError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutationError(null);
    setSuccessNote(null);

    const name = form.name.trim();
    if (name.length < 2) {
      setMutationError("Category name must be at least 2 characters.");
      return;
    }

    const description = form.description.trim() || null;
    const image = form.image.trim() || null;

    setIsSubmitting(true);
    try {
      if (panelMode === "create") {
        const created = await createCategory({
          name,
          description,
          image,
          status: form.status,
        });
        dispatch(upsertAdminCategory(created));
        setSuccessNote("Category created successfully.");
        closePanel();
      } else {
        if (!editing) throw new Error("No category selected for editing.");

        const patch: Partial<{
          name: string;
          description: string | null;
          image: string | null;
          status: CategoryStatus;
        }> = {};
        if (name !== editing.name) patch.name = name;
        if (description !== (editing.description ?? null)) {
          patch.description = description;
        }
        if (image !== (editing.image ?? null)) patch.image = image;
        if (form.status !== editing.status) patch.status = form.status;

        if (Object.keys(patch).length === 0) {
          setMutationError("No changes to save.");
          return;
        }

        const updated = await updateCategory(editing.id, patch);
        dispatch(upsertAdminCategory(updated));
        setSuccessNote("Category updated successfully.");
        closePanel();
      }
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Category mutation failed.";
      setMutationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (category: AdminCategoryRow) => {
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(category.id);

    const next: CategoryStatus =
      category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const updated = await updateCategory(category.id, { status: next });
      dispatch(
        patchAdminCategory({
          id: category.id,
          changes: {
            status: updated.status,
            updatedAt: updated.updatedAt,
          },
        }),
      );
      setSuccessNote(
        next === "ACTIVE"
          ? "Category made visible."
          : "Category hidden from the storefront.",
      );
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to update visibility.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (category: AdminCategoryRow) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Hide "${category.name}"? This is a soft delete (status -> INACTIVE).`,
      );
      if (!confirmed) return;
    }

    setMutationError(null);
    setSuccessNote(null);
    setBusyId(category.id);

    try {
      const updated = await deleteCategory(category.id);
      dispatch(
        patchAdminCategory({
          id: category.id,
          changes: {
            status: updated.status,
            updatedAt: updated.updatedAt,
          },
        }),
      );
      setSuccessNote("Category deleted (hidden) successfully.");
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to delete category.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<FolderTree className="h-4 w-4" />}
          label="Total categories"
          value={categories.length.toLocaleString()}
          accent="violet"
        />
        <SummaryCard
          icon={<Eye className="h-4 w-4" />}
          label="Active"
          value={totals.active.toLocaleString()}
          accent="emerald"
        />
        <SummaryCard
          icon={<Package className="h-4 w-4" />}
          label="Products mapped"
          value={totals.products.toLocaleString()}
          accent="amber"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, slug, description..."
                className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All status</option>
              {STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshCategories();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreatePanel}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Category
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {visibleCategories.length} / {categories.length} categories
          </span>
          {isLoading && <span>Syncing categories...</span>}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      {isLoading && categories.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories...
          </span>
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
          <FolderTree className="mx-auto mb-2 h-8 w-8 text-violet-300" />
          No categories match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCategories.map((category) => {
                  const isBusy = busyId === category.id;

                  return (
                    <tr
                      key={category.id}
                      className="border-t border-violet-100/70 align-top"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-12 w-12 rounded-lg border border-violet-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                              {category.name.slice(0, 2).toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="line-clamp-2 text-xs text-gray-500">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                            STATUS_BADGE[category.status],
                          )}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {category.productCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(category.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPanel(category)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleToggleVisibility(category);
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {category.status === "ACTIVE" ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" /> Show
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleDelete(category);
                            }}
                            disabled={isBusy || category.status === "INACTIVE"}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        aria-hidden
        onClick={closePanel}
        className={cn(
          "fixed inset-0 z-[60] bg-gray-900/35 backdrop-blur-[1px] transition-opacity duration-300",
          panelOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-violet-100 bg-white shadow-2xl transition-transform duration-300",
          panelOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-violet-100 bg-linear-to-r from-violet-600 to-indigo-700 px-5 py-4 text-white">
            <h2 className="text-lg font-bold">
              {panelMode === "create" ? "Create Category" : "Edit Category"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              {panelMode === "create"
                ? "Add a category and publish it to the storefront."
                : "Update category details and visibility."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <Field label="Name" required>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Category name"
                />
              </Field>

              <Field label="Status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as CategoryStatus,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                >
                  {STATUS_VALUES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Image">
                <ImageUploader
                  value={form.image}
                  onChange={(url) =>
                    setForm((prev) => ({ ...prev, image: url }))
                  }
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-28 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
                  placeholder="What's in this category?"
                />
              </Field>

              {panelMode === "edit" && editing && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs text-violet-700">
                  <p>
                    Slug:{" "}
                    <span className="font-mono font-semibold">
                      {editing.slug}
                    </span>
                  </p>
                  <p className="mt-1">
                    Renaming the category may regenerate the slug — existing
                    storefront links could break.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-violet-100 bg-white px-5 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closePanel}
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
                  {panelMode === "create" ? "Create" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </section>
  );
}

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-xl bg-linear-to-r px-3 py-1.5 text-sm font-bold",
          ACCENT_STYLES[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
