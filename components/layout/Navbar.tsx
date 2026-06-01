"use client";

import {
  Menu,
  User,
  ShoppingCart,
  Heart,
  Phone,
  Shield,
  Store,
  Info,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useSelector } from "react-redux";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/layout/SearchBar";
import { confirm } from "@/lib/feedback";
import type { RootState } from "@/store";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof Store;
  adminOnly?: boolean;
};

const MENU_ITEMS: readonly MenuItem[] = [
  { href: "/products", label: "All Products", icon: Store },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Phone },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
] as const;

/** Grace period (ms) so the cursor can travel from trigger to dropdown content. */
const HOVER_CLOSE_DELAY_MS = 120;

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "ADMIN";

  // Badge counts from Redux store
  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const wishlistCount = useSelector(
    (state: RootState) => state.wishlist.items.length,
  );

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  const openProfileMenu = () => {
    cancelClose();
    setProfileMenuOpen(true);
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign out?",
      description: "You'll need to sign in again to access your account.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay",
      variant: "warning",
    });
    if (!ok) return;
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    void signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#E6E6FA] px-1 py-2 sm:px-4 lg:border-b lg:border-gray-200 lg:px-0 lg:py-0">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 rounded-md border border-[#8140DF] bg-white py-2.5 shadow-sm sm:px-4 lg:rounded-none lg:border-none lg:bg-transparent lg:py-3 lg:shadow-none lg:px-6">
        {/* LEFT: Mobile Menu + Logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-full p-2 text-gray-700 transition-colors duration-200 hover:bg-white/40 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
          >
           
            <div className="flex select-none flex-col leading-tight">
              <Image
                src="/logo/logo.png"
                alt="EnterFly Logo"
                width={80}
                height={80}
              />
              {/* <p className="-mt-0.5 hidden whitespace-nowrap text-[9px] font-medium tracking-wide text-gray-800 sm:block sm:text-xs">
                Premium Local Shopping
              </p> */}
            </div>
          </Link>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden items-center gap-2 lg:flex">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-out",
                  active
                    ? "text-violet-700"
                    : "text-gray-800 hover:text-violet-700",
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-0.5 w-[60%] -translate-x-1/2 rounded-full bg-violet-600 transition-all duration-300 ease-out",
                    active
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP SEARCH */}
        <SearchBar className="mx-4 hidden max-w-lg flex-1 md:block" />

        {/* RIGHT ICONS */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {!user && (
            <Link
              href="/login"
              className="flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:text-violet-700 lg:hidden"
            >
              <span>Sign in</span>
              <User className="h-5 w-5" />
            </Link>
          )}

          {user && (
            <Link
              href="/profile"
              className="rounded-full p-2 transition-colors duration-200 hover:bg-white/40 lg:hidden"
              aria-label="My profile"
            >
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400 bg-violet-100">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={24}
                    height={24}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-violet-600" />
                )}
              </div>
            </Link>
          )}

          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}` : ""}`}
            className="group relative rounded-full p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40"
          >
            <Heart className="h-5 w-5 text-violet-600 transition-transform duration-200 group-hover:scale-110" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
            className="group relative rounded-full p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40"
          >
            <ShoppingCart className="h-5 w-5 text-violet-600 transition-transform duration-200 group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* DESKTOP: PROFILE / AUTH */}
          <div className="relative hidden lg:block">
            {user ? (
              <DropdownMenu
                modal={false}
                open={profileMenuOpen}
                onOpenChange={setProfileMenuOpen}
              >
                <div
                  onMouseEnter={openProfileMenu}
                  onMouseLeave={scheduleClose}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        // When the menu is already open (e.g. via hover), the
                        // trigger's pointerdown would toggle it closed and
                        // leave it stuck — the cursor is still on the button
                        // so no fresh mouseenter fires to reopen it. Block
                        // Radix's toggle in that case; the menu still closes
                        // via mouseleave, outside-click, or Escape.
                        if (profileMenuOpen) {
                          event.preventDefault();
                        }
                      }}
                      className="group flex items-center gap-2 rounded-full p-1.5 transition-colors duration-200 hover:bg-white/40"
                      aria-label="Open profile menu"
                    >
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400 bg-violet-100 transition-transform duration-300 group-hover:scale-105">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-violet-600" />
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-600 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                </div>

                <DropdownMenuContent
                  align="end"
                  className="w-64 p-0"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="border-b border-gray-100 bg-linear-to-r from-violet-50 to-indigo-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-violet-400 bg-violet-100">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-violet-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {user.name || "User"}
                        </p>
                        {user.email && (
                          <p className="truncate text-xs text-violet-600">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-1.5">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleLogout();
                      }}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40 hover:text-violet-700"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[85%] max-w-sm bg-[#E6E6FA] p-0 lg:hidden"
        >
          <SheetHeader className="bg-linear-to-r from-violet-600 to-indigo-700 px-4 py-3 text-white">
            <SheetTitle className="text-base font-bold text-white">
              Menu
            </SheetTitle>
          </SheetHeader>

          {/* Mobile Search */}
          <div className="border-b border-violet-200 bg-white/40 px-4 py-3">
            <SearchBar
              placeholder="Search..."
              inputClassName="rounded-xl border-violet-300 bg-white"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200",
                    active
                      ? "bg-linear-to-r from-violet-600 to-indigo-700 text-white shadow-md"
                      : "text-gray-800 hover:translate-x-1 hover:bg-white/60 hover:text-violet-700",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-gray-300 pt-2">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-800 transition-all duration-200 hover:translate-x-1 hover:bg-white/60 hover:text-violet-700"
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void handleLogout(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-red-600 transition-all duration-200 hover:translate-x-1 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-800 transition-all duration-200 hover:translate-x-1 hover:bg-white/60 hover:text-violet-700"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl bg-linear-to-r from-violet-600 to-indigo-700 px-4 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
