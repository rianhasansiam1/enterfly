"use client";

import { Pencil, Ticket, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { LoadingSpinner } from "@/components/ui/loading";
import {
  formatCurrency,
  formatDate,
  type PromoCodeRow,
  type PromoCodeStatus,
  type PromoDiscountType,
} from "@/features/admin-settings/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<PromoCodeStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-200",
};

const TYPE_BADGE: Record<PromoDiscountType, string> = {
  FLAT: "bg-violet-50 text-violet-700 ring-violet-200",
  PERCENT: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function PromoCodesTable({
  promos,
  currency,
  busyPromoId,
  onEdit,
  onDelete,
}: {
  promos: PromoCodeRow[];
  currency: string;
  busyPromoId: string | null;
  onEdit: (promo: PromoCodeRow) => void;
  onDelete: (promo: PromoCodeRow) => void;
}) {
  if (promos.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <Ticket className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No promo codes yet. Create your first to start running campaigns.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Conditions</th>
              <th className="px-4 py-3">Active window</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
            {promos.map((promo) => {
              const isBusy = busyPromoId === promo.id;
              const valueLabel =
                promo.discountType === "PERCENT"
                  ? `${promo.value}%`
                  : formatCurrency(promo.value, currency);

              return (
                <motion.tr
                  key={promo.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="border-t border-violet-100/70 align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm font-bold uppercase text-violet-700">
                      {promo.code}
                    </p>
                    {promo.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {promo.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        TYPE_BADGE[promo.discountType],
                      )}
                    >
                      {promo.discountType}
                    </span>
                    <p className="mt-1 font-semibold text-gray-900">
                      {valueLabel}
                    </p>
                    {promo.maxDiscount != null &&
                      promo.discountType === "PERCENT" && (
                        <p className="text-xs text-gray-500">
                          Max {formatCurrency(promo.maxDiscount, currency)}
                        </p>
                      )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {promo.minOrder != null ? (
                      <p>
                        Min order:{" "}
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(promo.minOrder, currency)}
                        </span>
                      </p>
                    ) : (
                      <p>No minimum</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>From: {formatDate(promo.startsAt)}</p>
                    <p>To: {formatDate(promo.endsAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">
                      {promo.usedCount}
                      {promo.usageLimit != null && (
                        <span className="font-normal text-gray-500">
                          {" "}
                          / {promo.usageLimit}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                        STATUS_BADGE[promo.status],
                      )}
                    >
                      {promo.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(promo)}
                        disabled={isBusy}
                        aria-busy={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(promo)}
                        disabled={isBusy}
                        aria-busy={isBusy}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? (
                          <LoadingSpinner size="xs" />
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
