"use client";

import { Loader2, MessageSquareQuote, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  formatDate,
  type AdminTestimonialRow,
  type TestimonialStatus,
} from "@/features/admin-testimonials/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";

import Stars from "@/app/admin/components/Stars";

const STATUS_BADGE: Record<TestimonialStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 ring-gray-200",
};

export default function TestimonialsTable({
  testimonials,
  isLoading,
  totalCount,
  busyId,
  onEdit,
  onDelete,
}: {
  testimonials: AdminTestimonialRow[];
  isLoading: boolean;
  totalCount: number;
  busyId: string | null;
  onEdit: (row: AdminTestimonialRow) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading && totalCount === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading testimonials...
        </span>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <MessageSquareQuote className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No testimonials yet. Add one to populate the About page.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Reviewer</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Testimonial</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
            {testimonials.map((row) => {
              const isBusy = busyId === row.id;
              return (
                <motion.tr
                  key={row.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="border-t border-violet-100/70 align-top"
                >
                  <td className="px-4 py-3 text-gray-500">{row.position}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          row.image ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            row.name,
                          )}`
                        }
                        alt={row.name}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-violet-100"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{row.name}</p>
                        {row.location && (
                          <p className="text-xs text-gray-500">{row.location}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Stars rating={row.rating} />
                  </td>
                  <td className="max-w-sm px-4 py-3">
                    <p className="line-clamp-3 text-xs text-gray-600">
                      {row.text}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        STATUS_BADGE[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
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
