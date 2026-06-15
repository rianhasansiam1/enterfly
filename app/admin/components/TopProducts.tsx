"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import type { DashboardTopProduct } from "@/features/admin-dashboard/api";
import { cn } from "@/lib/utils";

type TopProductsProps = {
  products: DashboardTopProduct[];
  loading?: boolean;
};

export default function TopProducts({ products, loading }: TopProductsProps) {
  const maxRevenue =
    products.length === 0
      ? 1
      : products.reduce((max, p) => (p.revenue > max ? p.revenue : max), 1);

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-bold text-gray-900">Top Products</h2>
          <span className="text-[11px] font-medium text-gray-500">
            · last 30 days
          </span>
        </div>
        <Link
          href="/admin/products"
          className="group inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-50"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </header>

      {loading ? (
        <ul className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-violet-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/5 animate-pulse rounded bg-violet-50" />
                    <div className="h-2.5 w-2/5 animate-pulse rounded bg-violet-50" />
                  </div>
                </div>
                <div className="h-3 w-16 animate-pulse rounded bg-violet-50" />
              </div>
              <div className="h-1.5 w-full animate-pulse rounded-full bg-violet-50" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <div className="grid place-items-center rounded-xl bg-violet-50/40 px-4 py-10 text-center">
          <Package className="h-7 w-7 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-gray-700">
            No sales yet
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Top products will appear here as soon as orders come in.
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {products.map((product, idx) => {
            const pct = Math.max(
              4,
              Math.round((product.revenue / maxRevenue) * 100),
            );
            const outOfStock = product.stock === 0;
            const lowStock = product.stock > 0 && product.stock < 10;

            return (
              <li key={product.id} className="group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-extrabold text-white shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {product.category} · {product.unitsSold} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      BDT {Math.round(product.revenue).toLocaleString()}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-semibold",
                        outOfStock
                          ? "text-rose-600"
                          : lowStock
                            ? "text-amber-600"
                            : "text-emerald-600",
                      )}
                    >
                      {outOfStock
                        ? "Out of stock"
                        : `${product.stock} in stock`}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-50">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-600 transition-all duration-500 group-hover:from-violet-600 group-hover:to-indigo-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
