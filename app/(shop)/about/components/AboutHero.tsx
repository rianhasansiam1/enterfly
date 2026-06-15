"use client";

import Link from "next/link";
import { ChevronRight, Sparkles, MapPin } from "lucide-react";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-violet-500 to-indigo-500 px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 text-white shadow-xl">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />
      <div className="absolute top-10 right-10 hidden h-24 w-24 rounded-full bg-yellow-300/20 blur-xl sm:block" />

      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[11px] font-bold tracking-wide uppercase">
              About EnterFly
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Premium Local Shopping,
            <span className="block text-yellow-300 drop-shadow-md">
              Reimagined for You.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
            EnterFly connects you with verified local stores within 50km, bringing real-time deals,
            handpicked products, and a seamless shopping experience to your doorstep.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-violet-900 hover:shadow-lg"
            >
              Shop Now
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Right floating card */}
        <div className="relative hidden lg:flex justify-center">
          <div className="relative w-full max-w-sm rounded-3xl bg-white/15 p-6 backdrop-blur-md ring-1 ring-white/20 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">EnterFly Marketplace</p>
                <p className="text-xs text-white/80">Trusted by 50,000+ shoppers</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { k: "10K+", v: "Products" },
                { k: "500+", v: "Local Stores" },
                { k: "50KM", v: "Delivery Range" },
                { k: "4.8★", v: "Customer Rating" },
              ].map((item) => (
                <div
                  key={item.v}
                  className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15"
                >
                  <p className="text-lg font-black text-yellow-300">{item.k}</p>
                  <p className="text-[11px] uppercase tracking-wide text-white/80">
                    {item.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
