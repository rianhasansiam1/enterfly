"use client";

import { Bell, Menu, Search, User } from "lucide-react";
import { Input } from "@/app/CommonComponents/ui/input";

type Props = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
};

export default function AdminHeader({ title, subtitle, onOpenSidebar }: Props) {
  return (
    <header className="mb-4 flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-md sm:px-4 lg:px-5">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
        className="rounded-lg p-2 text-gray-700 transition-colors duration-200 hover:bg-violet-50 hover:text-violet-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate bg-linear-to-r from-violet-600 to-indigo-700 bg-clip-text text-base font-extrabold text-transparent sm:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden truncate text-xs font-medium text-gray-500 sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="ml-auto hidden w-64 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search orders, users…"
            className="h-9 rounded-xl border-violet-200 bg-white pl-9 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative rounded-full p-2 text-gray-700 transition-colors duration-200 hover:bg-violet-50 hover:text-violet-700"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      </button>

      <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white px-1 py-1 pr-3 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <User className="h-4 w-4" />
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-bold text-gray-900">Admin</p>
          <p className="text-[10px] text-gray-500">Super Admin</p>
        </div>
      </div>
    </header>
  );
}
