"use client";

import Image from "next/image";
import { Heart, Target } from "lucide-react";

export default function OurStory() {
  return (
    <section>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image side */}
        <div className="relative">
          <div className="relative h-72 w-full overflow-hidden rounded-3xl shadow-xl sm:h-80 lg:h-96">
            <Image
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"
              alt="Our story"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-violet-900/60 via-violet-900/20 to-transparent" />
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-5 -right-3 hidden rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-violet-100 sm:flex sm:items-center sm:gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 text-white">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Made with</p>
              <p className="text-sm font-black text-gray-900">Love & Care</p>
            </div>
          </div>

          {/* Decorative blob */}
          <div className="absolute -left-4 -top-4 -z-10 h-24 w-24 rounded-full bg-yellow-200 blur-2xl" />
          <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full bg-violet-200 blur-2xl" />
        </div>

        {/* Text side */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5">
            <Target className="h-3.5 w-3.5 text-violet-700" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
              Our Story
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Bringing your{" "}
            <span className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              neighborhood
            </span>{" "}
            online.
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            EnterFly was born from a simple idea: local shopping should feel as easy as ordering online,
            without losing the trust and quality of your favorite neighborhood stores. We started in 2024
            with a small team passionate about empowering local businesses with modern technology.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Today, we partner with hundreds of verified merchants to bring you fresh groceries, trending
            fashion, electronics, and home essentials, all delivered with care from stores within 50km of
            your doorstep.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-linear-to-br from-violet-50 to-purple-50 p-4 ring-1 ring-violet-100">
              <p className="text-2xl font-black text-violet-700">2024</p>
              <p className="text-xs font-medium text-gray-600">Founded</p>
            </div>
            <div className="rounded-2xl bg-linear-to-br from-pink-50 to-rose-50 p-4 ring-1 ring-pink-100">
              <p className="text-2xl font-black text-pink-700">100%</p>
              <p className="text-xs font-medium text-gray-600">Verified Stores</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
