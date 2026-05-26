"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { SALES_SERIES } from "./data";
import { cn } from "@/lib/utils";

type Range = "7d" | "12d";

export default function SalesChart() {
  const [range, setRange] = useState<Range>("12d");

  const data = useMemo(
    () => (range === "7d" ? SALES_SERIES.slice(-7) : SALES_SERIES),
    [range],
  );

  const max = Math.max(...data.map((d) => d.revenue));
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  // SVG plotting
  const W = 600;
  const H = 220;
  const PAD = { l: 36, r: 12, t: 16, b: 28 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const points = data.map((d, i) => {
    const x = PAD.l + (innerW * i) / Math.max(1, data.length - 1);
    const y = PAD.t + innerH - (d.revenue / max) * innerH;
    return { ...d, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `M ${points[0].x.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((max * (yTicks - i)) / yTicks),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-bold text-gray-900">Sales Overview</h2>
          </div>
          <div className="mt-2 flex items-end gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Revenue
              </p>
              <p className="text-xl font-extrabold text-gray-900">
                BDT {(totalRevenue * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Orders
              </p>
              <p className="text-xl font-extrabold text-gray-900">
                {totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-violet-100 bg-violet-50/60 p-1 text-xs font-bold">
          {(["7d", "12d"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 transition-all duration-200",
                range === r
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-600 hover:text-violet-700",
              )}
            >
              {r === "7d" ? "Last 7 days" : "Last 12 days"}
            </button>
          ))}
        </div>
      </header>

      <div className="-mx-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full"
          role="img"
          aria-label="Revenue trend"
        >
          <defs>
            <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="salesStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* Y grid + labels */}
          {tickValues.map((v, i) => {
            const y = PAD.t + (innerH * i) / yTicks;
            return (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="#ede9fe"
                  strokeDasharray="3 4"
                />
                <text
                  x={PAD.l - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400"
                  fontSize="10"
                >
                  BDT {v}k
                </text>
              </g>
            );
          })}

          {/* Area + line */}
          <path d={areaPath} fill="url(#salesArea)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#salesStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#7c3aed" strokeWidth="2" />
              <text
                x={p.x}
                y={H - 8}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize="10"
              >
                {p.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
