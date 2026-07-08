"use client";

import { Fragment } from "react";
import { ChevronDown, Package2 } from "lucide-react";

import {
  formatCurrency,
  formatDateTime,
  STATUS_TRANSITIONS,
  type AdminOrderRow,
  type ApiMeta,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/admin-orders/api";
import { ORDER_STATUS_META } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import AdminPagination from "@/components/admin/AdminPagination";
import { LoadingSpinner, TableSkeleton } from "@/components/ui/loading";

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UNPAID: "bg-amber-50 text-amber-700 ring-amber-200",
};

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

export default function OrdersTable({
  orders,
  isLoading,
  meta,
  busyOrderId,
  expandedId,
  onToggleExpand,
  onChangeStatus,
  onTogglePayment,
  onPageChange,
}: {
  orders: AdminOrderRow[];
  isLoading: boolean;
  meta: ApiMeta | null;
  busyOrderId: string | null;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  onChangeStatus: (order: AdminOrderRow, next: OrderStatus) => void;
  onTogglePayment: (order: AdminOrderRow) => void;
  onPageChange: (page: number) => void;
}) {
  if (isLoading && orders.length === 0) {
    return <TableSkeleton rows={6} columns={8} caption="Loading orders" />;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
        <Package2 className="mx-auto mb-2 h-8 w-8 text-violet-300" />
        No orders match the current filters.
      </div>
    );
  }

  return (
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
            {orders.map((order) => {
              const isBusy = busyOrderId === order.id;
              const isExpanded = expandedId === order.id;
              const allowedNext = STATUS_TRANSITIONS[order.status];

              return (
                <Fragment key={order.id}>
                  <tr className="border-t border-violet-100/70 align-top">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(isExpanded ? null : order.id)}
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
                          ORDER_STATUS_META[order.status].tone.ring,
                        )}
                      >
                        {ORDER_STATUS_META[order.status].label}
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
                              onChangeStatus(order, next);
                            }}
                            className="h-8 rounded-lg border border-violet-200 px-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">Change status</option>
                            {allowedNext.map((status) => (
                              <option key={status} value={status}>
                                Move to {ORDER_STATUS_META[status].label}
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
                          onClick={() => onTogglePayment(order)}
                          disabled={isBusy || order.status === "CANCELLED"}
                          aria-busy={isBusy || undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy && <LoadingSpinner size="xs" />}
                          Mark{" "}
                          {order.paymentStatus === "PAID" ? "unpaid" : "paid"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-t border-violet-100/70 bg-violet-50/30">
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

      {meta && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
