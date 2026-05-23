"use client";

import {
  Search,
  Menu,
  User,
  ShoppingCart,
  Heart,
  MapPin,
  Store,
  Map,
  Info,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  // Placeholder user for UI only (no auth functionality)
  const user = null as { name?: string; email?: string; image?: string; username?: string } | null;

  const menuItems = [
    { href: "/products", label: "All Products", icon: Store },
  
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact",icon: Info}
  ];

  const transitionClass = "transition-all duration-300 ease-in-out";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#E6E6FA] py-2 px-1 sm:px-4 lg:py-0 lg:px-0 lg:border-b lg:border-gray-200">
      <div className="w-full max-w-7xl mx-auto sm:px-4 lg:px-6 py-2.5 lg:py-3 flex items-center justify-between gap-2 bg-white border border-[#8140DF] lg:border-none lg:rounded-none lg:bg-transparent shadow-sm lg:shadow-none">
        
        {/* LEFT SECTION - Mobile Menu + Logo */}
        <div className="flex items-center gap-2">
          {/* MOBILE MENU BUTTON - Left side on mobile */}
          <button
            onClick={toggleMobileMenu}
            className={`lg:hidden p-2 rounded-full ${
              mobileMenuOpen
                ? "bg-white/60 text-violet-700"
                : "hover:bg-white/40 text-gray-700"
            } transition`}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-violet-600 flex items-center justify-center overflow-hidden">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex flex-col leading-tight select-none">
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold bg-linear-to-r from-violet-600 to-indigo-700 bg-clip-text text-transparent whitespace-nowrap">
              EnterFly
              </h1>
              <p className="hidden sm:block text-[9px] sm:text-xs text-gray-800 tracking-wide font-medium -mt-0.5 whitespace-nowrap">
                Premium Local Shopping
              </p>
            </div>
          </Link>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden lg:flex items-center gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm ${transitionClass} ${
                  active
                    ? "text-violet-700"
                    : "text-gray-800 hover:text-violet-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-[60%] bg-violet-600 rounded-full transition-all duration-300 ease-in-out ${
                    active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP SEARCH */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, stores, categories..."
              className={`w-full pl-11 pr-4 py-2.5 bg-white/60 border border-violet-500/40 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-violet-500 focus:bg-white ${transitionClass}`}
            />
            {query && (
              <button
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/70 rounded-full transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ICONS */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* MOBILE: Sign in text + User icon (when logged out) */}
          {!user && (
            <Link
              href="/signin"
              className="lg:hidden flex items-center gap-1 px-2 py-1.5 text-sm font-semibold text-gray-700 hover:text-violet-700 transition"
            >
              <span>Sign in</span>
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* MOBILE: Profile icon (when logged in) */}
          {user && (
            <Link
              href="/profile"
              className="lg:hidden p-2 hover:bg-white/40 rounded-full transition"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-violet-400 bg-violet-100 flex items-center justify-center">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-violet-600" />
                )}
              </div>
            </Link>
          )}

          {/* WISHLIST */}
          <Link
            href="/wilshlist"
            className="relative p-2 hover:bg-white/40 rounded-full group transition"
          >
            <Heart className="w-5 h-5 text-violet-600" />
          </Link>

          {/* CART */}
          <Link
            href="/addtocart"
            className="relative p-2 hover:bg-white/40 rounded-full group transition"
          >
            <ShoppingCart className="w-5 h-5 text-violet-600" />
          </Link>

          {/* DESKTOP: PROFILE / AUTH */}
          <div className="relative hidden lg:block" ref={profileRef}>
            {user ? (
              // Logged in - show profile dropdown
              <button
                onClick={toggleProfileDropdown}
                className="hidden sm:flex items-center gap-2 p-1.5 hover:bg-white/40 rounded-full transition"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-violet-400 bg-violet-100 flex items-center justify-center">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-violet-600" />
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    profileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              // Logged out - show auth buttons
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/signin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-violet-700 hover:bg-white/40 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Profile Dropdown */}
            {profileDropdownOpen && user && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* User Info */}
                <div className="p-4 bg-linear-to-r from-violet-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-400 bg-violet-100 flex items-center justify-center">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "User"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-violet-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.name || user.username || "User"}
                      </p>
                      <p className="text-xs text-violet-600">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition"
                  >
                    <Package className="w-4 h-4" />
                    My Orders
                  </Link>
                  <Link
                    href="/wilshlist"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition"
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Link>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 border-t border-gray-200 pt-3 bg-[#E6E6FA]">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base transition ${
                    active
                      ? "text-white bg-linear-to-r from-violet-600 to-indigo-700 shadow-md"
                      : "text-gray-800 hover:bg-white/50 hover:text-violet-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Profile/Auth Section */}
            <div className="mt-2 pt-2 border-t border-gray-300">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={toggleMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base text-gray-800 hover:bg-white/50 hover:text-violet-700 transition"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={toggleMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base text-gray-800 hover:bg-white/50 hover:text-violet-700 transition"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={toggleMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base text-white bg-linear-to-r from-violet-600 to-indigo-700 shadow-md transition"
                  >
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
