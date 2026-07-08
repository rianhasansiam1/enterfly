"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminMessage,
  removeAdminMessage,
  setAdminMessagesPage,
  setAdminMessagesError,
  setAdminMessagesLoading,
} from "@/store/slices/admin-messages.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  deleteAdminMessage,
  fetchAdminMessagesPage,
  patchMessageStatus,
  type AdminMessageRow,
  type AdminMessageQueryParams,
  type ContactMessageStatus,
} from "@/features/admin-messages/api";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";
import { useAnimatedRemoval } from "@/hooks/useAnimatedRemoval";

import MessageSummaryCards from "./components/MessageSummaryCards";
import MessagesToolbar from "./components/MessagesToolbar";
import MessagesTable from "./components/MessagesTable";
import MessageDrawer from "./components/MessageDrawer";
import AdminPagination from "@/components/admin/AdminPagination";

type StatusFilter = "ALL" | ContactMessageStatus;

const PAGE_SIZE = 20;

export default function AdminMessagesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector(
    (state: RootState) => state.adminMessages.items,
  );
  const meta = useSelector((state: RootState) => state.adminMessages.meta);
  const isLoading = useSelector(
    (state: RootState) => state.adminMessages.isLoading,
  );
  const error = useSelector((state: RootState) => state.adminMessages.error);

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState<AdminMessageRow | null>(null);
  const { visibleItems: animatedMessages, queueRemoval: queueMessageRemoval } =
    useAnimatedRemoval({
      items: messages,
      getId: (message) => message.id,
    });

  const fetchPage = useCallback(
    async (params: AdminMessageQueryParams) => {
      dispatch(setAdminMessagesLoading(true));
      dispatch(setAdminMessagesError(null));
      try {
        const result = await fetchAdminMessagesPage(params);
        dispatch(setAdminMessagesPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load messages.";
        dispatch(setAdminMessagesError(message));
      } finally {
        dispatch(setAdminMessagesLoading(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const params: AdminMessageQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;

    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, fetchPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminMessageQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, fetchPage]);

  const handleSetStatus = async (
    row: AdminMessageRow,
    next: ContactMessageStatus,
    options?: { silent?: boolean },
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
      if (!options?.silent) {
        notifyActionSuccess("Message status updated.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update message.";
      setMutationError(message);
      if (!options?.silent) {
        notifyActionError(err, "Failed to update message.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: AdminMessageRow) => {
    const confirmed = await confirmMajorAction({
      title: `Delete message from ${row.name || row.email}?`,
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    queueMessageRemoval(
      row.id,
      async () => {
        setMutationError(null);
        setBusyId(row.id);
        try {
          await deleteAdminMessage(row.id);
          dispatch(removeAdminMessage(row.id));
          if (openMessage?.id === row.id) setOpenMessage(null);
          notifyActionSuccess("Message deleted.");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete message.";
          setMutationError(message);
          throw new Error(message);
        } finally {
          setBusyId(null);
        }
      },
      (error) => {
        notifyActionError(error, "Failed to delete message.");
      },
    );
  };

  const handleOpen = (row: AdminMessageRow) => {
    setOpenMessage(row);
    if (row.status === "NEW") {
      void handleSetStatus(row, "READ", { silent: true });
    }
  };

  return (
    <section className="space-y-4">
      <MessageSummaryCards
        newCount={meta?.newCount ?? 0}
        readCount={meta?.readCount ?? 0}
        archivedCount={meta?.archivedCount ?? 0}
      />

      <MessagesToolbar
        query={search}
        statusFilter={statusFilter}
        visibleCount={animatedMessages.length}
        totalCount={meta?.total ?? messages.length}
        isLoading={isLoading}
        onQueryChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onRefresh={handleRefresh}
      />

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

      <MessagesTable
        messages={animatedMessages}
        isLoading={isLoading}
        totalCount={meta?.total ?? messages.length}
        busyId={busyId}
        onOpen={handleOpen}
        onSetStatus={(row, next) => {
          void handleSetStatus(row, next);
        }}
        onDelete={(row) => {
          void handleDelete(row);
        }}
      />

      {meta && meta.totalPages > 1 && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={setPage}
        />
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
