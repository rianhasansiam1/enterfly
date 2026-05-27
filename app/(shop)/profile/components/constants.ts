import {
  Heart,
  KeyRound,
  LayoutDashboard,
  Package,
  ShoppingBag,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import type { OrderStatus } from "@/features/orders/api";

/**
 * Tab definitions for the My Profile dashboard.
 *
 * The order here is the order rendered in the side rail. `id`s are
 * URL hash slugs so the app can deep-link to any tab.
 */
export type ProfileTabId =
  | "overview"
  | "orders"
  | "wishlist"
  | "cart"
  | "settings"
  | "security";

export type ProfileTab = {
  id: ProfileTabId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const PROFILE_TABS: readonly ProfileTab[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Account at a glance.",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    label: "Orders",
    description: "Track and re-order purchases.",
    icon: Package,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    description: "Saved for later.",
    icon: Heart,
  },
  {
    id: "cart",
    label: "Cart",
    description: "Items waiting to check out.",
    icon: ShoppingBag,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Edit your personal info.",
    icon: UserCog,
  },
  {
    id: "security",
    label: "Security",
    description: "Password and sign-in.",
    icon: KeyRound,
  },
];

export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  { label: string; pill: string }
> = {
  PENDING: { label: "Pending", pill: "bg-amber-100 text-amber-700" },
  PROCESSING: { label: "Processing", pill: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { label: "Shipped", pill: "bg-violet-100 text-violet-700" },
  DELIVERED: { label: "Delivered", pill: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelled", pill: "bg-rose-100 text-rose-700" },
};

export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
