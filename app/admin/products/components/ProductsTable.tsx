"use client";

/* eslint-disable @next/next/no-img-element */

import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { FALLBACK_IMAGE, type AdminProduct } from "@/features/admin-products/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";

/** Consistent BDT currency formatting for the admin table. */
function formatBDT(value: number): string {
  return `BDT ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function ProductsTable({
  products,
  isLoading,
  totalCount,
  busyActionProductId,
  onEdit,
  onToggleHide,
  onDelete,
}: {
  products: AdminProduct[];
  isLoading: boolean;
  totalCount: number;
  busyActionProductId: string | null;
  onEdit: (product: AdminProduct) => void;
  onToggleHide: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}) {
  if (isLoading && totalCount === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading products...
        </span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        No products found for current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Buying Price</th>
              <th className="px-4 py-3">Sale Price</th>
              <th className="px-4 py-3">Discount Price</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
            {products.map((product) => {
              const isBusy = busyActionProductId === product.id;
              return (
                <motion.tr
                  key={product.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="border-t border-violet-100/70"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image ?? FALLBACK_IMAGE}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg border border-violet-100 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="truncate font-mono text-xs text-violet-600">
                          {product.productCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {product.category.name}
                  </td>
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
                      {formatBDT(product.buyingPrice)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {formatBDT(product.salePrice)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {typeof product.discountPrice === "number" ? (
                      <p className="font-semibold text-emerald-700">
                        {formatBDT(product.discountPrice)}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleHide(product)}
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
                        onClick={() => onDelete(product)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
