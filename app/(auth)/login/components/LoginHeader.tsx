"use client";

import Link from "next/link";
import { Wand2 } from "lucide-react";

type LoginHeaderProps = {
  onUseDemoData?: () => void;
};

export default function LoginHeader({ onUseDemoData }: LoginHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Welcome{" "}
            <span className="bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              back
            </span>
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-violet-700 underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        {onUseDemoData && (
          <button
            type="button"
            onClick={onUseDemoData}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:shadow-md"
          >
            <Wand2 className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
            Use demo data
          </button>
        )}
      </div>
    </header>
  );
}
