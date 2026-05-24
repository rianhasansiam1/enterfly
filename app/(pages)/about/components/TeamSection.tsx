"use client";

import Image from "next/image";
import { Users } from "lucide-react";

const team = [
  {
    name: "Aarav Mehta",
    role: "Founder & CEO",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
  },
  {
    name: "Priya Sharma",
    role: "Head of Product",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
  },
  {
    name: "Rohan Kapoor",
    role: "Engineering Lead",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
  },
  {
    name: "Ishita Verma",
    role: "Customer Success",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
  },
];

export default function TeamSection() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5">
            <Users className="h-3.5 w-3.5 text-violet-700" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
              Meet The Team
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            People behind EnterFly
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            A passionate team obsessed with making local shopping feel effortless.
          </p>
        </div>
      </div>

      <div className="h-0.5 w-full bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full mb-6" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {team.map((member) => (
          <div
            key={member.name}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-violet-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-4/5 overflow-hidden bg-violet-50">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-violet-900/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                {member.name}
              </h3>
              <p className="text-xs font-medium text-violet-600 sm:text-sm">
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
