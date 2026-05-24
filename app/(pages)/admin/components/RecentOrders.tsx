import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { RECENT_ORDERS } from "./data";
import type { OrderStatus } from "./data";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Shipped: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Refunded: "bg-rose-50 text-rose-700 ring-rose-200",
  Cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
};

export default function RecentOrders() {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
          <p className="text-xs text-gray-500">Latest activity from your store</p>
        </div>
        <Link
          href="/admin/allorders"
          className="group inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-50"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-violet-50/60 text-left">
            <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 sm:px-5">Order</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {RECENT_ORDERS.map((order) => (
              <tr
                key={order.id}
                className="transition-colors duration-200 hover:bg-violet-50/40"
              >
                <td className="px-4 py-3 font-bold text-violet-700 sm:px-5">
                  {order.id}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{order.customer}</p>
                  <p className="text-xs text-gray-500">{order.email}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  BDT {order.total.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    · {order.items} item{order.items > 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                      STATUS_STYLES[order.status],
                    )}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {order.placedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
