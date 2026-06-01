"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminCategory,
  removeAdminCategory,
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
  updateCategory,
  type AdminCategoryRow,
  type CategoryFormState,
  type CategoryStatus,
} from "@/features/admin-categories/api";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";

import CategorySummaryCards from "./components/CategorySummaryCards";
import CategoriesToolbar from "./components/CategoriesToolbar";
import CategoriesTable from "./components/CategoriesTable";
import CategoryFormDrawer from "./components/CategoryFormDrawer";

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
        const message = "Category created successfully.";
        setSuccessNote(message);
        notifyActionSuccess(message);
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
        const message = "Category updated successfully.";
        setSuccessNote(message);
        notifyActionSuccess(message);
        closePanel();
      }
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Category mutation failed.";
      setMutationError(message);
      notifyActionError(mutation, "Category mutation failed.");
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
      notifyActionSuccess(
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
      notifyActionError(mutation, "Failed to update visibility.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (category: AdminCategoryRow) => {
    const confirmed = await confirmMajorAction({
      title: `Delete "${category.name}"?`,
      description:
        category.productCount > 0
          ? `This will permanently delete this category and ${category.productCount} product(s) in it.`
          : "This will permanently delete this category.",
      confirmLabel: "Delete category",
      variant: "danger",
    });
    if (!confirmed) return;

    setMutationError(null);
    setSuccessNote(null);
    setBusyId(category.id);

    try {
      await deleteCategory(category.id);
      dispatch(removeAdminCategory(category.id));
      if (editing?.id === category.id) closePanel();

      const message =
        category.productCount > 0
          ? `Category deleted with ${category.productCount} product(s).`
          : "Category deleted successfully.";
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to delete category.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to delete category.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <CategorySummaryCards
        totalCategories={categories.length}
        active={totals.active}
        productsMapped={totals.products}
      />

      <CategoriesToolbar
        query={query}
        statusFilter={statusFilter}
        visibleCount={visibleCategories.length}
        totalCount={categories.length}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onStatusChange={setStatusFilter}
        onRefresh={() => {
          void refreshCategories();
        }}
        onCreate={openCreatePanel}
      />

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

      <CategoriesTable
        categories={visibleCategories}
        isLoading={isLoading}
        totalCount={categories.length}
        busyId={busyId}
        onEdit={openEditPanel}
        onToggleVisibility={(category) => {
          void handleToggleVisibility(category);
        }}
        onDelete={(category) => {
          void handleDelete(category);
        }}
      />

      <CategoryFormDrawer
        open={panelOpen}
        mode={panelMode}
        editing={editing}
        form={form}
        isSubmitting={isSubmitting}
        onClose={closePanel}
        onChange={setForm}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
