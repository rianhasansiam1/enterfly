"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { resolveBannerBackground } from "@/components/ui/tailwind-palette";

/**
 * Home page hero carousel.
 *
 * Slides are managed from the admin "Banners" page (CAROUSEL type in the
 * unified `Banner` model) and passed in from the server component. Each
 * slide paints its background either as a gradient (bgFrom/bgVia/bgTo)
 * or a single solid color (bgColor), selected by `bgType`.
 *
 * Colors are stored as hex values (chosen with the admin color picker) and
 * applied via inline `style`. Older rows that still hold Tailwind class
 * strings are resolved to hex by `resolveBannerBackground`, so existing
 * slides keep rendering.
 */
export type CarouselSlide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  bgType: "gradient" | "solid";
  bgFrom: string | null;
  bgVia: string | null;
  bgTo: string | null;
  bgColor: string | null;
  link: string | null;
};

/** Build the hero panel background as a CSS value (hex gradient or solid). */
function heroBackground(slide: CarouselSlide): string {
  return resolveBannerBackground({
    bgType: slide.bgType,
    bgColor: slide.bgColor,
    bgFrom: slide.bgFrom,
    bgVia: slide.bgVia,
    bgTo: slide.bgTo,
  });
}

/** Compact background for the deal selector cards (no "via" stop). */
function cardBackground(slide: CarouselSlide): string {
  return resolveBannerBackground({
    bgType: slide.bgType,
    bgColor: slide.bgColor,
    bgFrom: slide.bgFrom,
    bgTo: slide.bgTo,
  });
}

export default function CaroselBanner({ slides }: { slides: CarouselSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) =>
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1,
      );
    }, 3500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  // Slides can change between renders (admin edits + revalidation), so
  // clamp at render time to stay in range without an extra state sync.
  const safeIndex = Math.min(activeIndex, slides.length - 1);
  const activeDeal = slides[safeIndex];

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl mx-3 sm:mx-4 lg:mx-6 mt-4 transition-all duration-700"
        style={{ background: heroBackground(activeDeal) }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex h-[40vh] flex-row items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-8 sm:py-6 md:h-auto md:px-10 md:py-12">
          {/* Text Content */}
          <div
            key={activeDeal.id}
            className="min-w-0 flex-1 max-w-lg text-left text-white animate-in fade-in slide-in-from-left-5 duration-700"
          >
            <span className="mb-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs md:mb-3">
              🎉 {activeDeal.badge}
            </span>

            <h1 className="mb-2 text-xl font-black leading-tight sm:text-3xl md:mb-3 md:text-4xl lg:text-5xl">
              {activeDeal.title}
              <br />
              <span className="text-yellow-300">{activeDeal.subtitle}</span>
            </h1>

            <p className="mb-3 line-clamp-2 max-w-md text-[11px] leading-snug text-white/80 sm:line-clamp-3 sm:text-sm md:mb-5 md:line-clamp-none md:text-base">
              {activeDeal.description}
            </p>

            <div className="flex flex-wrap justify-start gap-2 md:gap-3">
              <Link
                href={activeDeal.link ?? "/products"}
                className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-violet-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-violet-900 hover:shadow-xl sm:px-4 sm:py-2 sm:text-xs md:px-6 md:py-2.5 md:text-sm"
              >
                Shop Now
              </Link>

              <Link
                href="/products"
                className="rounded-full border border-white/50 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:px-4 sm:py-2 sm:text-xs md:border-2 md:px-6 md:py-2.5 md:text-sm"
              >
                View Offers
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div
            key={`${activeDeal.id}-image`}
            className="relative size-24 shrink-0 animate-in fade-in zoom-in-95 duration-700 sm:size-36 md:size-64 lg:size-72"
          >
            <Image
              src={activeDeal.image}
              alt={activeDeal.subtitle}
              fill
              className="rounded-full border-2 border-white/30 object-cover shadow-2xl md:border-4"
              sizes="(max-width: 640px) 96px, (max-width: 768px) 144px, (max-width: 1024px) 256px, 288px"
              priority
            />

            <div className="absolute -right-1 -top-1 animate-bounce rounded-full bg-yellow-400 px-2 py-1 text-[9px] font-black text-violet-900 shadow-lg sm:text-[10px] md:-right-2 md:-top-2 md:px-3 md:py-1.5 md:text-sm">
              {activeDeal.title}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Cards */}
      {slides.length > 1 && (
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {slides.map((card, index) => {
              const isActive = index === safeIndex;

              return (
                <button
                  key={card.id}
                  onClick={() => setActiveIndex(index)}
                  style={{ background: cardBackground(card) }}
                  className={`rounded-xl min-w-[160px] sm:min-w-[180px] h-28 sm:h-32 shrink-0
                  shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                  cursor-pointer relative overflow-hidden group flex-1 text-left
                  ${
                    isActive
                      ? "ring-4 ring-yellow-300 ring-offset-2 ring-offset-white scale-[1.03]"
                      : "ring-1 ring-white/20"
                  }
                `}
                >
                  <Image
                    src={card.image}
                    alt={card.subtitle}
                    fill
                    className={`object-cover transition-all duration-500 ${
                      isActive
                        ? "opacity-60 scale-110"
                        : "opacity-40 group-hover:opacity-50 group-hover:scale-110"
                    }`}
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                  {/* Active Progress Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 h-1 bg-yellow-300 animate-[progress_3.5s_linear_infinite]" />
                  )}

                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3">
                    <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-lg mb-0.5">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-white/90 drop-shadow">
                      {card.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
