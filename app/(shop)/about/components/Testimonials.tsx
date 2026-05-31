"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";

export type TestimonialItem = {
  id: string;
  name: string;
  location: string | null;
  image: string | null;
  rating: number;
  text: string;
};

function avatarFor(item: TestimonialItem): string {
  if (item.image) return item.image;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    item.name,
  )}`;
}

function TestimonialCard({ t }: { t: TestimonialItem }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
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
              src={avatarFor(t)}
              alt={t.name}
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{t.name}</p>
            {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Loved by shoppers" section.
 *
 * Data is admin-managed (see /admin/testimonials). With 3 or fewer
 * active testimonials we render a tidy static grid. With more than 3 we
 * switch to a continuous left-to-right auto-scrolling marquee that loops
 * seamlessly (two copies of the list translated by -50%) and pauses on
 * hover. The whole section hides itself when there's nothing to show.
 */
export default function Testimonials({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  if (!testimonials || testimonials.length === 0) return null;

  const isMarquee = testimonials.length > 3;
  // Slow the scroll down as the list grows so it never feels frantic.
  const durationSeconds = Math.max(20, testimonials.length * 6);

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

      {isMarquee ? (
        <div
          className="testimonial-marquee group relative overflow-hidden"
          style={
            { "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties
          }
        >
          {/* Edge fades so cards ease in/out instead of clipping hard. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent sm:w-20" />

          <div className="testimonial-marquee-track flex gap-3 sm:gap-4">
            {/* Two copies back-to-back so the -50% loop is seamless. */}
            {[...testimonials, ...testimonials].map((t, index) => (
              <div
                key={`${t.id}-${index}`}
                className="w-[280px] shrink-0 sm:w-[340px]"
                aria-hidden={index >= testimonials.length}
              >
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}
