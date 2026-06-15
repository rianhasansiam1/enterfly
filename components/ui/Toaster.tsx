"use client";

/**
 * Toaster — lightweight toast notification system.
 *
 * Usage (from anywhere, including server-action callbacks):
 *   import { toast } from "@/lib/feedback";
 *   toast.success("Added to cart");
 *   toast.error("Something went wrong");
 *   toast.info("Copied to clipboard");
 *   toast.warning("Only 2 left in stock");
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { toastEmitter, type ToastItem } from "@/lib/feedback";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-rose-50 border-rose-200 text-rose-800",
  info: "bg-violet-50 border-violet-200 text-violet-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
} as const;

const ICON_STYLES = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-violet-500",
  warning: "text-amber-500",
} as const;

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[item.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration ?? 3500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg",
        STYLES[item.type],
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_STYLES[item.type])} />
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-lg p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = toastEmitter.subscribe((item) => {
      setToasts((prev) => {
        // Deduplicate: if the same message is already visible, skip it.
        if (prev.some((t) => t.message === item.message && t.type === item.type)) {
          return prev;
        }
        return [...prev, item];
      });
    });
    return unsub;
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-6 right-4 z-9999 flex flex-col items-end gap-2 sm:right-6"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full max-w-sm">
            <ToastCard item={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
