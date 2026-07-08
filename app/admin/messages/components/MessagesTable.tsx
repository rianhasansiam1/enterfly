"use client";

import { Mail, MailOpen, Archive, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  formatDateTime,
  getInitials,
  type AdminMessageRow,
  type ContactMessageStatus,
} from "@/features/admin-messages/api";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/loading";

import MessageActionButton from "./MessageActionButton";
import { STATUS_BADGE } from "./constants";

export default function MessagesTable({
  messages,
  isLoading,
  totalCount,
  busyId,
  onOpen,
  onSetStatus,
  onDelete,
}: {
  messages: AdminMessageRow[];
  isLoading: boolean;
  totalCount: number;
  busyId: string | null;
  onOpen: (row: AdminMessageRow) => void;
  onSetStatus: (row: AdminMessageRow, next: ContactMessageStatus) => void;
  onDelete: (row: AdminMessageRow) => void;
}) {
  if (isLoading && totalCount === 0) {
    return <TableSkeleton rows={6} columns={5} caption="Loading messages" />;
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <Mail className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No messages match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
            <tr>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
            {messages.map((row) => {
              const isBusy = busyId === row.id;
              const isNew = row.status === "NEW";

              return (
                <motion.tr
                  key={row.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className={cn(
                    "border-t border-violet-100/70 align-top transition-colors hover:bg-violet-50/40",
                    isNew && "bg-violet-50/30",
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                        {getInitials(row.name, row.email)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-gray-900",
                            isNew ? "font-bold" : "font-semibold",
                          )}
                        >
                          {row.name || "—"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {row.email}
                          {row.phone ? ` · ${row.phone}` : ""}
                        </p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      className="block w-full text-left"
                    >
                      <p
                        className={cn(
                          "truncate text-gray-900",
                          isNew ? "font-bold" : "font-medium",
                        )}
                      >
                        {row.subject}
                      </p>
                      <p className="line-clamp-1 text-xs text-gray-500">
                        {row.message}
                      </p>
                    </button>
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
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.status !== "READ" && (
                        <MessageActionButton
                          tone="emerald"
                          busy={isBusy}
                          onClick={() => onSetStatus(row, "READ")}
                          icon={<MailOpen className="h-3.5 w-3.5" />}
                          label="Read"
                        />
                      )}
                      {row.status !== "ARCHIVED" && (
                        <MessageActionButton
                          tone="amber"
                          busy={isBusy}
                          onClick={() => onSetStatus(row, "ARCHIVED")}
                          icon={<Archive className="h-3.5 w-3.5" />}
                          label="Archive"
                        />
                      )}
                      <MessageActionButton
                        tone="red"
                        busy={isBusy}
                        onClick={() => onDelete(row)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Delete"
                      />
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
