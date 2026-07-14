"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setAdminProductsPage,
  setAdminProductsError,
  setAdminProductsLoading,
} from "@/store/slices/admin-products.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  buildFormFromProduct,
  EMPTY_FORM,
  fetchActiveCategories,
  fetchAdminProductsPage,
  normalizeImagesInput,
  parseNumericField,
} from "@/features/admin-products/api";
import type {
  AdminProduct,
  AdminProductQueryParams,
  CategoryOption,
  ProductFormState,
  ProductStatus,
} from "@/features/admin-products/api";
import { readApiError } from "@/features/http/api-envelope";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";

import ProductsToolbar from "./components/ProductsToolbar";
import ProductsTable from "./components/ProductsTable";
import ProductFormDrawer from "./components/ProductFormDrawer";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.adminProducts.items);
  const meta = useSelector((state: RootState) => state.adminProducts.meta);
  const isLoading = useSelector((state: RootState) => state.adminProducts.isLoading);
  const error = useSelector((state: RootState) => state.adminProducts.error);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProductStatus>("ACTIVE");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | string>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyActionProductId, setBusyActionProductId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (params: AdminProductQueryParams) => {
      dispatch(setAdminProductsLoading(true));
      dispatch(setAdminProductsError(null));
      try {
        const result = await fetchAdminProductsPage(params);
        dispatch(setAdminProductsPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load products.";
        dispatch(setAdminProductsError(message));
      } finally {
        dispatch(setAdminProductsLoading(false));
      }
    },
    [dispatch],
  );

  // Fetch whenever server query params change
  useEffect(() => {
    const params: AdminProductQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (categoryFilter !== "ALL") params.categoryId = categoryFilter;

    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, categoryFilter, fetchPage]);

  // Fetch categories for the form dropdown (one-time)
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const rows = await fetchActiveCategories();
        if (!ignore) {
          setCategories(rows);
          setCategoriesError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load categories.";
          setCategoriesError(message);
        }
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const product of products) {
      if (product.categoryId && product.category.name) {
        options.set(product.categoryId, product.category.name);
      }
    }
    for (const category of categories) {
      options.set(category.id, category.name);
    }
    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, products]);

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: "ALL" | ProductStatus) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: "ALL" | string) => {
    setCategoryFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminProductQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (categoryFilter !== "ALL") params.categoryId = categoryFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, categoryFilter, fetchPage]);

  const openCreatePanel = () => {
    setPanelMode("create");
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM, categoryId: categoryOptions[0]?.id ?? "" });
    setMutationError(null);
    setPanelOpen(true);
  };

  const openEditPanel = (product: AdminProduct) => {
    setPanelMode("edit");
    setEditingProduct(product);
    setForm(buildFormFromProduct(product));
    setMutationError(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setMutationError(null);
  };

  const showSubmitError = (message: string) => {
    setMutationError(message);
    notifyActionError(message, message);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutationError(null);
    setSuccessNote(null);

    const name = form.name.trim();
    if (!name) {
      showSubmitError("Product name is required.");
      return;
    }
    if (!form.categoryId) {
      showSubmitError("Category is required.");
      return;
    }

    let buyingPrice: number;
    let salePrice: number;
    try {
      buyingPrice = parseNumericField(form.buyingPrice, "Buying price");
      salePrice = parseNumericField(form.salePrice, "Sale price");
    } catch (parseError) {
      showSubmitError(parseError instanceof Error ? parseError.message : "Invalid number.");
      return;
    }

    if (buyingPrice < 0) {
      showSubmitError("Buying price cannot be negative.");
      return;
    }
    if (salePrice < 0) {
      showSubmitError("Sale price cannot be negative.");
      return;
    }

    let discountPrice: number | null = null;
    if (form.discountPrice.trim()) {
      try {
        discountPrice = parseNumericField(form.discountPrice, "Discount price");
      } catch (parseError) {
        showSubmitError(parseError instanceof Error ? parseError.message : "Invalid discount.");
        return;
      }
      if (discountPrice < 0) {
        showSubmitError("Discount price cannot be negative.");
        return;
      }
      if (discountPrice > salePrice) {
        showSubmitError("Discount price cannot exceed the sale price.");
        return;
      }
    }

    // Build + validate the variant rows.
    if (form.variants.length === 0) {
      showSubmitError("Add at least one variant (size + color).");
      return;
    }

    const comboSeen = new Set<string>();
    const skuSeen = new Set<string>();
    const variantPayload: {
      id?: string;
      size: string;
      color: string;
      sku: string | null;
      stock: number;
      image: string | null;
      isActive: boolean;
    }[] = [];

    for (const [index, row] of form.variants.entries()) {
      const size = row.size.trim();
      const color = row.color.trim();
      if (!size || !color) {
        showSubmitError(`Variant ${index + 1}: size and color are required.`);
        return;
      }
      const comboKey = `${size.toLowerCase()}|${color.toLowerCase()}`;
      if (comboSeen.has(comboKey)) {
        showSubmitError(
          `Duplicate size + color combination: "${size} / ${color}".`,
        );
        return;
      }
      comboSeen.add(comboKey);

      let stock: number;
      try {
        stock = parseNumericField(row.stock, `Variant ${index + 1} stock`);
      } catch (parseError) {
        showSubmitError(parseError instanceof Error ? parseError.message : "Invalid stock.");
        return;
      }
      if (!Number.isInteger(stock) || stock < 0) {
        showSubmitError(`Variant ${index + 1}: stock must be a non-negative whole number.`);
        return;
      }

      const sku = row.sku.trim() || null;
      if (sku) {
        const skuKey = sku.toLowerCase();
        if (skuSeen.has(skuKey)) {
          showSubmitError(`Duplicate SKU: "${sku}".`);
          return;
        }
        skuSeen.add(skuKey);
      }

      variantPayload.push({
        ...(row.id ? { id: row.id } : {}),
        size,
        color,
        sku,
        stock,
        image: row.image.trim() || null,
        isActive: row.isActive,
      });
    }

    const description = form.description.trim() || null;
    const image = form.image.trim() || null;
    const images = normalizeImagesInput(form.images);

    setIsSubmitting(true);
    try {
      if (panelMode === "create") {
        const body = {
          name,
          description,
          buyingPrice,
          salePrice,
          discountPrice,
          image,
          images,
          status: form.status,
          categoryId: form.categoryId,
          variants: variantPayload,
        };

        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });
        const payload = (await response.json()) as unknown;
        if (!response.ok) {
          throw new Error(readApiError(payload, "Failed to create product."));
        }

        handleRefresh();
        const message = "Product created successfully.";
        setSuccessNote(message);
        notifyActionSuccess(message);
        closePanel();
      } else {
        if (!editingProduct) throw new Error("No product selected for editing.");

        const patch: Record<string, unknown> = {};
        if (name !== editingProduct.name) patch.name = name;
        if (description !== (editingProduct.description ?? null)) patch.description = description;
        if (buyingPrice !== editingProduct.buyingPrice) patch.buyingPrice = buyingPrice;
        if (salePrice !== editingProduct.salePrice) patch.salePrice = salePrice;
        if (discountPrice !== editingProduct.discountPrice) patch.discountPrice = discountPrice;
        if (image !== (editingProduct.image ?? null)) patch.image = image;
        if (form.status !== editingProduct.status) patch.status = form.status;
        if (form.categoryId !== editingProduct.categoryId) patch.categoryId = form.categoryId;

        const sameImages =
          images.length === editingProduct.images.length &&
          images.every((value, index) => value === editingProduct.images[index]);
        if (!sameImages) patch.images = images;

        const currentVariants = editingProduct.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
          image: v.image,
          isActive: v.isActive,
        }));
        const nextVariants = variantPayload.map((v) => ({
          id: v.id ?? null,
          size: v.size,
          color: v.color,
          sku: v.sku,
          stock: v.stock,
          image: v.image,
          isActive: v.isActive,
        }));
        const variantsChanged =
          JSON.stringify(
            currentVariants.map((v) => ({ ...v, id: v.id ?? null })),
          ) !== JSON.stringify(nextVariants);
        if (variantsChanged) patch.variants = variantPayload;

        if (Object.keys(patch).length === 0) {
          showSubmitError("No changes to save.");
          return;
        }

        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
          cache: "no-store",
        });
        const payload = (await response.json()) as unknown;
        if (!response.ok) {
          throw new Error(readApiError(payload, "Failed to update product."));
        }

        handleRefresh();
        const message = "Product updated successfully.";
        setSuccessNote(message);
        notifyActionSuccess(message);
        closePanel();
      }
    } catch (mutation) {
      const message = notifyActionError(mutation, "Product mutation failed.");
      setMutationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHide = async (product: AdminProduct) => {
    setMutationError(null);
    setSuccessNote(null);
    setBusyActionProductId(product.id);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
        cache: "no-store",
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(readApiError(payload, "Failed to update visibility."));
      }

      handleRefresh();
      const message =
        product.status === "ACTIVE"
          ? "Product hidden successfully."
          : "Product made visible successfully.";
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update visibility.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to update visibility.");
    } finally {
      setBusyActionProductId(null);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    const confirmed = await confirmMajorAction({
      title: `Remove "${product.name}" from the storefront?`,
      description:
        "This will move the product to Inactive. Catalog data, order history, reviews, and analytics stay intact.",
      confirmLabel: "Move to inactive",
      variant: "danger",
    });
    if (!confirmed) return;

    setMutationError(null);
    setSuccessNote(null);
    setBusyActionProductId(product.id);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(readApiError(payload, "Failed to deactivate product."));
      }

      handleRefresh();
      const message = "Product moved to inactive successfully.";
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to deactivate product.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to deactivate product.");
    } finally {
      setBusyActionProductId(null);
    }
  };

  return (
    <section className="space-y-4">
      <ProductsToolbar
        query={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        categoryOptions={categoryOptions}
        visibleCount={products.length}
        totalCount={meta?.total ?? products.length}
        isLoading={isLoading}
        onQueryChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        onRefresh={handleRefresh}
        onCreate={openCreatePanel}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {categoriesError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {categoriesError}
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

      <ProductsTable
        products={products}
        isLoading={isLoading}
        totalCount={meta?.total ?? products.length}
        busyActionProductId={busyActionProductId}
        onEdit={openEditPanel}
        onToggleHide={(product) => {
          void handleToggleHide(product);
        }}
        onDelete={(product) => {
          void handleDelete(product);
        }}
      />

      {meta && meta.totalPages > 1 && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}

      <ProductFormDrawer
        open={panelOpen}
        mode={panelMode}
        form={form}
        categoryOptions={categoryOptions}
        isSubmitting={isSubmitting}
        onClose={closePanel}
        onChange={setForm}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
