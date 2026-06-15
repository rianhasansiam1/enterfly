"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type SuccessStateProps = {
  email: string;
};

export default function SuccessState({ email }: SuccessStateProps) {
  return (
    <div
      className="flex flex-col items-center py-8 text-center"
      style={{ animation: "pop 0.6s ease-out" }}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />

        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40">
          <CheckCircle2 className="h-10 w-10" />
        </div>
      </div>

      <h3 className="mt-6 text-2xl font-black tracking-tight text-gray-900">
        You&apos;re signed in
      </h3>

      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {email
          ? `Welcome back, ${email}. Pick up right where you left off.`
          : "Welcome back. Pick up right where you left off."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:text-violet-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
