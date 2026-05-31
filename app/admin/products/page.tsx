"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  setAdminProducts,
  setAdminProductsError,
  setAdminProductsLoading,
} from "@/store/slices/admin-products.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  buildFormFromProduct,
  EMPTY_FORM,
  fetchActiveCategories,
  fetchAllProductsSnapshot,
  normalizeImagesInput,
  parseNumericField,
} from "@/features/admin-products/api";
import type {
  AdminProduct,
  CategoryOption,
  ProductFormState,
  ProductStatus,
} from "@/features/admin-products/api";
import { readApiError } from "@/features/http/api-envelope";

import ProductsToolbar from "./components/ProductsToolbar";
import ProductsTable from "./components/ProductsTable";
import ProductFormDrawer from "./components/ProductFormDrawer";

export default function AdminProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.adminProducts.items);
  const isLoading = useSelector((state: RootState) => state.adminProducts.isLoading);
  const isHydrated = useSelector((state: RootState) => state.adminProducts.isHydrated);
  const error = useSelector((state: RootState) => state.adminProducts.error);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProductStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | string>("ALL");

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyActionProductId, setBusyActionProductId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    dispatch(setAdminProductsLoading(true));
    dispatch(setAdminProductsError(null));
    try {
      const items = await fetchAllProductsSnapshot();
      dispatch(setAdminProducts(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load products.";
      dispatch(setAdminProductsError(message));
    } finally {
      dispatch(setAdminProductsLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshProducts();
  }, [isHydrated, refreshProducts]);

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

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q) ||
        product.category.name.toLowerCase().includes(q) ||
        (product.description ?? "").toLowerCase().includes(q);

      const matchStatus = statusFilter === "ALL" || product.status === statusFilter;
      const matchCategory = categoryFilter === "ALL" || product.categoryId === categoryFilter;
      return matchQuery && matchStatus && matchCategory;
    });
  }, [categoryFilter, products, query, statusFilter]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutationError(null);
    setSuccessNote(null);

    const name = form.name.trim();
    if (!name) {
      setMutationError("Product name is required.");
      return;
    }
    if (!form.categoryId) {
      setMutationError("Category is required.");
      return;
    }

    let price: number;
    let stock: number;
    try {
      price = parseNumericField(form.price, "Price");
      stock = parseNumericField(form.stock, "Stock");
    } catch (parseError) {
      setMutationError(parseError instanceof Error ? parseError.message : "Invalid number.");
      return;
    }

    if (price < 0) {
      setMutationError("Price cannot be negative.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setMutationError("Stock must be a non-negative whole number.");
      return;
    }

    let discountPrice: number | null = null;
    if (form.discountPrice.trim()) {
      try {
        discountPrice = parseNumericField(form.discountPrice, "Discount price");
      } catch (parseError) {
        setMutationError(parseError instanceof Error ? parseError.message : "Invalid discount.");
        return;
      }
      if (discountPrice < 0) {
        setMutationError("Discount price cannot be negative.");
        return;
      }
      if (discountPrice > price) {
        setMutationError("Discount price cannot exceed regular price.");
        return;
      }
    }

    const description = form.description.trim() || null;
    const image = form.image.trim() || null;
    const images = normalizeImagesInput(form.images);
    const badge = form.badge.trim() || null;

    setIsSubmitting(true);
    try {
      if (panelMode === "create") {
        const body = {
          name,
          description,
          price,
          discountPrice,
          stock,
          image,
          images,
          badge,
          status: form.status,
          categoryId: form.categoryId,
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

        await refreshProducts();
        setSuccessNote("Product created successfully.");
        closePanel();
      } else {
        if (!editingProduct) throw new Error("No product selected for editing.");

        const patch: Record<string, unknown> = {};
        if (name !== editingProduct.name) patch.name = name;
        if (description !== (editingProduct.description ?? null)) patch.description = description;
        if (price !== editingProduct.price) patch.price = price;
        if (discountPrice !== editingProduct.discountPrice) patch.discountPrice = discountPrice;
        if (stock !== editingProduct.stock) patch.stock = stock;
        if (image !== (editingProduct.image ?? null)) patch.image = image;
        if (badge !== (editingProduct.badge ?? null)) patch.badge = badge;
        if (form.status !== editingProduct.status) patch.status = form.status;
        if (form.categoryId !== editingProduct.categoryId) patch.categoryId = form.categoryId;

        const sameImages =
          images.length === editingProduct.images.length &&
          images.every((value, index) => value === editingProduct.images[index]);
        if (!sameImages) patch.images = images;

        if (Object.keys(patch).length === 0) {
          setMutationError("No changes to save.");
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

        await refreshProducts();
        setSuccessNote("Product updated successfully.");
        closePanel();
      }
    } catch (mutation) {
      const message = mutation instanceof Error ? mutation.message : "Product mutation failed.";
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

      await refreshProducts();
      setSuccessNote(
        product.status === "ACTIVE"
          ? "Product hidden successfully."
          : "Product made visible successfully.",
      );
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update visibility.";
      setMutationError(message);
    } finally {
      setBusyActionProductId(null);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete "${product.name}"? This performs a soft delete (status -> INACTIVE).`,
      );
      if (!confirmed) return;
    }

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
        throw new Error(readApiError(payload, "Failed to delete product."));
      }

      await refreshProducts();
      setSuccessNote("Product deleted (hidden) successfully.");
    } catch (mutation) {
      const message = mutation instanceof Error ? mutation.message : "Failed to delete product.";
      setMutationError(message);
    } finally {
      setBusyActionProductId(null);
    }
  };

  return (
    <section className="space-y-4">
      <ProductsToolbar
        query={query}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        categoryOptions={categoryOptions}
        visibleCount={visibleProducts.length}
        totalCount={products.length}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        onRefresh={() => {
          void refreshProducts();
        }}
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
        products={visibleProducts}
        isLoading={isLoading}
        totalCount={products.length}
        busyActionProductId={busyActionProductId}
        onEdit={openEditPanel}
        onToggleHide={(product) => {
          void handleToggleHide(product);
        }}
        onDelete={(product) => {
          void handleDelete(product);
        }}
      />

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
