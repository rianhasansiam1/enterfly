"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { fetchOrderDetail, type OrderDetail } from "@/features/orders/api";
import { downloadOrderPdf } from "@/features/orders/pdf";
import {
  clearOrderSnapshot,
  readOrderSnapshot,
} from "@/features/orders/storage";
import { ORDER_STATUS_META } from "@/lib/orders/status";
import ColorBadge from "@/components/ui/ColorBadge";
import OrderTracker from "./OrderTracker";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

type OrderSummaryClientProps = {
  orderId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; order: OrderDetail; source: "api" | "snapshot" }
  | { status: "error"; message: string };

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function paymentLabel(method: OrderDetail["paymentMethod"]): string {
  return method === "ONLINE" ? "Pay now (online)" : "Cash on delivery";
}

const STATUS_TONE: Record<
  OrderDetail["status"],
  { label: string; pill: string }
> = Object.fromEntries(
  Object.entries(ORDER_STATUS_META).map(([status, meta]) => [
    status,
    { label: meta.label, pill: meta.tone.pill },
  ]),
) as Record<OrderDetail["status"], { label: string; pill: string }>;

const PAYMENT_TONE: Record<
  OrderDetail["paymentStatus"],
  { label: string; pill: string }
> = {
  PAID: { label: "Paid", pill: "bg-emerald-100 text-emerald-700" },
  UNPAID: { label: "Awaiting payment", pill: "bg-amber-100 text-amber-700" },
};

export default function OrderSummaryClient({ orderId }: OrderSummaryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();

  const justPlaced = searchParams.get("just-placed") === "1";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Load the order. Authentication is required everywhere now, so
  // the API is the single source of truth. The snapshot stashed by
  // the checkout page is used only as a friendly first paint while
  // the live request resolves on the post-checkout redirect.
  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated") return;

    let ignore = false;

    void (async () => {
      await Promise.resolve();
      if (ignore) return;

      // First paint: if the checkout page just stashed a snapshot for
      // this order, render it immediately so the receipt appears with
      // no loading spinner. The fetch below still runs and replaces it
      // with authoritative data.
      const snapshot = readOrderSnapshot(orderId);
      if (snapshot) {
        setState({
          status: "ready",
          order: snapshot.order,
          source: "snapshot",
        });
      } else {
        setState({ status: "loading" });
      }

      try {
        const order = await fetchOrderDetail(orderId);
        if (ignore) return;
        setState({ status: "ready", order, source: "api" });
      } catch (error) {
        if (ignore) return;
        // If we already painted from the snapshot, keep it on screen
        // — refusing to overwrite a good render with an error feels
        // better than flashing red between two valid states.
        if (snapshot) return;
        const message =
          error instanceof Error
            ? error.message
            : "We couldn't find this order on your account.";
        setState({ status: "error", message });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authStatus, orderId]);

  // Once we've shown the receipt at least once, drop the snapshot so
  // a stale copy doesn't haunt the next checkout in the same tab.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (state.source !== "snapshot") return;
    // Defer the cleanup so a quick refresh during the same render
    // still has the snapshot available.
    const timer = window.setTimeout(() => clearOrderSnapshot(), 0);
    return () => window.clearTimeout(timer);
  }, [state]);

  const order = state.status === "ready" ? state.order : null;

  const totalSavings = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.discountAmount);
  }, [order]);

  const handleDownload = async () => {
    if (!order || downloading) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      // Yield a frame so the loading state can paint before jsPDF
      // takes the main thread.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await downloadOrderPdf(order);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate PDF.";
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  if (
    authStatus === "loading" ||
    (authStatus === "authenticated" && state.status === "loading")
  ) {
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
            Loading order summary...
          </div>
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated" || state.status === "error" || !order) {
    const message =
      authStatus !== "authenticated"
        ? "Sign in to view this order."
        : state.status === "error"
          ? state.message
          : "Sign in or open the original checkout link to view this order.";
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
              Order not available
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse products
              </Link>
              {authStatus !== "authenticated" && (
                <Link
                  href={`/login?callbackUrl=/orders/${orderId}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statusBadge = STATUS_TONE[order.status] ?? STATUS_TONE.PENDING;
  const paymentBadge = PAYMENT_TONE[order.paymentStatus] ?? PAYMENT_TONE.UNPAID;

  const addressLines = [
    order.customerAddress,
    [order.customerCity, order.customerPostalCode]
      .filter((part): part is string => Boolean(part))
      .join(" "),
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
          <div className="relative bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 px-6 py-8 text-white sm:px-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {justPlaced ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Order placed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Order summary
                  </span>
                )}
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  #{order.orderNumber}
                </h1>
                <p className="mt-2 text-sm text-white/85">
                  Placed on {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  aria-busy={downloading}
                >
                  <Download className="h-4 w-4" />
                  {downloading ? "Generating PDF..." : "Download PDF"}
                </button>
                {downloadError && (
                  <p className="rounded-lg bg-rose-500/30 px-2 py-1 text-[11px] font-medium text-white">
                    {downloadError}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-violet-100 p-5 sm:grid-cols-4 sm:p-6">
            <Stat label="Order ID" value={order.id} mono />
            <Stat label="Order date" value={formatDateTime(order.createdAt)} />
            <Stat
              label="Order status"
              custom={
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge.pill}`}
                >
                  <Package className="h-3.5 w-3.5" />
                  {statusBadge.label}
                </span>
              }
            />
            <Stat
              label="Payment"
              custom={
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {paymentLabel(order.paymentMethod)}
                  </span>
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${paymentBadge.pill}`}
                  >
                    {paymentBadge.label}
                  </span>
                </div>
              }
            />
          </div>
        </section>

        {/* Tracking timeline */}
        <OrderTracker
          status={order.status}
          history={order.statusHistory ?? []}
          className="mt-6"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-5">
            {/* Customer + shipping */}
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
              <header className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
                  <User className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  Customer details
                </h2>
              </header>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <Field
                  icon={<User className="h-4 w-4" />}
                  label="Name"
                  value={order.customerName}
                />
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={order.customerPhone}
                />
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={order.customerEmail ?? "—"}
                />
                <Field
                  icon={<Truck className="h-4 w-4" />}
                  label="Payment method"
                  value={paymentLabel(order.paymentMethod)}
                />
                <div className="sm:col-span-2">
                  <Field
                    icon={<MapPin className="h-4 w-4" />}
                    label="Shipping address"
                    value={addressLines.join(", ")}
                  />
                </div>
                {order.customerNote && (
                  <div className="sm:col-span-2">
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      label="Note from customer"
                      value={order.customerNote}
                    />
                  </div>
                )}
              </dl>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
                    <Package className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">Items</h2>
                </div>
                <span className="text-xs text-gray-500">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "product" : "products"}
                </span>
              </header>
              <ul className="divide-y divide-violet-100">
                {order.items.map((item) => {
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-violet-100 bg-violet-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.productImage || FALLBACK_IMAGE}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.productName}
                        </p>
                        <ColorBadge
                          color={item.color}
                          size={item.size}
                          className="mt-0.5"
                        />
                        <p className="mt-0.5 text-xs text-gray-500">
                          Qty {item.quantity} · BDT {item.unitPrice.toLocaleString()} each
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        BDT {item.totalPrice.toLocaleString()}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* Totals */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-gray-900">Total</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <SummaryRow label="Subtotal" value={order.subtotal} />
                {order.discountAmount > 0 && (
                  <SummaryRow
                    label={
                      order.promoCode
                        ? `Discount (${order.promoCode})`
                        : "Discount"
                    }
                    value={-order.discountAmount}
                    tone="success"
                  />
                )}
                <SummaryRow
                  label="Delivery charge"
                  value={order.deliveryCharge}
                  freeLabel={order.deliveryCharge === 0 ? "FREE" : undefined}
                />
                {order.taxAmount > 0 && (
                  <SummaryRow label="Tax" value={order.taxAmount} />
                )}
              </div>
              <div className="mt-4 rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Grand total
                  </span>
                  <span className="text-2xl font-extrabold text-violet-700 sm:text-3xl">
                    BDT {order.totalAmount.toLocaleString()}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    You saved BDT {totalSavings.toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-base font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:hover:translate-y-0"
                aria-busy={downloading}
              >
                <Download className="h-4 w-4" />
                {downloading ? "Generating PDF..." : "Download PDF receipt"}
              </button>
              {downloadError && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {downloadError}
                </p>
              )}
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white text-sm font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue shopping
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 wrap-break-word text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  custom,
  mono,
}: {
  label: string;
  value?: string;
  custom?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <div className="mt-1">
        {custom ? (
          custom
        ) : (
          <p
            className={`break-all text-sm font-bold text-gray-900 ${mono ? "font-mono" : ""}`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
  freeLabel,
}: {
  label: string;
  value: number;
  tone?: "default" | "success";
  freeLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      {freeLabel ? (
        <span className="font-bold uppercase tracking-wider text-emerald-600">
          {freeLabel}
        </span>
      ) : (
        <span
          className={`font-semibold ${
            tone === "success" ? "text-emerald-600" : "text-gray-900"
          }`}
        >
          {value < 0 ? "-" : ""}BDT {Math.abs(value).toLocaleString()}
        </span>
      )}
    </div>
  );
}
