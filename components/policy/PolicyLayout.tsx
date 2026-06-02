"use client";

/**
 * PolicyLayout
 * ------------
 * Reusable layout for legal / policy pages (Privacy Policy, Return Policy,
 * Terms & Conditions). Provides a consistent hero header, container, and
 * section spacing that matches the EnterFly storefront design system
 * (violet/pink gradient accents, rounded-3xl cards, `font-black` headings).
 *
 * NOTE: The legal copy rendered through this layout is provided as a
 * professional starting point. Before going to production, please have
 * the content reviewed by a qualified legal professional to ensure
 * compliance with applicable laws in your jurisdiction.
 */

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type PolicyLayoutProps = {
  /** Short eyebrow label shown above the title (e.g. "Legal"). */
  eyebrow?: string;
  /** Main page title, e.g. "Privacy Policy". */
  title: string;
  /** Short supporting description below the title. */
  description: string;
  /** ISO date string used for the "Last updated" stamp. */
  lastUpdated?: string;
  /** Page content (sections built from <PolicySection />). */
  children: React.ReactNode;
};

export default function PolicyLayout({
  eyebrow = "Legal",
  title,
  description,
  lastUpdated,
  children,
}: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-10">
          <div className="absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full bg-violet-200 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-pink-200 blur-3xl" />

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-violet-700" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
              {eyebrow}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {title.split(" ").map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span
                  key={i}
                  className="bg-linear-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent"
                >
                  {word}
                </span>
              ) : (
                <span key={i}>{word} </span>
              )
            )}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {description}
          </p>

          {lastUpdated && (
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
              Last updated:{" "}
              <time dateTime={lastUpdated} className="text-gray-700">
                {new Date(lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
          )}
        </header>

        {/* Content sections */}
        <article className="space-y-6 sm:space-y-8">{children}</article>

        {/* Related policies footer */}
        <nav
          aria-label="Related policies"
          className="rounded-3xl bg-linear-to-br from-violet-50 to-pink-50 p-5 ring-1 ring-violet-100 sm:p-6"
        >
          <h2 className="text-base font-black text-gray-900 sm:text-lg">Related policies</h2>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">
            Please also review our other customer policies.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/return-policy", label: "Return Policy" },
              { href: "/terms-and-conditions", label: "Terms & Conditions" },
              { href: "/contact", label: "Contact Us" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-600 hover:text-white sm:text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

type PolicySectionProps = {
  /** Section heading, e.g. "1. Information We Collect". */
  title: string;
  /** Optional short intro paragraph rendered under the heading. */
  intro?: string;
  children?: React.ReactNode;
};

/** Card-styled section block used inside `PolicyLayout`. */
export function PolicySection({ title, intro, children }: PolicySectionProps) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-7">
      <h2 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{intro}</p>
      )}
      {children && (
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
          {children}
        </div>
      )}
    </section>
  );
}

type PolicyListProps = {
  items: React.ReactNode[];
};

/** Bulleted list with violet markers matching the storefront style. */
export function PolicyList({ items }: PolicyListProps) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-violet-500 to-pink-500"
          />
          <span className="text-sm leading-relaxed text-gray-700 sm:text-base">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Highlighted contact / callout block shared across policy pages. */
export function PolicyContactBlock() {
  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-50 to-pink-50 p-4 ring-1 ring-violet-100 sm:p-5">
      <p className="text-sm font-bold text-gray-900 sm:text-base">EnterFly Customer Support</p>
      <ul className="mt-2 space-y-1 text-sm text-gray-700 sm:text-base">
        <li>
          <span className="font-semibold text-gray-900">Email:</span>{" "}
          <a
            href="mailto:enterfly26@gmail.com"
            className="text-violet-700 hover:text-violet-800 hover:underline"
          >
            enterfly26@gmail.com
          </a>
        </li>
        <li>
          <span className="font-semibold text-gray-900">Phone:</span>{" "}
          <a
            href="tel:+8801307026260"
            className="text-violet-700 hover:text-violet-800 hover:underline"
          >
            +8801307026260
          </a>
        </li>
        <li>
          <span className="font-semibold text-gray-900">Address:</span> Dhaka, Bangladesh
        </li>
      </ul>
    </div>
  );
}
