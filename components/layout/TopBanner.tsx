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
} from "lucide-react";
import React, { useState, useEffect } from "react";

const TopBanner = () => {


    
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const salesData = [
    {
      icon: Tag,
      badge: "MEGA SALE",
      discount: "70% OFF",
      description: "on all products",
      tag: "Limited Time Only",
      tagIcon: Sparkles,
    },
    {
      icon: Gift,
      badge: "FLASH DEAL",
      discount: "Buy 2 Get 1",
      description: "on selected items",
      tag: "Today Only",
      tagIcon: Zap,
    },
    {
      icon: Percent,
      badge: "WEEKEND SPECIAL",
      discount: "50% OFF",
      description: "on electronics",
      tag: "Ends Sunday",
      tagIcon: TrendingUp,
    },
    {
      icon: Sparkles,
      badge: "NEW ARRIVALS",
      discount: "30% OFF",
      description: "latest collection",
      tag: "While Stocks Last",
      tagIcon: Zap,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % salesData.length);
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timeout);
    }, 4000);

    return () => clearInterval(interval);
  }, [salesData.length]);

  const currentSale = salesData[currentIndex];
  const CurrentIcon = currentSale.icon;
  const CurrentTagIcon = currentSale.tagIcon;

  if (!isVisible) return null;

  return (
    <div className="relative bg-linear-to-r from-violet-600 via-violet-500 to-indigo-500 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse opacity-60"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-100 opacity-60"></div>
        <div className="absolute -bottom-4 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse delay-200 opacity-60"></div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-1 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
          {/* Left Icon */}
          <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>

          {/* Animated Text */}
          <div className="grow flex items-center justify-center min-w-0">
            <div
              className={`flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-3 md:gap-x-4 gap-y-0.5 text-white 
              transition-all duration-300 ease-in-out text-center 
              ${
                isAnimating
                  ? "opacity-0 translate-y-1"
                  : "opacity-100 translate-y-0"
              }`}
            >
              {/* Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <CurrentIcon className="w-3 h-3 sm:w-4 md:w-5" />
                <span className="font-bold text-[10px] sm:text-sm md:text-base tracking-wide">
                  {currentSale.badge}
                </span>
              </div>

              <div className="hidden sm:block w-px h-4 bg-white/40"></div>

              {/* Discount Text */}
              <p className="text-[9px] sm:text-xs md:text-sm font-medium shrink-0">
                <span className="font-extrabold text-xs sm:text-base md:text-lg mx-1 text-yellow-300">
                  {currentSale.discount}
                </span>
                {currentSale.description}
              </p>

              <div className="hidden sm:block w-px h-4 bg-white/40"></div>

              {/* Tag */}
              <span className="hidden sm:flex items-center gap-1 text-xs md:text-sm shrink-0 whitespace-nowrap">
                <CurrentTagIcon className="w-3.5 h-3.5" />
                {currentSale.tag}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white text-violet-700 rounded-lg shrink-0
            font-semibold text-xs md:text-sm hover:bg-violet-50 transition-all duration-200 hover:scale-[1.05] shadow-lg shadow-violet-500/30"
          >
            Shop Now
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Close Button */}
          <button
            aria-label="Close Banner"
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/20 rounded-md transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
    </div>
  );
};

export default TopBanner;
