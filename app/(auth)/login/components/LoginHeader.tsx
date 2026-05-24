"use client";

import Link from "next/link";

export default function LoginHeader() {
  return (
    <header className="flex flex-col gap-4">
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
    </header>
  );
}
