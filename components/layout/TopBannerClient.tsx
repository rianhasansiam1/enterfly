"use client";

import {
  X,
  Sparkles,
  ArrowRight,
  Tag,
  Zap,
  Gift,
  TrendingUp,
  Percent,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

export type TopBannerSlide = {
  id: string;
  icon: string;
  badge: string;
  discount: string;
  description: string;
  tag: string;
  tagIcon: string;
  link: string | null;
};

/**
 * Map the icon-name strings stored on the banner (admin types e.g.
 * "Sparkles", "Zap") onto real lucide components. Unknown names fall
 * back to a sensible default so a typo never crashes the render.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  Sparkles,
  Zap,
  Gift,
  TrendingUp,
  Percent,
  ArrowRight,
};

function resolveIcon(name: string, fallback: LucideIcon): LucideIcon {
  return ICON_MAP[name] ?? fallback;
}

function BannerIcon({
  name,
  fallback,
  className,
}: {
  name: string;
  fallback: LucideIcon;
  className?: string;
}) {
  return React.createElement(resolveIcon(name, fallback), { className });
}

const TopBannerClient = ({ slides }: { slides: TopBannerSlide[] }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate only when there's more than one slide to show.
  useEffect(() => {
    if (!isVisible || slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
        timeoutRef.current = null;
      }, 300);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible, slides.length]);

  // Guard the index against a slide list that shrank between renders.
  const safeIndex = currentIndex % Math.max(slides.length, 1);
  const currentSale = slides[safeIndex];

  if (!isVisible || !currentSale) return null;

  return (
    <div className="relative w-screen max-w-[100vw] overflow-hidden bg-linear-to-r from-violet-700 via-violet-600 to-indigo-600">
      <div className="mx-auto flex min-h-10 w-full max-w-7xl items-center gap-1.5 px-2 py-1.5 sm:gap-3 sm:px-4">
        <Link
          href={currentSale.link || "/products"}
          className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <div
            className={`flex w-full min-w-0 max-w-full items-center justify-center gap-x-1.5 overflow-hidden text-center text-white transition-all duration-300 ease-in-out sm:gap-x-3 md:gap-x-4 ${
              isAnimating
                ? "translate-y-1 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div className="flex shrink-0 items-center gap-1">
              <BannerIcon
                name={currentSale.icon}
                fallback={Tag}
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5"
              />
              <span className="truncate font-bold text-[11px] tracking-wide sm:text-sm md:text-base">
                {currentSale.badge}
              </span>
            </div>

            <div className="hidden h-4 w-px shrink-0 bg-white/40 sm:block"></div>

            <p className="min-w-0 truncate text-[10px] font-medium sm:text-xs md:text-sm">
              <span className="mx-1 font-extrabold text-xs text-yellow-300 sm:text-base md:text-lg">
                {currentSale.discount}
              </span>
              <span className="hidden sm:inline">{currentSale.description}</span>
            </p>

            <div className="hidden h-4 w-px shrink-0 bg-white/40 md:block"></div>

            <span className="hidden min-w-0 items-center gap-1 truncate text-xs md:flex md:text-sm">
              <BannerIcon
                name={currentSale.tagIcon}
                fallback={Sparkles}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="truncate">{currentSale.tag}</span>
            </span>
          </div>
        </Link>

        <Link
          href={currentSale.link || "/products"}
          aria-label="Shop now"
          className="hidden shrink-0 items-center justify-center gap-1.5 rounded-md bg-white text-violet-700 sm:flex
            text-xs font-semibold shadow-sm transition-colors duration-200 hover:bg-violet-50 sm:h-auto sm:w-auto sm:px-3 sm:py-1 md:text-sm"
        >
          <span>Shop Now</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          aria-label="Close Banner"
          onClick={() => setIsVisible(false)}
          className="order-first flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 transition-colors hover:bg-white/25 sm:order-none sm:bg-transparent"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/40"></div>
    </div>
  );
};

export default TopBannerClient;
