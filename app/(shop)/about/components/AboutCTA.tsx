"use client";

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

export default function AboutCTA() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-purple-600 to-pink-600 p-8 sm:p-10 lg:p-14 text-white shadow-xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
      <div className="absolute top-10 right-20 hidden h-20 w-20 rounded-full bg-yellow-300/20 blur-xl sm:block" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/20">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span className="text-[11px] font-bold uppercase tracking-wide">
            Ready to start?
          </span>
        </div>

        <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
          Discover deals from your{" "}
          <span className="text-yellow-300 drop-shadow-md">favorite local stores</span>
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          Join thousands of shoppers enjoying premium products at unbeatable prices, delivered with love
          from your neighborhood.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-violet-900 hover:shadow-lg"
          >
            Browse Products
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
          >
            Create Account
          </Link>
        </div>
      </div>
    </section>
  );
}
