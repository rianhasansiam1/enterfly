import { readApiData } from "@/features/http/api-envelope";
import type { OrderStatus } from "@/lib/orders/status";

/**
 * Client-side types and fetcher for the admin dashboard.
 *
 * Mirrors the payload returned by `/api/admin/dashboard`. Kept in its
 * own feature module so the page and its sub-components can import
 * the shapes without pulling in server-only code.
 */

export type DashboardTrend = "up" | "down" | "flat";

export type DashboardStat = {
  current: number;
  previous: number;
  delta: number;
  trend: DashboardTrend;
};

export type DashboardStats = {
  revenue: DashboardStat;
  profit: DashboardStat;
  loss: DashboardStat;
  orders: DashboardStat;
  customers: DashboardStat;
  cancellations: DashboardStat;
};

export type DashboardSalesPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export type DashboardSalesSeries = {
  days: number;
  points: DashboardSalesPoint[];
  totalRevenue: number;
  totalOrders: number;
};

export type DashboardOrderStatus = OrderStatus;

export type DashboardPaymentStatus = "PAID" | "UNPAID";

export type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  itemsCount: number;
  status: DashboardOrderStatus;
  paymentStatus: DashboardPaymentStatus;
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
  sales: DashboardSalesSeries;
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  activity: DashboardActivity[];
};

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await fetch("/api/admin/dashboard", {
    method: "GET",
    cache: "no-store",
  });
  return readApiData<DashboardOverview>(
    response,
    "Failed to load dashboard data.",
  );
}
