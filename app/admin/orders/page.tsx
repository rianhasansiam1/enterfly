"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  patchAdminOrder,
  setAdminOrders,
  setAdminOrdersError,
  setAdminOrdersLoading,
} from "@/store/slices/admin-orders.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchAllAdminOrdersSnapshot,
  patchOrderStatus,
  patchPaymentStatus,
  type AdminOrderRow,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/admin-orders/api";

import OrderSummaryCards from "./components/OrderSummaryCards";
import OrdersToolbar from "./components/OrdersToolbar";
import OrdersTable from "./components/OrdersTable";

type StatusFilter = "ALL" | OrderStatus;
type PaymentFilter = "ALL" | PaymentStatus;

export default function AdminOrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector((state: RootState) => state.adminOrders.items);
  const isLoading = useSelector(
    (state: RootState) => state.adminOrders.isLoading,
  );
  const isHydrated = useSelector(
    (state: RootState) => state.adminOrders.isHydrated,
  );
  const error = useSelector((state: RootState) => state.adminOrders.error);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");

  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    dispatch(setAdminOrdersLoading(true));
    dispatch(setAdminOrdersError(null));
    try {
      const items = await fetchAllAdminOrdersSnapshot();
      dispatch(setAdminOrders(items));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load orders.";
      dispatch(setAdminOrdersError(message));
    } finally {
      dispatch(setAdminOrdersLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refreshOrders();
  }, [isHydrated, refreshOrders]);

  const visibleOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchQuery =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        (order.user?.email ?? "").toLowerCase().includes(q) ||
        (order.user?.name ?? "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      const matchPayment =
        paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

      return matchQuery && matchStatus && matchPayment;
    });
  }, [orders, paymentFilter, query, statusFilter]);

  const totals = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let unpaid = 0;
    for (const order of orders) {
      if (order.status !== "CANCELLED") revenue += order.totalAmount;
      if (order.status === "PENDING") pending += 1;
      if (order.paymentStatus === "UNPAID" && order.status !== "CANCELLED") {
        unpaid += 1;
      }
    }
    return { revenue, pending, unpaid };
  }, [orders]);

  const handleChangeStatus = async (
    order: AdminOrderRow,
    next: OrderStatus,
  ) => {
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
      setSuccessNote(`Order ${order.orderNumber} moved to ${next}.`);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to update status.";
      setMutationError(message);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleTogglePayment = async (order: AdminOrderRow) => {
    const next: PaymentStatus = order.paymentStatus === "PAID" ? "UNPAID" : "PAID";
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
      setSuccessNote(
        `Order ${order.orderNumber} marked as ${next.toLowerCase()}.`,
      );
    } catch (mutation) {
      const message =
        mutation instanceof Error
          ? mutation.message
          : "Failed to update payment status.";
      setMutationError(message);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <section className="space-y-4">
      <OrderSummaryCards
        totalOrders={orders.length}
        revenue={totals.revenue}
        pending={totals.pending}
        unpaid={totals.unpaid}
      />

      <OrdersToolbar
        query={query}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
        visibleCount={visibleOrders.length}
        totalCount={orders.length}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onStatusChange={setStatusFilter}
        onPaymentChange={setPaymentFilter}
        onRefresh={() => {
          void refreshOrders();
        }}
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
        orders={visibleOrders}
        isLoading={isLoading}
        totalCount={orders.length}
        busyOrderId={busyOrderId}
        expandedId={expandedId}
        onToggleExpand={setExpandedId}
        onChangeStatus={(order, next) => {
          void handleChangeStatus(order, next);
        }}
        onTogglePayment={(order) => {
          void handleTogglePayment(order);
        }}
      />
    </section>
  );
}
