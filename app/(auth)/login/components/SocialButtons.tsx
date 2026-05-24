"use client";

import GoogleIcon from "./icons/GoogleIcon";

export function SocialDivider() {
  return (
    <div className="my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-violet-200 to-violet-200" />

      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
        or continue with
      </span>

      <div className="h-px flex-1 bg-linear-to-l from-transparent via-violet-200 to-violet-200" />
    </div>
  );
}

export function SocialButtons() {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      <button
        type="button"
        className="group flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md"
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          <GoogleIcon />
        </span>

        <span>Continue with Google</span>
      </button>
    </div>
  );
}
