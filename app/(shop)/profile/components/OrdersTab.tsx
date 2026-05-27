"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  RotateCcw,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import {
  cancelMyOrder,
  fetchMyOrders,
  type MyOrderSummary,
  type MyOrdersPage,
  type OrderStatus,
} from "@/features/orders/api";

import { FALLBACK_PRODUCT_IMAGE, ORDER_STATUS_TONE } from "./constants";

const STATUS_FILTERS: ReadonlyArray<{ id: OrderStatus | "ALL"; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 8;
const CANCELLABLE_STATUSES = new Set<OrderStatus>(["PENDING", "PROCESSING"]);

type LoadState =
  | { status: "loading" }
  | { status: "ready"; page: MyOrdersPage }
  | { status: "error"; message: string };

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatBdt(value: number): string {
  return `BDT ${Math.round(value).toLocaleString()}`;
}

/**
 * "My Orders" tab.
 *
 * Hits `/api/orders/my-orders` for the listing, paginates with the
 * server's meta block, and delegates the cancellation flow to the
 * existing `/api/orders/[id]/cancel` endpoint. Each row links to the
 * full receipt page already implemented at `/orders/[id]`.
 */
export default function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset to page 1 whenever the filter changes so we don't ask the
  // server for an out-of-range page.
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading" });

    void (async () => {
      try {
        const result = await fetchMyOrders({
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });
        if (ignore) return;
        setState({ status: "ready", page: result });
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load your orders.";
        setState({ status: "error", message });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [page, statusFilter]);

  const meta = state.status === "ready" ? state.page.meta : null;
  const orders = state.status === "ready" ? state.page.items : [];

  const filteredEmpty = useMemo(() => {
    return state.status === "ready" && orders.length === 0;
  }, [orders.length, state.status]);

  const handleCancel = async (orderId: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Cancel this order? Stock will be restored and the order moved to Cancelled.",
      );
      if (!confirmed) return;
    }

    setActionError(null);
    setCancellingId(orderId);

    try {
      const updated = await cancelMyOrder(orderId);
      setState((current) => {
        if (current.status !== "ready") return current;
        return {
          status: "ready",
          page: {
            ...current.page,
            items: current.page.items.map((order) =>
              order.id === orderId
                ? { ...order, status: updated.status }
                : order,
            ),
          },
        };
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to cancel order.";
      setActionError(message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                My orders
              </h2>
              <p className="text-xs text-gray-500">
                Review every order placed on this account.
              </p>
            </div>
          </div>
          {meta && (
            <p className="text-xs font-medium text-gray-500">
              {meta.total} {meta.total === 1 ? "order" : "orders"} total
            </p>
          )}
        </div>

        <div className="mt-4 -mx-1 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.id === statusFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={
                  active
                    ? "inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                    : "inline-flex items-center gap-1.5 rounded-xl border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-violet-300 hover:text-violet-700"
                }
                aria-pressed={active}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </header>

      {actionError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {state.status === "loading" && (
        <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          Loading orders...
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {state.message}
        </div>
      )}

      {state.status === "ready" && filteredEmpty && (
        <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-violet-100 text-violet-700">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-gray-900">
            No orders here yet
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {statusFilter === "ALL"
              ? "Your purchases will appear here as soon as you place an order."
              : `No ${STATUS_FILTERS.find((f) => f.id === statusFilter)?.label.toLowerCase()} orders right now.`}
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ShoppingBag className="h-4 w-4" />
            Start shopping
          </Link>
        </div>
      )}

      {state.status === "ready" && orders.length > 0 && (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              cancelling={cancellingId === order.id}
              onCancel={handleCancel}
            />
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

function OrderRow({
  order,
  cancelling,
  onCancel,
}: {
  order: MyOrderSummary;
  cancelling: boolean;
  onCancel: (orderId: string) => void;
}) {
  const tone = ORDER_STATUS_TONE[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const previewItems = order.items.slice(0, 3);
  const moreItems = order.items.length - previewItems.length;
  const canCancel = CANCELLABLE_STATUSES.has(order.status);

  return (
    <li className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <div className="flex shrink-0 -space-x-3">
            {previewItems.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.product.image || FALLBACK_PRODUCT_IMAGE}
                alt={item.product.name}
                className="h-14 w-14 rounded-xl border-2 border-white object-cover shadow-sm sm:h-16 sm:w-16"
              />
            ))}
            {moreItems > 0 && (
              <span className="grid h-14 w-14 place-items-center rounded-xl border-2 border-white bg-violet-100 text-xs font-bold text-violet-700 shadow-sm sm:h-16 sm:w-16">
                +{moreItems}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-700">
                #{order.orderNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.pill}`}
              >
                {tone.label}
              </span>
              <span
                className={
                  order.paymentStatus === "PAID"
                    ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                    : "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"
                }
              >
                {order.paymentStatus === "PAID" ? "Paid" : "Awaiting payment"}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm font-bold text-gray-900">
              {order.items[0]?.product.name ?? "Order items"}
              {order.items.length > 1 && (
                <span className="text-gray-500">
                  {" "}
                  + {order.items.length - 1}{" "}
                  {order.items.length - 1 === 1 ? "more" : "more"}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-end lg:justify-center">
          <p className="text-right text-lg font-extrabold text-violet-700">
            {formatBdt(order.totalAmount)}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 text-xs font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Link>
            {canCancel ? (
              <button
                type="button"
                onClick={() => onCancel(order.id)}
                disabled={cancelling}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelling ? "Cancelling..." : "Cancel"}
              </button>
            ) : (
              <Link
                href="/products"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reorder
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-3 text-xs font-semibold text-gray-600 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-xl border border-violet-100 bg-white px-3 py-1.5 transition-all duration-200 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-violet-100 disabled:hover:text-gray-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-xl border border-violet-100 bg-white px-3 py-1.5 transition-all duration-200 hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-violet-100 disabled:hover:text-gray-600"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
