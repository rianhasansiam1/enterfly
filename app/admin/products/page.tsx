"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
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
  FALLBACK_IMAGE,
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
import { cn } from "@/lib/utils";

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
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, id, category..."
              className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | ProductStatus)}
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshProducts();
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
              Create Product
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {visibleProducts.length} / {products.length} products
          </span>
          {isLoading && <span>Syncing products...</span>}
        </div>
      </div>

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

      {isLoading && products.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products...
          </span>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
          No products found for current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const isBusy = busyActionProductId === product.id;
                  return (
                    <tr key={product.id} className="border-t border-violet-100/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image ?? FALLBACK_IMAGE}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border border-violet-100 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{product.name}</p>
                            <p className="truncate text-xs text-gray-500">{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product.category.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-semibold",
                            product.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product.stock}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          BDT {product.price.toLocaleString()}
                        </p>
                        {typeof product.discountPrice === "number" && (
                          <p className="text-xs text-emerald-700">
                            Discount BDT {product.discountPrice.toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPanel(product)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleToggleHide(product);
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {product.status === "ACTIVE" ? (
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
                              void handleDelete(product);
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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
              {panelMode === "create" ? "Create Product" : "Edit Product"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              {panelMode === "create"
                ? "Add product details and publish immediately."
                : "Update product details and visibility."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <Field label="Name" required>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Product name"
                />
              </Field>

              <Field label="Category" required>
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, categoryId: event.target.value }))
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
                      setForm((prev) => ({ ...prev, price: event.target.value }))
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
                      setForm((prev) => ({ ...prev, discountPrice: event.target.value }))
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
                      setForm((prev) => ({ ...prev, stock: event.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="0"
                  />
                </Field>

                <Field label="Status" required>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
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

              <Field label="Badge">
                <input
                  value={form.badge}
                  onChange={(event) => setForm((prev) => ({ ...prev, badge: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Bestseller / New"
                />
              </Field>

              <Field label="Primary Image URL">
                <input
                  value={form.image}
                  onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="https://..."
                />
              </Field>

              <Field label="Extra Image URLs">
                <textarea
                  value={form.images}
                  onChange={(event) => setForm((prev) => ({ ...prev, images: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
                  placeholder="One per line or comma-separated"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
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
                  {panelMode === "create" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </section>
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
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label} {required ? "*" : ""}
      </span>
      {children}
    </label>
  );
}
