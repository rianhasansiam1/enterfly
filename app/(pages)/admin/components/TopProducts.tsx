import { Package } from "lucide-react";
import { TOP_PRODUCTS } from "./data";
import { cn } from "@/lib/utils";

export default function TopProducts() {
  const maxRevenue = Math.max(...TOP_PRODUCTS.map((p) => p.revenue));

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex items-center gap-2">
        <Package className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-bold text-gray-900">Top Products</h2>
      </header>

      <ul className="space-y-3.5">
        {TOP_PRODUCTS.map((product, idx) => {
          const pct = Math.round((product.revenue / maxRevenue) * 100);
          const lowStock = product.stock > 0 && product.stock < 25;
          const outOfStock = product.stock === 0;

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
                      {product.category} · {product.sold} sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    BDT {product.revenue.toLocaleString()}
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
    </section>
  );
}
