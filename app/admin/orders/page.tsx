"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Package2,
  RotateCcw,
  Search,
} from "lucide-react";
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
  formatCurrency,
  formatDateTime,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  patchOrderStatus,
  patchPaymentStatus,
  STATUS_TRANSITIONS,
  type AdminOrderRow,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/admin-orders/api";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PROCESSING: "bg-sky-50 text-sky-700 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UNPAID: "bg-amber-50 text-amber-700 ring-amber-200",
};

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
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total orders"
          value={orders.length.toLocaleString()}
          accent="violet"
        />
        <SummaryCard
          label="Revenue (excl. cancelled)"
          value={formatCurrency(totals.revenue)}
          accent="emerald"
        />
        <SummaryCard
          label="Pending / unpaid"
          value={`${totals.pending} pending · ${totals.unpaid} unpaid`}
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
                placeholder="Search by order #, customer, phone, email..."
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
              <option value="ALL">All status</option>
              {ORDER_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value as PaymentFilter)
              }
              className="h-10 rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            >
              <option value="ALL">All payments</option>
              {PAYMENT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void refreshOrders();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {visibleOrders.length} / {orders.length} orders
          </span>
          {isLoading && <span>Syncing orders...</span>}
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

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      {isLoading && orders.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading orders...
          </span>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
          <Package2 className="mx-auto mb-2 h-8 w-8 text-violet-300" />
          No orders match the current filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const isBusy = busyOrderId === order.id;
                  const isExpanded = expandedId === order.id;
                  const allowedNext = STATUS_TRANSITIONS[order.status];

                  return (
                    <Fragment key={order.id}>
                      <tr className="border-t border-violet-100/70 align-top">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : order.id)
                            }
                            className="inline-flex items-center gap-1 text-left font-semibold text-violet-700 transition hover:text-violet-900"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                isExpanded ? "rotate-180" : "",
                              )}
                            />
                            {order.orderNumber}
                          </button>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {order.id}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.customerPhone}
                          </p>
                          {order.user?.email && (
                            <p className="text-xs text-gray-400">
                              {order.user.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {order.itemsCount}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          {order.discountAmount > 0 && (
                            <p className="text-xs text-emerald-700">
                              -{formatCurrency(order.discountAmount)} discount
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                              STATUS_BADGE[order.status],
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                              PAYMENT_BADGE[order.paymentStatus],
                            )}
                          >
                            {order.paymentStatus}
                          </span>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.paymentMethod === "CASH_ON_DELIVERY"
                              ? "COD"
                              : order.paymentMethod}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-end gap-2">
                            {allowedNext.length > 0 ? (
                              <select
                                value=""
                                disabled={isBusy}
                                onChange={(event) => {
                                  const next = event.target.value as OrderStatus;
                                  if (!next) return;
                                  void handleChangeStatus(order, next);
                                }}
                                className="h-8 rounded-lg border border-violet-200 px-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">Change status</option>
                                {allowedNext.map((status) => (
                                  <option key={status} value={status}>
                                    Move to {status}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[11px] uppercase tracking-wide text-gray-400">
                                Final
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                void handleTogglePayment(order);
                              }}
                              disabled={isBusy || order.status === "CANCELLED"}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              Mark{" "}
                              {order.paymentStatus === "PAID"
                                ? "unpaid"
                                : "paid"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr
                          className="border-t border-violet-100/70 bg-violet-50/30"
                        >
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <DetailBlock label="Shipping address">
                                {order.customerAddress || "-"}
                              </DetailBlock>
                              <DetailBlock label="Subtotal / delivery">
                                {formatCurrency(order.subtotal)} +{" "}
                                {formatCurrency(order.deliveryCharge)} delivery
                              </DetailBlock>
                              <DetailBlock label="Last update">
                                {formatDateTime(order.updatedAt)}
                              </DetailBlock>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-700">{children}</p>
    </div>
  );
}
