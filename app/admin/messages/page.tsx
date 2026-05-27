"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminMessage,
  removeAdminMessage,
  setAdminMessages,
  setAdminMessagesError,
  setAdminMessagesLoading,
} from "@/store/slices/admin-messages.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  deleteAdminMessage,
  fetchAllAdminMessagesSnapshot,
  formatDateTime,
  getInitials,
  patchMessageStatus,
  STATUS_VALUES,
  type AdminMessageRow,
  type ContactMessageStatus,
} from "@/features/admin-messages/api";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<ContactMessageStatus, string> = {
  NEW: "bg-violet-50 text-violet-700 ring-violet-200",
  READ: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-gray-100 text-gray-600 ring-gray-200",
};

type StatusFilter = "ALL" | ContactMessageStatus;

export default function AdminMessagesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector(
    (state: RootState) => state.adminMessages.items,
  );
  const isLoading = useSelector(
    (state: RootState) => state.adminMessages.isLoading,
  );
  const isHydrated = useSelector(
    (state: RootState) => state.adminMessages.isHydrated,
  );
  const error = useSelector((state: RootState) => state.adminMessages.error);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState<AdminMessageRow | null>(null);

  const refreshMessages = useCallback(async () => {
    dispatch(setAdminMessagesLoading(true));
    dispatch(setAdminMessagesError(null));
    try {
      const items = await fetchAllAdminMessagesSnapshot();
      dispatch(setAdminMessages(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load messages.";
      dispatch(setAdminMessagesError(message));
    } finally {
      dispatch(setAdminMessagesLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshMessages();
  }, [isHydrated, refreshMessages]);

  const visibleMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((row) => {
      const matchQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.phone ?? "").toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || row.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [messages, query, statusFilter]);

  const totals = useMemo(() => {
    let newCount = 0;
    let readCount = 0;
    let archivedCount = 0;
    for (const row of messages) {
      if (row.status === "NEW") newCount += 1;
      else if (row.status === "READ") readCount += 1;
      else if (row.status === "ARCHIVED") archivedCount += 1;
    }
    return { newCount, readCount, archivedCount };
  }, [messages]);

  const handleSetStatus = async (
    row: AdminMessageRow,
    next: ContactMessageStatus,
  ) => {
    if (row.status === next) return;
    setMutationError(null);
    setBusyId(row.id);
    try {
      const updated = await patchMessageStatus(row.id, next);
      dispatch(
        patchAdminMessage({
          id: row.id,
          changes: {
            status: updated.status,
            updatedAt: updated.updatedAt,
          },
        }),
      );
      if (openMessage?.id === row.id) {
        setOpenMessage({ ...openMessage, status: updated.status });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update message.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: AdminMessageRow) => {
    if (
      !window.confirm(`Delete message from ${row.name || row.email}?`)
    ) {
      return;
    }
    setMutationError(null);
    setBusyId(row.id);
    try {
      await deleteAdminMessage(row.id);
      dispatch(removeAdminMessage(row.id));
      if (openMessage?.id === row.id) setOpenMessage(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete message.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleOpen = (row: AdminMessageRow) => {
    setOpenMessage(row);
    if (row.status === "NEW") {
      void handleSetStatus(row, "READ");
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Inbox className="h-4 w-4" />}
          label="New"
          value={totals.newCount.toLocaleString()}
          accent="violet"
        />
        <SummaryCard
          icon={<MailOpen className="h-4 w-4" />}
          label="Read"
          value={totals.readCount.toLocaleString()}
          accent="emerald"
        />
        <SummaryCard
          icon={<Archive className="h-4 w-4" />}
          label="Archived"
          value={totals.archivedCount.toLocaleString()}
          accent="amber"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email, subject, or content..."
                className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All statuses</option>
              {STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void refreshMessages();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {visibleMessages.length} / {messages.length} messages
          </span>
          {isLoading && <span>Syncing messages...</span>}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {isLoading && messages.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading messages...
          </span>
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
          <Mail className="mx-auto mb-2 h-8 w-8 text-violet-300" />
          No messages match the current filters.
        </div>
      ) : (
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
                {visibleMessages.map((row) => {
                  const isBusy = busyId === row.id;
                  const isNew = row.status === "NEW";

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-t border-violet-100/70 align-top transition-colors hover:bg-violet-50/40",
                        isNew && "bg-violet-50/30",
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpen(row)}
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
                          onClick={() => handleOpen(row)}
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
                            <ActionButton
                              tone="emerald"
                              busy={isBusy}
                              onClick={() => {
                                void handleSetStatus(row, "READ");
                              }}
                              icon={<MailOpen className="h-3.5 w-3.5" />}
                              label="Read"
                            />
                          )}
                          {row.status !== "ARCHIVED" && (
                            <ActionButton
                              tone="amber"
                              busy={isBusy}
                              onClick={() => {
                                void handleSetStatus(row, "ARCHIVED");
                              }}
                              icon={<Archive className="h-3.5 w-3.5" />}
                              label="Archive"
                            />
                          )}
                          <ActionButton
                            tone="red"
                            busy={isBusy}
                            onClick={() => {
                              void handleDelete(row);
                            }}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            label="Delete"
                          />
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

      {openMessage && (
        <MessageDrawer
          message={openMessage}
          onClose={() => setOpenMessage(null)}
          onSetStatus={(next) => {
            void handleSetStatus(openMessage, next);
          }}
          onDelete={() => {
            void handleDelete(openMessage);
          }}
          isBusy={busyId === openMessage.id}
        />
      )}
    </section>
  );
}

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-xl bg-linear-to-r px-3 py-1.5 text-sm font-bold",
          ACCENT_STYLES[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}

type ActionTone = "emerald" | "amber" | "red";

const ACTION_TONE: Record<ActionTone, string> = {
  emerald: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  amber: "border-amber-200 text-amber-700 hover:bg-amber-50",
  red: "border-red-200 text-red-700 hover:bg-red-50",
};

function ActionButton({
  tone,
  busy,
  onClick,
  icon,
  label,
}: {
  tone: ActionTone;
  busy: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        ACTION_TONE[tone],
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function MessageDrawer({
  message,
  onClose,
  onSetStatus,
  onDelete,
  isBusy,
}: {
  message: AdminMessageRow;
  onClose: () => void;
  onSetStatus: (next: ContactMessageStatus) => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-70 flex items-end justify-end bg-gray-900/40 backdrop-blur-sm sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-violet-100 bg-linear-to-r from-violet-50 to-indigo-50 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">
              {message.subject}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {message.name} · {message.email}
              {message.phone ? ` · ${message.phone}` : ""}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-violet-500">
              Received {formatDateTime(message.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
              STATUS_BADGE[message.status],
            )}
          >
            {message.status}
          </span>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
            {message.message}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          {message.status !== "READ" && (
            <ActionButton
              tone="emerald"
              busy={isBusy}
              onClick={() => onSetStatus("READ")}
              icon={<MailOpen className="h-3.5 w-3.5" />}
              label="Mark as read"
            />
          )}
          {message.status !== "ARCHIVED" && (
            <ActionButton
              tone="amber"
              busy={isBusy}
              onClick={() => onSetStatus("ARCHIVED")}
              icon={<Archive className="h-3.5 w-3.5" />}
              label="Archive"
            />
          )}
          {message.status === "ARCHIVED" && (
            <ActionButton
              tone="emerald"
              busy={isBusy}
              onClick={() => onSetStatus("NEW")}
              icon={<Inbox className="h-3.5 w-3.5" />}
              label="Move to inbox"
            />
          )}
          <ActionButton
            tone="red"
            busy={isBusy}
            onClick={onDelete}
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
          />
        </div>
      </div>
    </div>
  );
}
