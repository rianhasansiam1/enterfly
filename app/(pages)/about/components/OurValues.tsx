"use client";

import { Heart, Lightbulb, Users, Leaf } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Customer First",
    desc: "Every decision starts with what's best for our shoppers and partners.",
  },
  {
    icon: Lightbulb,
    title: "Always Innovating",
    desc: "We constantly improve to deliver smoother, smarter shopping.",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "We grow stronger by uplifting local merchants and neighborhoods.",
  },
  {
    icon: Leaf,
    title: "Mindful Impact",
    desc: "Sustainable, responsible commerce that respects people and planet.",
  },
];

export default function OurValues() {
  return (
    <section className="rounded-3xl bg-linear-to-br from-[#F5F3FF] via-white to-[#FFF1F8] p-6 sm:p-8 lg:p-10 ring-1 ring-violet-100">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-violet-200 shadow-sm">
          <Heart className="h-3.5 w-3.5 text-pink-600" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
            Our Values
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          What we stand for
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.title}
              className="group rounded-2xl bg-white/70 p-5 backdrop-blur-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-purple-600 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {v.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
