"use client";

import { Loader2, MessageSquareText, Phone, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  formatDateTime,
  type AdminReviewRow,
  type ReviewSource,
} from "@/features/admin-reviews/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";

import Stars from "@/app/admin/components/Stars";

const SOURCE_BADGE: Record<ReviewSource, string> = {
  CUSTOMER: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
};

export default function ReviewsTable({
  reviews,
  isLoading,
  totalCount,
  busyId,
  onDelete,
}: {
  reviews: AdminReviewRow[];
  isLoading: boolean;
  totalCount: number;
  busyId: string | null;
  onDelete: (id: string) => void;
}) {
  if (isLoading && totalCount === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reviews...
        </span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <MessageSquareText className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No reviews match the current filters.
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
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
            {reviews.map((review) => {
              const isBusy = busyId === review.id;
              return (
                <motion.tr
                  key={review.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="border-t border-violet-100/70 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {review.product?.name ?? "Deleted product"}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-violet-600">
                      {review.product?.productCode ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {review.authorName}
                    </p>
                    {review.authorPhone ? (
                      <a
                        href={`tel:${review.authorPhone}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-violet-700 transition hover:text-violet-900 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {review.authorPhone}
                      </a>
                    ) : (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="h-3 w-3" />
                        {review.source === "ADMIN" ? "Admin-added" : "No phone"}
                      </p>
                    )}
                    {review.verified && (
                      <p className="text-xs text-emerald-600">
                        Verified purchase
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    {review.title && (
                      <p className="font-medium text-gray-900">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="mt-0.5 text-xs text-gray-600">
                        {review.comment}
                      </p>
                    )}
                    {!review.title && !review.comment && (
                      <span className="text-xs text-gray-400">
                        No written feedback
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        SOURCE_BADGE[review.source],
                      )}
                    >
                      {review.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDateTime(review.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onDelete(review.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
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
