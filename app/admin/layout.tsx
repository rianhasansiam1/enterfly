"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  // Close the mobile drawer whenever the route changes.
  // Adjusts state during render instead of in an effect to avoid the cascading-render warning.
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (sidebarOpen) setSidebarOpen(false);
  }

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = sidebarOpen ? "hidden" : previous;
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
