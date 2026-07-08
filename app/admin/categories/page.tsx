"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminCategory,
  setAdminCategoriesPage,
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
  fetchAdminCategoriesPage,
  updateCategory,
  type AdminCategoryRow,
  type AdminCategoryQueryParams,
  type CategoryFormState,
  type CategoryStatus,
} from "@/features/admin-categories/api";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";

import CategorySummaryCards from "./components/CategorySummaryCards";
import CategoriesToolbar from "./components/CategoriesToolbar";
import CategoriesTable from "./components/CategoriesTable";
import CategoryFormDrawer from "./components/CategoryFormDrawer";
import AdminPagination from "@/components/admin/AdminPagination";

type StatusFilter = "ALL" | CategoryStatus;

const PAGE_SIZE = 20;

export default function AdminCategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector(
    (state: RootState) => state.adminCategories.items,
  );
  const meta = useSelector((state: RootState) => state.adminCategories.meta);
  const isLoading = useSelector(
    (state: RootState) => state.adminCategories.isLoading,
  );
  const error = useSelector((state: RootState) => state.adminCategories.error);

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");

  const debouncedSearch = useDebounce(search, 300);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (params: AdminCategoryQueryParams) => {
      dispatch(setAdminCategoriesLoading(true));
      dispatch(setAdminCategoriesError(null));
      try {
        const result = await fetchAdminCategoriesPage(params);
        dispatch(setAdminCategoriesPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load categories.";
        dispatch(setAdminCategoriesError(message));
      } finally {
        dispatch(setAdminCategoriesLoading(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const params: AdminCategoryQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;

    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, fetchPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminCategoryQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, fetchPage]);

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
      title: `Remove "${category.name}" from the storefront?`,
      description:
        category.productCount > 0
          ? `This will move the category and ${category.productCount} product(s) in it to Inactive. History and analytics stay intact.`
          : "This will move the category to Inactive. History and analytics stay intact.",
      confirmLabel: "Move to inactive",
      variant: "danger",
    });
    if (!confirmed) return;

    setMutationError(null);
    setSuccessNote(null);
    setBusyId(category.id);

    try {
      await deleteCategory(category.id);
      handleRefresh();
      if (editing?.id === category.id) closePanel();

      const message =
        category.productCount > 0
          ? `Category and ${category.productCount} product(s) moved to inactive.`
          : "Category moved to inactive.";
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to deactivate category.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to deactivate category.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <CategorySummaryCards
        totalCategories={meta?.total ?? categories.length}
        active={meta?.activeCount ?? 0}
        productsMapped={meta?.totalProducts ?? 0}
      />

      <CategoriesToolbar
        query={search}
        statusFilter={statusFilter}
        visibleCount={categories.length}
        totalCount={meta?.total ?? categories.length}
        isLoading={isLoading}
        onQueryChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onRefresh={handleRefresh}
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
        categories={categories}
        isLoading={isLoading}
        totalCount={meta?.total ?? categories.length}
        busyId={busyId}
        onEdit={openEditPanel}
        onToggleVisibility={(category) => {
          void handleToggleVisibility(category);
        }}
        onDelete={(category) => {
          void handleDelete(category);
        }}
      />

      {meta && meta.totalPages > 1 && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}

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
