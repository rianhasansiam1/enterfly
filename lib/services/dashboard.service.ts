import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Aggregations powering the admin dashboard page.
 *
 * One bundled payload keeps the page to a single round-trip and the
 * SQL surface predictable. Cancelled orders are excluded from any
 * "revenue" or "orders" headline so the numbers reflect actual store
 * performance — they're surfaced separately under "cancellations".
 *
 * Money fields are rounded to 2 dp at the service edge so the JSON
 * never leaks float noise to the client.
 */

const SALES_SERIES_DAYS = 14;
const TOP_PRODUCTS_LIMIT = 5;
const RECENT_ORDERS_LIMIT = 6;
const ACTIVITY_FEED_LIMIT = 8;

const TOP_PRODUCTS_WINDOW_DAYS = 30;

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfPreviousMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1),
  );
}

function startOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Percentage change between two scalar values.
 *
 * - When `previous` is 0 we return either 100 (anything > 0) or 0
 *   (still 0). Reporting "Infinity" is technically correct but reads
 *   as a bug to humans, and "100%" is the most honest summary of
 *   "anything new versus nothing".
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type DashboardTrend = "up" | "down" | "flat";

export type DashboardStat = {
  current: number;
  previous: number;
  delta: number; // signed percentage change
  trend: DashboardTrend;
};

export type DashboardStats = {
  revenue: DashboardStat;
  orders: DashboardStat;
  customers: DashboardStat;
  cancellations: DashboardStat;
};

export type DashboardSalesPoint = {
  // ISO calendar date (YYYY-MM-DD) for the bucket.
  date: string;
  // Short day label (Mon/Tue/...) so the chart doesn't have to format dates.
  label: string;
  revenue: number;
  orders: number;
};

export type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  itemsCount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PAID" | "UNPAID";
  createdAt: string;
};

export type DashboardTopProduct = {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
};

export type DashboardActivityKind =
  | "order"
  | "user"
  | "product"
  | "message";

export type DashboardActivity = {
  id: string;
  kind: DashboardActivityKind;
  actor: string;
  action: string;
  target: string | null;
  href: string | null;
  at: string;
};

export type DashboardOverview = {
  generatedAt: string;
  stats: DashboardStats;
  sales: {
    days: number;
    points: DashboardSalesPoint[];
    totalRevenue: number;
    totalOrders: number;
  };
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  activity: DashboardActivity[];
};

/* -------------------------------------------------------------------------- */
/*  Headline stats (this month vs last month)                                 */
/* -------------------------------------------------------------------------- */

async function loadStats(now: Date): Promise<DashboardStats> {
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfPreviousMonth(now);
  // Inclusive lower bound, exclusive upper bound — easier to reason
  // about than fiddling with end-of-day timestamps.
  const lastMonthEnd = thisMonthStart;

  const liveOrderWhere = (gte: Date, lt: Date): Prisma.OrderWhereInput => ({
    createdAt: { gte, lt },
    status: { not: "CANCELLED" },
  });

  const cancelledWhere = (gte: Date, lt: Date): Prisma.OrderWhereInput => ({
    createdAt: { gte, lt },
    status: "CANCELLED",
  });

  const [
    revenueThis,
    revenuePrev,
    ordersThis,
    ordersPrev,
    cancelledThis,
    cancelledPrev,
    customersThis,
    customersPrev,
    customersTotal,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: liveOrderWhere(thisMonthStart, new Date(now.getTime() + 1)),
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: liveOrderWhere(lastMonthStart, lastMonthEnd),
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: liveOrderWhere(thisMonthStart, new Date(now.getTime() + 1)),
    }),
    prisma.order.count({
      where: liveOrderWhere(lastMonthStart, lastMonthEnd),
    }),
    prisma.order.aggregate({
      where: cancelledWhere(thisMonthStart, new Date(now.getTime() + 1)),
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: cancelledWhere(lastMonthStart, lastMonthEnd),
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { createdAt: { gte: thisMonthStart } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
    }),
    prisma.user.count(),
  ]);

  const buildStat = (current: number, previous: number): DashboardStat => {
    const delta = percentChange(current, previous);
    const trend: DashboardTrend =
      delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    return { current, previous, delta, trend };
  };

  // Revenue: rounded BDT amounts.
  const revenue = buildStat(
    money(revenueThis._sum.totalAmount ?? 0),
    money(revenuePrev._sum.totalAmount ?? 0),
  );

  const orders = buildStat(ordersThis, ordersPrev);

  // Customers headline shows the live total; the delta is computed
  // from new sign-ups in each month so it represents growth, not the
  // absolute total going up.
  const customersDelta = percentChange(customersThis, customersPrev);
  const customers: DashboardStat = {
    current: customersTotal,
    previous: customersTotal - customersThis + customersPrev,
    delta: customersDelta,
    trend:
      customersDelta > 0 ? "up" : customersDelta < 0 ? "down" : "flat",
  };

  const cancellations = buildStat(
    money(cancelledThis._sum.totalAmount ?? 0),
    money(cancelledPrev._sum.totalAmount ?? 0),
  );
  // For cancellations, "down" is good; the stat object stays signed
  // and the UI can decide which colour to use.

  return { revenue, orders, customers, cancellations };
}

/* -------------------------------------------------------------------------- */
/*  Sales series (last N days)                                                */
/* -------------------------------------------------------------------------- */

const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

async function loadSalesSeries(now: Date) {
  const start = startOfDayUTC(now);
  start.setUTCDate(start.getUTCDate() - (SALES_SERIES_DAYS - 1));

  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { not: "CANCELLED" },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  const buckets = new Map<string, DashboardSalesPoint>();
  for (let i = 0; i < SALES_SERIES_DAYS; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCDate(start.getUTCDate() + i);
    const key = cursor.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: DAY_LABELS[cursor.getUTCDay()] ?? key,
      revenue: 0,
      orders: 0,
    });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue = money(bucket.revenue + row.totalAmount);
    bucket.orders += 1;
  }

  const points = Array.from(buckets.values());
  const totalRevenue = money(
    points.reduce((sum, point) => sum + point.revenue, 0),
  );
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);

  return {
    days: SALES_SERIES_DAYS,
    points,
    totalRevenue,
    totalOrders,
  };
}

/* -------------------------------------------------------------------------- */
/*  Recent orders                                                             */
/* -------------------------------------------------------------------------- */

async function loadRecentOrders(): Promise<DashboardRecentOrder[]> {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: RECENT_ORDERS_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      user: { select: { email: true } },
      _count: { select: { items: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    // `customerEmail` is stored on the order for the receipt; fall
    // back to the linked user when the form didn't ask for one.
    customerEmail: row.customerEmail ?? row.user?.email ?? null,
    totalAmount: money(row.totalAmount),
    itemsCount: row._count.items,
    status: row.status,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Top products (last N days)                                                */
/* -------------------------------------------------------------------------- */

async function loadTopProducts(now: Date): Promise<DashboardTopProduct[]> {
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - TOP_PRODUCTS_WINDOW_DAYS);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
    },
    _sum: { quantity: true },
  });

  if (grouped.length === 0) return [];

  // We aggregate units in SQL, but jsut multiplying price*quantity in
  // Prisma's groupBy isn't supported — so we re-pull the line items
  // for the top-N products by units and total revenue manually.
  const productIds = grouped.map((row) => row.productId);

  const items = await prisma.orderItem.findMany({
    where: {
      productId: { in: productIds },
      order: {
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
    },
    select: { productId: true, quantity: true, price: true },
  });

  const stats = new Map<string, { units: number; revenue: number }>();
  for (const item of items) {
    const bucket = stats.get(item.productId) ?? { units: 0, revenue: 0 };
    bucket.units += item.quantity;
    bucket.revenue += item.quantity * item.price;
    stats.set(item.productId, bucket);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      stock: true,
      status: true,
      category: { select: { name: true } },
    },
  });
  const productMap = new Map(products.map((row) => [row.id, row]));

  return Array.from(stats.entries())
    .map(([productId, bucket]) => {
      const product = productMap.get(productId);
      return {
        id: productId,
        name: product?.name ?? "Deleted product",
        category: product?.category?.name ?? "—",
        unitsSold: bucket.units,
        revenue: money(bucket.revenue),
        stock: product?.stock ?? 0,
        status: product?.status ?? "INACTIVE",
      } satisfies DashboardTopProduct;
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PRODUCTS_LIMIT);
}

/* -------------------------------------------------------------------------- */
/*  Activity feed                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Merge a few recent events from different tables into one feed.
 * Each source contributes up to `ACTIVITY_FEED_LIMIT` entries and the
 * final list is sorted by timestamp; the page only ever shows the
 * latest few so over-fetching here is fine.
 */
async function loadActivity(): Promise<DashboardActivity[]> {
  const [orders, users, products, messages] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_FEED_LIMIT,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        status: true,
        createdAt: true,
        totalAmount: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_FEED_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        provider: true,
      },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_FEED_LIMIT,
      select: {
        id: true,
        name: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_FEED_LIMIT,
      select: {
        id: true,
        name: true,
        subject: true,
        createdAt: true,
      },
    }),
  ]);

  const merged: DashboardActivity[] = [];

  for (const order of orders) {
    merged.push({
      id: `order-${order.id}`,
      kind: "order",
      actor: order.customerName || "Customer",
      action:
        order.status === "CANCELLED"
          ? "cancelled order"
          : "placed an order",
      target: `#${order.orderNumber}`,
      href: `/admin/orders`,
      at: order.createdAt.toISOString(),
    });
  }

  for (const user of users) {
    merged.push({
      id: `user-${user.id}`,
      kind: "user",
      actor: user.name || user.email || "New customer",
      action:
        user.provider === "GOOGLE"
          ? "signed up with Google"
          : "registered an account",
      target: null,
      href: `/admin/users`,
      at: user.createdAt.toISOString(),
    });
  }

  for (const product of products) {
    merged.push({
      id: `product-${product.id}`,
      kind: "product",
      actor: "Catalog",
      action: "added new product",
      target: product.name,
      href: `/admin/products`,
      at: product.createdAt.toISOString(),
    });
  }

  for (const message of messages) {
    merged.push({
      id: `message-${message.id}`,
      kind: "message",
      actor: message.name || "Visitor",
      action: "sent a message",
      target: message.subject,
      href: `/admin/messages`,
      at: message.createdAt.toISOString(),
    });
  }

  return merged
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, ACTIVITY_FEED_LIMIT);
}

/* -------------------------------------------------------------------------- */
/*  Public entry                                                              */
/* -------------------------------------------------------------------------- */

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();

  const [stats, sales, recentOrders, topProducts, activity] = await Promise.all(
    [
      loadStats(now),
      loadSalesSeries(now),
      loadRecentOrders(),
      loadTopProducts(now),
      loadActivity(),
    ],
  );

  return {
    generatedAt: now.toISOString(),
    stats,
    sales,
    recentOrders,
    topProducts,
    activity,
  };
}
