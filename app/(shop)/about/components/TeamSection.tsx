"use client";

import Image from "next/image";
import { Users } from "lucide-react";

const team = [
  {
    name: "Rian Hasan Siam",
    role: "Head Of IT",
    image:
      "/images/RianDP.png",
  },
  {
    name: "Md Moniruzzaman",
    role: "CEO",
    image:
      "/images/raju.jpg",
  },
  {
    name: "Imtiaj Ahmed",
    role: "Co Founder",
    image:
      "/images/imtiaj.jpg",
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

      <div className="h-0.5 w-full bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full mb-8" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
        {team.map((member) => (
          <div
            key={member.name}
            className="group relative flex flex-col items-center rounded-3xl border border-violet-100 bg-white px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100"
          >
            {/* Portrait with gradient ring */}
            <div className="relative">
              <div className="rounded-full bg-linear-to-tr from-violet-500 via-fuchsia-500 to-indigo-500 p-1 transition-transform duration-300 group-hover:scale-105">
                <div className="rounded-full bg-white p-1">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full sm:h-32 sm:w-32">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              {member.name}
            </h3>
            <span className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
