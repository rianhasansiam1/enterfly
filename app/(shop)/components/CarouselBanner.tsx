"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const dealCards = [
  {
    id: "crb1",
    image:
      "https://images.unsplash.com/photo-1543168256-418811576931?w=800&h=500&fit=crop",
    title: "25% OFF",
    subtitle: "VEGETABLES",
    description: "Fresh vegetables delivered fast with special weekend discounts.",
    badge: "Weekend Special",
    bgFrom: "from-green-500",
    bgVia: "via-emerald-600",
    bgTo: "to-green-800",
    link: "/products?category=grocery",
  },
  {
    id: "crb2",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop",
    title: "SPECIAL",
    subtitle: "OFFER",
    description: "Grab limited-time fashion deals before the offer ends.",
    badge: "Flash Deal",
    bgFrom: "from-orange-400",
    bgVia: "via-red-500",
    bgTo: "to-rose-700",
    link: "/products?category=fashion",
  },
  {
    id: "crb3",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=500&fit=crop",
    title: "50%",
    subtitle: "DISCOUNT",
    description: "Upgrade your gadgets with amazing electronics discounts.",
    badge: "Mega Sale",
    bgFrom: "from-purple-500",
    bgVia: "via-indigo-600",
    bgTo: "to-blue-800",
    link: "/products?category=electronics",
  },
  {
    id: "crb4",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop",
    title: "DELICIOUS",
    subtitle: "50% OFF",
    description: "Order delicious food items with exciting discount offers.",
    badge: "Food Deal",
    bgFrom: "from-amber-400",
    bgVia: "via-orange-500",
    bgTo: "to-red-700",
    link: "/products?category=food",
  },
  {
    id: "crb5",
    image:
      "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=800&h=500&fit=crop",
    title: "FRESH PICKS",
    subtitle: "FRESH DEALS",
    description: "Explore fresh products, best picks, and daily offers.",
    badge: "Daily Picks",
    bgFrom: "from-teal-400",
    bgVia: "via-cyan-600",
    bgTo: "to-blue-800",
    link: "/products",
  },
];

export default function CaroselBanner() {



  const [activeIndex, setActiveIndex] = useState(0);

  const activeDeal = dealCards[activeIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) =>
        prevIndex === dealCards.length - 1 ? 0 : prevIndex + 1
      );
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden bg-linear-to-r ${activeDeal.bgFrom} ${activeDeal.bgVia} ${activeDeal.bgTo} rounded-2xl mx-3 sm:mx-4 lg:mx-6 mt-4 transition-all duration-700`}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 sm:px-10 py-8 sm:py-12">
          {/* Text Content */}
          <div
            key={activeDeal.id}
            className="text-white text-center md:text-left mb-6 md:mb-0 max-w-lg animate-in fade-in slide-in-from-left-5 duration-700"
          >
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-3">
              🎉 {activeDeal.badge}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
              {activeDeal.title}
              <br />
              <span className="text-yellow-300">{activeDeal.subtitle}</span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 mb-5 max-w-md">
              {activeDeal.description}
            </p>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href={activeDeal.link}
                className="px-6 py-2.5 bg-white text-violet-700 font-bold text-sm rounded-full hover:bg-yellow-300 hover:text-violet-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Shop Now
              </Link>

              <Link
                href="/products"
                className="px-6 py-2.5 border-2 border-white/50 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-all duration-300"
              >
                View Offers
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div
            key={`${activeDeal.id}-image`}
            className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 shrink-0 animate-in fade-in zoom-in-95 duration-700"
          >
            <Image
              src={activeDeal.image}
              alt={activeDeal.subtitle}
              fill
              className="object-cover rounded-full border-4 border-white/30 shadow-2xl"
              sizes="(max-width: 640px) 192px, (max-width: 1024px) 256px, 288px"
              priority
            />

            <div className="absolute -top-2 -right-2 bg-yellow-400 text-violet-900 font-black text-sm px-3 py-1.5 rounded-full shadow-lg animate-bounce">
              {activeDeal.title}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Cards */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {dealCards.map((card, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={card.id}
                onClick={() => setActiveIndex(index)}
                className={`bg-linear-to-br ${card.bgFrom} ${card.bgTo}
                  rounded-xl min-w-[160px] sm:min-w-[180px] h-28 sm:h-32 shrink-0
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

     
    </div>
  );
}