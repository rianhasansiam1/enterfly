import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  BarChart3,
  Settings,
  Image as ImageIcon,
  Mail,
} from "lucide-react";

/**
 * Static configuration shared across the admin shell.
 *
 * Anything dynamic (stats, orders, activity) is fetched at runtime by
 * the dashboard's React Server / client components — see
 * `lib/services/dashboard.service.ts` and `features/admin-dashboard`.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
