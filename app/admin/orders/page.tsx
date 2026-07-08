"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminOrder,
  setAdminOrdersPage,
  setAdminOrdersError,
  setAdminOrdersLoading,
} from "@/store/slices/admin-orders.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAdminOrdersPage,
  patchOrderStatus,
  patchPaymentStatus,
  type AdminOrderRow,
  type AdminOrderQueryParams,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/admin-orders/api";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";

import OrderSummaryCards from "./components/OrderSummaryCards";
import OrdersToolbar from "./components/OrdersToolbar";
import OrdersTable from "./components/OrdersTable";

type StatusFilter = "ALL" | OrderStatus;
type PaymentFilter = "ALL" | PaymentStatus;

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector((state: RootState) => state.adminOrders.items);
  const meta = useSelector((state: RootState) => state.adminOrders.meta);
  const isLoading = useSelector(
    (state: RootState) => state.adminOrders.isLoading,
  );
  const error = useSelector((state: RootState) => state.adminOrders.error);

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Avoid re-fetching on mount when deps haven't changed
  const hasFetched = useRef(false);

  const fetchPage = useCallback(
    async (params: AdminOrderQueryParams) => {
      dispatch(setAdminOrdersLoading(true));
      dispatch(setAdminOrdersError(null));
      try {
        const result = await fetchAdminOrdersPage(params);
        dispatch(setAdminOrdersPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load orders.";
        dispatch(setAdminOrdersError(message));
      } finally {
        dispatch(setAdminOrdersLoading(false));
      }
    },
    [dispatch],
  );

  // Fetch whenever server query params change
  useEffect(() => {
    const params: AdminOrderQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (paymentFilter !== "ALL") params.paymentStatus = paymentFilter;

    hasFetched.current = true;
    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, paymentFilter, fetchPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePaymentChange = useCallback((value: PaymentFilter) => {
    setPaymentFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminOrderQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (paymentFilter !== "ALL") params.paymentStatus = paymentFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, statusFilter, paymentFilter, fetchPage]);

  const handleChangeStatus = async (
    order: AdminOrderRow,
    next: OrderStatus,
  ) => {
    if (next === "CANCELLED") {
      const confirmed = await confirmMajorAction({
        title: `Cancel order ${order.orderNumber}?`,
        description:
          "This will mark the order as cancelled and stop further processing.",
        confirmLabel: "Cancel order",
        variant: "danger",
      });
      if (!confirmed) return;
    }

    setMutationError(null);
    setSuccessNote(null);
    setBusyOrderId(order.id);
    try {
      await patchOrderStatus(order.id, next);
      dispatch(
        patchAdminOrder({
          id: order.id,
          changes: { status: next, updatedAt: new Date().toISOString() },
        }),
      );
      const message = `Order ${order.orderNumber} moved to ${next}.`;
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update status.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to update status.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleTogglePayment = async (order: AdminOrderRow) => {
    const next: PaymentStatus = order.paymentStatus === "PAID" ? "UNPAID" : "PAID";
    const confirmed = await confirmMajorAction({
      title:
        next === "PAID"
          ? `Confirm payment for ${order.orderNumber}?`
          : `Mark ${order.orderNumber} as unpaid?`,
      description:
        next === "PAID"
          ? "This marks the order as paid."
          : "This will remove the paid flag from this order.",
      confirmLabel: next === "PAID" ? "Confirm payment" : "Mark unpaid",
      variant: next === "PAID" ? "success" : "warning",
    });
    if (!confirmed) return;

    setMutationError(null);
    setSuccessNote(null);
    setBusyOrderId(order.id);
    try {
      await patchPaymentStatus(order.id, next);
      dispatch(
        patchAdminOrder({
          id: order.id,
          changes: {
            paymentStatus: next,
            updatedAt: new Date().toISOString(),
          },
        }),
      );
      const message = `Order ${order.orderNumber} marked as ${next.toLowerCase()}.`;
      setSuccessNote(message);
      notifyActionSuccess(message);
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to update payment status.";
      setMutationError(message);
      notifyActionError(mutation, "Failed to update payment status.");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <section className="space-y-4">
      <OrderSummaryCards
        totalOrders={meta?.total ?? 0}
        revenue={meta?.revenue ?? 0}
        pending={meta?.pendingCount ?? 0}
        unpaid={meta?.unpaidCount ?? 0}
      />

      <OrdersToolbar
        query={search}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
        total={meta?.total ?? 0}
        isLoading={isLoading}
        onQueryChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPaymentChange={handlePaymentChange}
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

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        meta={meta}
        busyOrderId={busyOrderId}
        expandedId={expandedId}
        onToggleExpand={setExpandedId}
        onChangeStatus={(order, next) => {
          void handleChangeStatus(order, next);
        }}
        onTogglePayment={(order) => {
          void handleTogglePayment(order);
        }}
        onPageChange={setPage}
      />
    </section>
  );
}
