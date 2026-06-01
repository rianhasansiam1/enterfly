"use client";

/**
 * ConfirmDialog — SweetAlert-style confirmation modal.
 *
 * Triggered imperatively via the `confirm` helper in `@/lib/feedback`:
 *
 *   import { confirm } from "@/lib/feedback";
 *
 *   const ok = await confirm({
 *     title: "Remove item?",
 *     description: "This will remove the item from your cart.",
 *     confirmLabel: "Remove",
 *     variant: "danger",
 *   });
 *   if (ok) { ... }
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { confirmEmitter, type ConfirmRequest } from "@/lib/feedback";

type ActiveDialog = ConfirmRequest & { resolve: (value: boolean) => void };

const ICON_MAP = {
  danger: Trash2,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
} as const;

const ICON_STYLE = {
  danger: "text-rose-500 bg-rose-100",
  warning: "text-amber-500 bg-amber-100",
  success: "text-emerald-500 bg-emerald-100",
  info: "text-violet-500 bg-violet-100",
} as const;

const CONFIRM_BTN = {
  danger: "bg-rose-600 hover:bg-rose-700 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  info: "bg-violet-600 hover:bg-violet-700 text-white",
} as const;

function Dialog({
  dialog,
  onClose,
}: {
  dialog: ActiveDialog;
  onClose: (value: boolean) => void;
}) {
  const variant = dialog.variant ?? "danger";
  const Icon = ICON_MAP[variant];

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-10000 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
      >
        {/* Icon */}
        <div
          className={cn(
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            ICON_STYLE[variant],
          )}
        >
          <Icon className="h-7 w-7" />
        </div>

        {/* Text */}
        <h2
          id="confirm-title"
          className="text-center text-lg font-bold text-gray-900"
        >
          {dialog.title}
        </h2>
        {dialog.description && (
          <p
            id="confirm-desc"
            className="mt-2 text-center text-sm leading-relaxed text-gray-500"
          >
            {dialog.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {dialog.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
              CONFIRM_BTN[variant],
            )}
          >
            {dialog.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ConfirmDialog() {
  const [active, setActive] = useState<ActiveDialog | null>(null);

  useEffect(() => {
    const unsub = confirmEmitter.subscribe((req) => {
      if (!req.resolve) return;
      setActive({ ...req, resolve: req.resolve });
    });
    return unsub;
  }, []);

  const handleClose = (value: boolean) => {
    active?.resolve(value);
    setActive(null);
  };

  return (
    <AnimatePresence>
      {active && <Dialog key="dialog" dialog={active} onClose={handleClose} />}
    </AnimatePresence>
  );
}
