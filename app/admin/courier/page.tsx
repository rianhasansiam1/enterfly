"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package2,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  fetchAdminOrdersPage,
  formatDateTime,
  type AdminOrderRow,
} from "@/features/admin-orders/api";
import {
  checkCourierInfo,
  type CourierReport,
} from "@/features/admin-courier/api";
import { cn } from "@/lib/utils";
import { ButtonLoader, LoadingSpinner, SectionLoader } from "@/components/ui/loading";
import CourierReportPanel from "./components/CourierReportPanel";

/**
 * Walk every page of admin orders to build the full customer-by-phone
 * list.  The courier page genuinely needs cross-page aggregation so
 * a full fetch is appropriate here.  This is a local helper — no Redux.
 */
async function fetchAllOrdersForCourier(): Promise<AdminOrderRow[]> {
  let page = 1;
  let totalPages = 1;
  const merged: AdminOrderRow[] = [];

  while (page <= totalPages) {
    const { items, meta } = await fetchAdminOrdersPage({
      page,
      pageSize: 100,
    });
    merged.push(...items);
    totalPages = meta.totalPages;
    page += 1;
  }

  return merged;
}

export default function AdminCourierPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [orderQuery, setOrderQuery] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const [report, setReport] = useState<CourierReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [activePhone, setActivePhone] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const items = await fetchAllOrdersForCourier();
      setOrders(items);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load orders.";
      setOrdersError(message);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchAllOrdersForCourier()
      .then((items) => {
        if (!ignore) setOrders(items);
      })
      .catch((loadError: unknown) => {
        if (ignore) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load orders.";
        setOrdersError(message);
      })
      .finally(() => {
        if (!ignore) setOrdersLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const runCheck = useCallback(async (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setChecking(true);
    setCheckError(null);
    setActivePhone(trimmed);
    try {
      const result = await checkCourierInfo(trimmed);
      setReport(result);
    } catch (error) {
      setReport(null);
      setCheckError(
        error instanceof Error ? error.message : "Failed to check courier info.",
      );
    } finally {
      setChecking(false);
    }
  }, []);

  // De-duplicate the order list down to one row per customer phone so the
  // admin sees each customer once, with their most recent order summarised.
  const customers = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    const byPhone = new Map<
      string,
      {
        phone: string;
        name: string;
        ordersCount: number;
        lastOrderAt: string;
        lastOrderNumber: string;
      }
    >();

    for (const order of orders) {
      const phone = order.customerPhone.trim();
      if (!phone) continue;
      const existing = byPhone.get(phone);
      if (existing) {
        existing.ordersCount += 1;
        if (order.createdAt > existing.lastOrderAt) {
          existing.lastOrderAt = order.createdAt;
          existing.lastOrderNumber = order.orderNumber;
          existing.name = order.customerName;
        }
      } else {
        byPhone.set(phone, {
          phone,
          name: order.customerName,
          ordersCount: 1,
          lastOrderAt: order.createdAt,
          lastOrderNumber: order.orderNumber,
        });
      }
    }

    const list = Array.from(byPhone.values()).sort((a, b) =>
      a.lastOrderAt < b.lastOrderAt ? 1 : -1,
    );

    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastOrderNumber.toLowerCase().includes(q),
    );
  }, [orders, orderQuery]);

  return (
    <section className="space-y-4">
      {/* Heading */}
      <div className="rounded-2xl border border-violet-100 bg-linear-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">Courier Fraud Check</h1>
            <p className="text-xs text-violet-100">
              Review a customer&apos;s delivery track record before dispatching
              an order.
            </p>
          </div>
        </div>
      </div>

      {/* Manual search */}
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Manual lookup
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runCheck(manualPhone);
          }}
          aria-busy={checking}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex flex-1 items-center">
            <Truck className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
            <input
              type="tel"
              inputMode="tel"
              value={manualPhone}
              onChange={(event) => setManualPhone(event.target.value)}
              placeholder="Enter customer phone, e.g. 017XXXXXXXX"
              disabled={checking}
              className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
            />
          </label>
          <button
            type="submit"
            disabled={checking || !manualPhone.trim()}
            aria-busy={checking}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checking ? (
              <ButtonLoader label="Checking..." />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Check
              </>
            )}
          </button>
        </form>
      </div>

      {checkError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {checkError}
        </div>
      )}

      {/* Report */}
      {checking && !report ? (
        <SectionLoader label={`Checking courier history for ${activePhone}...`} />
      ) : report ? (
        <CourierReportPanel report={report} />
      ) : null}

      {/* Customer / order list */}
      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Order history
            </p>
            <p className="text-sm text-gray-600">
              Click a customer to check their courier record.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refreshOrders();
            }}
            disabled={ordersLoading}
            aria-busy={ordersLoading}
            className="inline-flex h-9 items-center gap-2 self-start rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            {ordersLoading ? (
              <ButtonLoader label="Refreshing..." />
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Refresh
              </>
            )}
          </button>
        </div>

        <label className="relative mt-3 flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-violet-400" />
          <input
            type="text"
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder="Search customers by name, phone, or order #..."
            className="h-10 w-full rounded-xl border border-violet-200 pl-9 pr-3 text-sm outline-none transition focus:border-violet-500"
          />
        </label>

        {ordersError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {ordersError}
          </div>
        )}

        <div className="mt-3 overflow-hidden rounded-xl border border-violet-100">
          {ordersLoading && orders.length === 0 ? (
            <SectionLoader label="Loading orders..." />
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-600">
              <Package2 className="mx-auto mb-2 h-8 w-8 text-violet-300" />
              No customers match the current search.
            </div>
          ) : (
            <div className="max-h-112 overflow-x-auto overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Last order</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const isActive =
                      activePhone === customer.phone.trim() && !!report;
                    return (
                      <tr
                        key={customer.phone}
                        className={cn(
                          "border-t border-violet-100/70 transition",
                          isActive ? "bg-violet-50/60" : "hover:bg-violet-50/40",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {customer.ordersCount}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">
                            {customer.lastOrderNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(customer.lastOrderAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setManualPhone(customer.phone);
                              void runCheck(customer.phone);
                            }}
                            disabled={checking}
                            aria-busy={
                              checking && activePhone === customer.phone.trim()
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {checking && activePhone === customer.phone.trim() ? (
                              <LoadingSpinner size="xs" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                            Check
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {customers.length} customer{customers.length === 1 ? "" : "s"} from{" "}
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}
