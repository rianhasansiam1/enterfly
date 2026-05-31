"use client";

import { Image as ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";

export function RowFooter({
  busyId,
  banner,
  onEdit,
  onDelete,
}: {
  busyId: string | null;
  banner: { id: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isBusy = busyId === banner.id;
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
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
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-violet-300" />
      {label}
    </div>
  );
}
