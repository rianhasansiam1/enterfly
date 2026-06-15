"use client";

import { Users, ShoppingBag, Store, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50K+",
    label: "Happy Customers",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: ShoppingBag,
    value: "10K+",
    label: "Products Listed",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Store,
    value: "500+",
    label: "Verified Stores",
    color: "from-indigo-500 to-blue-600",
  },
  {
    icon: Award,
    value: "4.8/5",
    label: "Average Rating",
    color: "from-amber-500 to-orange-600",
  },
];

export default function AboutStats() {
  return (
    <section>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${stat.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <p className="text-xl font-black text-gray-900 sm:text-2xl lg:text-3xl">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-gray-600 sm:text-sm">
                {stat.label}
              </p>

              {/* Decorative corner */}
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-violet-50 transition-transform duration-500 group-hover:scale-150" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
