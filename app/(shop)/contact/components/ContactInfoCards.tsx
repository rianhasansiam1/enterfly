"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";

const cards = [
  {
    icon: Mail,
    title: "Email Us",
    value: "enterfly26@gmail.com",
    helper: "We reply within 2 hours",
    href: "mailto:enterfly26@gmail.com",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "01307026260",
    helper: "Mon - Sun, 9am to 9pm",
    href: "tel:01307026260",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Mirpur, Dhaka",
    helper: "Dhaka, Bangladesh",
    href: "#location",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "9:00 - 21:00",
    helper: "All days of the week",
    href: "#hours",
    color: "from-amber-500 to-orange-600",
  },
];

export default function ContactInfoCards() {
  return (
    <section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <a
              key={c.title}
              href={c.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${c.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
                {c.title}
              </p>
              <p className="mt-1 text-base font-black text-gray-900 sm:text-lg">
                {c.value}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{c.helper}</p>

              {/* Decorative corner */}
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-violet-50 transition-transform duration-500 group-hover:scale-150" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
