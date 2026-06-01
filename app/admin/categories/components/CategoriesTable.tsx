"use client";

/* eslint-disable @next/next/no-img-element */

import { Eye, EyeOff, FolderTree, Loader2, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  formatDate,
  type AdminCategoryRow,
  type CategoryStatus,
} from "@/features/admin-categories/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<CategoryStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function CategoriesTable({
  categories,
  isLoading,
  totalCount,
  busyId,
  onEdit,
  onToggleVisibility,
  onDelete,
}: {
  categories: AdminCategoryRow[];
  isLoading: boolean;
  totalCount: number;
  busyId: string | null;
  onEdit: (category: AdminCategoryRow) => void;
  onToggleVisibility: (category: AdminCategoryRow) => void;
  onDelete: (category: AdminCategoryRow) => void;
}) {
  if (isLoading && totalCount === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading categories...
        </span>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <FolderTree className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No categories match the current filters.
      </div>
    );
  }

  return (
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
            <AnimatePresence initial={false}>
            {categories.map((category) => {
              const isBusy = busyId === category.id;

              return (
                <motion.tr
                  key={category.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
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
                        onClick={() => onEdit(category)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleVisibility(category)}
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
                        onClick={() => onDelete(category)}
                        disabled={isBusy}
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
