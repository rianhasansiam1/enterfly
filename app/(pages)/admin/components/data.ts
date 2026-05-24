// Demo data for the admin panel.
// Replace with API/database calls when backend is ready.

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/allProducts", label: "Products", icon: Package, badge: "248" },
  { href: "/admin/allorders", label: "Orders", icon: ShoppingBag, badge: "32" },
  { href: "/admin/allusers", label: "Customers", icon: Users },
  { href: "/admin/allcategories", label: "Categories", icon: FolderTree },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export type Trend = "up" | "down";

export type Stat = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  hint: string;
  accent: "violet" | "emerald" | "amber" | "indigo";
};

export const DASHBOARD_STATS: Stat[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "BDT 8,42,360",
    delta: "+12.4%",
    trend: "up",
    hint: "vs last month",
    accent: "violet",
  },
  {
    id: "orders",
    label: "Orders",
    value: "1,284",
    delta: "+8.1%",
    trend: "up",
    hint: "vs last month",
    accent: "indigo",
  },
  {
    id: "customers",
    label: "Customers",
    value: "9,420",
    delta: "+3.2%",
    trend: "up",
    hint: "new sign-ups",
    accent: "emerald",
  },
  {
    id: "refunds",
    label: "Refunds",
    value: "BDT 14,780",
    delta: "-2.7%",
    trend: "down",
    hint: "vs last month",
    accent: "amber",
  },
];

// Daily revenue (last 12 days), in thousands of rupees.
export type SalesPoint = { day: string; revenue: number; orders: number };

export const SALES_SERIES: SalesPoint[] = [
  { day: "Mon", revenue: 42, orders: 38 },
  { day: "Tue", revenue: 56, orders: 51 },
  { day: "Wed", revenue: 49, orders: 46 },
  { day: "Thu", revenue: 71, orders: 64 },
  { day: "Fri", revenue: 88, orders: 79 },
  { day: "Sat", revenue: 104, orders: 92 },
  { day: "Sun", revenue: 96, orders: 81 },
  { day: "Mon", revenue: 67, orders: 60 },
  { day: "Tue", revenue: 78, orders: 70 },
  { day: "Wed", revenue: 91, orders: 83 },
  { day: "Thu", revenue: 112, orders: 98 },
  { day: "Fri", revenue: 124, orders: 110 },
];

export type OrderStatus = "Paid" | "Pending" | "Shipped" | "Refunded" | "Cancelled";

export type Order = {
  id: string;
  customer: string;
  email: string;
  total: number;
  items: number;
  status: OrderStatus;
  placedAt: string;
};

export const RECENT_ORDERS: Order[] = [
  {
    id: "#ORD-10421",
    customer: "Aarav Mehta",
    email: "aarav.m@enterfly.com",
    total: 4280,
    items: 3,
    status: "Paid",
    placedAt: "2 mins ago",
  },
  {
    id: "#ORD-10420",
    customer: "Isha Sharma",
    email: "isha.s@enterfly.com",
    total: 1199,
    items: 1,
    status: "Pending",
    placedAt: "18 mins ago",
  },
  {
    id: "#ORD-10419",
    customer: "Rohan Gupta",
    email: "rohan.g@enterfly.com",
    total: 7560,
    items: 4,
    status: "Shipped",
    placedAt: "1 hr ago",
  },
  {
    id: "#ORD-10418",
    customer: "Priya Nair",
    email: "priya.n@enterfly.com",
    total: 2340,
    items: 2,
    status: "Paid",
    placedAt: "3 hrs ago",
  },
  {
    id: "#ORD-10417",
    customer: "Karan Singh",
    email: "karan.s@enterfly.com",
    total: 980,
    items: 1,
    status: "Refunded",
    placedAt: "5 hrs ago",
  },
  {
    id: "#ORD-10416",
    customer: "Neha Verma",
    email: "neha.v@enterfly.com",
    total: 5120,
    items: 3,
    status: "Cancelled",
    placedAt: "8 hrs ago",
  },
];

export type TopProduct = {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  stock: number;
};

export const TOP_PRODUCTS: TopProduct[] = [
  {
    id: "p-001",
    name: "Aurora Wireless Headphones",
    category: "Electronics",
    sold: 312,
    revenue: 124800,
    stock: 48,
  },
  {
    id: "p-002",
    name: "Velvet Cotton Hoodie",
    category: "Apparel",
    sold: 268,
    revenue: 80400,
    stock: 132,
  },
  {
    id: "p-003",
    name: "Smart Fitness Band Pro",
    category: "Wearables",
    sold: 241,
    revenue: 96400,
    stock: 17,
  },
  {
    id: "p-004",
    name: "Ceramic Pour-Over Kettle",
    category: "Home",
    sold: 198,
    revenue: 49500,
    stock: 64,
  },
  {
    id: "p-005",
    name: "Linen Throw Cushion",
    category: "Home",
    sold: 174,
    revenue: 26100,
    stock: 0,
  },
];

export type Activity = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  kind: "order" | "user" | "product" | "review";
};

export const ACTIVITY_FEED: Activity[] = [
  {
    id: "a1",
    actor: "Aarav Mehta",
    action: "placed an order",
    target: "#ORD-10421",
    at: "Just now",
    kind: "order",
  },
  {
    id: "a2",
    actor: "Admin",
    action: "added a new product",
    target: "Aurora Wireless Headphones",
    at: "20 mins ago",
    kind: "product",
  },
  {
    id: "a3",
    actor: "Priya Nair",
    action: "left a 5-star review on",
    target: "Velvet Cotton Hoodie",
    at: "1 hr ago",
    kind: "review",
  },
  {
    id: "a4",
    actor: "Karan Singh",
    action: "requested a refund for",
    target: "#ORD-10417",
    at: "5 hrs ago",
    kind: "order",
  },
  {
    id: "a5",
    actor: "Neha Verma",
    action: "registered an account",
    target: "",
    at: "Yesterday",
    kind: "user",
  },
];
