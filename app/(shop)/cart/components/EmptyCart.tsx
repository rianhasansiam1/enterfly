import Link from "next/link";
import { ShoppingBag, Sparkles, Heart } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="relative mx-auto mt-10 max-w-xl overflow-hidden rounded-3xl border border-violet-100 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-fuchsia-200/40 blur-3xl" />

      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-linear-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
        <ShoppingBag className="h-9 w-9" />
        <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-amber-300 text-amber-900 shadow">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      </div>

      <h2 className="relative mt-6 text-xl font-bold text-gray-900 sm:text-2xl">
        Your cart is feeling lonely
      </h2>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-gray-600">
        Browse the catalog and add a few favorites. Your wishlist is a great
        place to start.
      </p>

      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/wishlist"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50"
        >
          <Heart className="h-4 w-4" />
          Open wishlist
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:to-indigo-700 hover:shadow-md"
        >
          <ShoppingBag className="h-4 w-4" />
          Start shopping
        </Link>
      </div>
    </div>
  );
}
