"use client";

import { MapPin, Navigation, Building2 } from "lucide-react";

const offices = [
  {
    city: "Mumbai (HQ)",
    address: "Marine Lines, Mumbai, Maharashtra 400002",
    phone: "+91 99999 99999",
  },
  {
    city: "Bengaluru",
    address: "Indiranagar, Bengaluru, Karnataka 560038",
    phone: "+91 88888 88888",
  },
  {
    city: "Delhi",
    address: "Connaught Place, New Delhi, 110001",
    phone: "+91 77777 77777",
  },
];

export default function ContactMap() {
  return (
    <section id="location">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-violet-700" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
            Our Offices
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          Find us across{" "}
          <span className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            the country
          </span>
        </h2>
      </div>

      <div className="h-0.5 w-full bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full mb-6" />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-lg ring-1 ring-violet-100 sm:h-80 lg:h-full lg:min-h-[420px]">
            <iframe
              title="EnterFly HQ"
              src="https://www.google.com/maps?q=Marine+Lines+Mumbai&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {/* Overlay badge */}
            <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-md ring-1 ring-violet-100 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-bold text-gray-800">EnterFly HQ</span>
            </div>
          </div>
        </div>

        {/* Office list */}
        <div className="lg:col-span-2">
          <div className="grid gap-3 sm:gap-4">
            {offices.map((o, i) => (
              <div
                key={o.city}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-purple-600 text-white shadow-md">
                    {i === 0 ? (
                      <Navigation className="h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-gray-900">
                        {o.city}
                      </h3>
                      {i === 0 && (
                        <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-violet-900">
                          HQ
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {o.address}
                    </p>
                    <a
                      href={`tel:${o.phone.replace(/\s/g, "")}`}
                      className="mt-2 inline-block text-sm font-bold text-violet-600 hover:text-violet-800 hover:underline"
                    >
                      {o.phone}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
