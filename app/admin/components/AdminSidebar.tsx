"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, LogOut, ShieldCheck, X } from "lucide-react";
import { ADMIN_NAV } from "./data";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-60 flex w-72 flex-col border-r border-violet-100 bg-white shadow-xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 lg:shadow-sm",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand block */}
        <div className="flex items-center justify-between border-b border-violet-100 bg-linear-to-r from-violet-600 to-indigo-700 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">Admin Panel</p>
              <p className="text-[11px] font-medium text-violet-100">EnterFly Console</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-white/90 transition-colors duration-200 hover:bg-white/15 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Main
          </p>
          <ul className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                        : "text-gray-700 hover:translate-x-0.5 hover:bg-violet-50 hover:text-violet-700",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                          active ? "text-white" : "text-violet-600",
                        )}
                      />
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-gray-100 p-3">
          <Link
            href="/"
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-violet-50 hover:text-violet-700"
          >
            <Home className="h-4 w-4 text-violet-600" />
            Exit to Site
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
