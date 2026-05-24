"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sneha Iyer",
    location: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    rating: 5,
    text: "EnterFly is my go-to for everyday shopping. Same-day delivery from local stores feels like magic, and the prices are unbeatable.",
  },
  {
    name: "Karan Patel",
    location: "Bengaluru",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    rating: 5,
    text: "Clean app, real deals, and genuine products. I love that every store is verified. Customer support helped me within minutes.",
  },
  {
    name: "Nidhi Rao",
    location: "Pune",
    image:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200",
    rating: 4,
    text: "The flash sale section keeps me coming back. Quality has been consistent across groceries, fashion, and electronics.",
  },
];

export default function Testimonials() {
  return (
    <section>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5">
          <Quote className="h-3.5 w-3.5 text-violet-700" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
            Testimonials
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          Loved by{" "}
          <span className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            shoppers like you
          </span>
        </h2>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
          >
            <Quote className="absolute -top-1 -right-1 h-20 w-20 text-violet-100 transition-transform duration-500 group-hover:scale-110" />

            <div className="relative">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-violet-200">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.location}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
