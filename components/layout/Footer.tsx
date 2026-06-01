"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Shop Categories", href: "/products" },
  { name: "Flash Sales", href: "/products" },
  { name: "Trending Deals", href: "/products" },
  { name: "Contract", href: "/about" },
];

const supportLinks = [
  { name: "Any Help", href: "/about" },
  { name: "Terms & Conditions", href: "/about" },
  { name: "Privacy & Policy", href: "/about" },
  { name: "Return Policy", href: "/about" },
  { name: "FAQS", href: "/about" },
];

type SocialLink = {
  name: string;
  href: string;
  color: string;
  icon: React.ReactNode;
};

const socialLinks: SocialLink[] = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/enterfly26",
    color: "bg-[#3B5998]",
    icon: (
      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Dribbble",
    href: "#",
    color: "bg-[#EA4C89]",
    icon: (
      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm7.5 9.5c-.188-.063-1.688-.563-3.438-.25.75 2.063 1.063 3.75 1.125 4.125 1.313-.875 2.25-2.25 2.313-3.875zM17.5 15.5c-.125-.688-.563-3.063-1.625-5.188-.063.063-.125.063-.188.125-2.438.875-3.313 2.625-3.375 2.813-.625.875-1 1.938-1 3.125 0 .625.125 1.188.313 1.75 1.375-.75 2.875-1.75 3.938-2.563.313-.188.625-.375.938-.563zm-5.5 4c-1 0-1.938-.188-2.813-.5.188-.313 1.125-1.938 3-3.688.063-.063.125-.063.188-.125.75.188 1.438.375 2.188.5.063 0 .125.063.188.063-.313 1.438-1.125 2.75-2.75 3.75zM9.5 20.5c-1.063-.5-1.938-1.25-2.625-2.188-.188-.25-.375-.563-.563-.875.063 0 .125-.063.188-.063 2.125-.875 4.063-.563 4.688-.438-.063-.125-.063-.25-.125-.375-1.688-2.875-2.313-5.688-2.438-6.563-1.438.75-2.438 2.188-2.563 3.875 0 .063 0 .125.063.188.313 1.25 1.063 2.313 2.063 3.125.313.25.625.5.938.688.188.125.313.25.5.375zm-4.375-8.875c.063-1.313.5-2.5 1.25-3.5.188.063.375.125.563.188 1.813.688 3.813.688 5.188.563.125.25.25.5.313.75-2.188.688-4.125 2.188-5.313 4-.563-.875-.875-1.875-1-3zM12 3.5c1.063 0 2.063.25 2.938.688-.188.25-.375.5-.563.75-1.063 1.563-2.438 2.75-4 3.563-.5-.875-1.063-1.75-1.625-2.563C9.688 4.125 10.813 3.5 12 3.5z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "#",
    color: "bg-[#1DA1F2]",
    icon: (
      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
  },
  {
    name: "Google Plus",
    href: "#",
    color: "bg-[#DD4B39]",
    icon: (
      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.635 10.909v2.619h4.335c-.173 1.125-1.31 3.295-4.335 3.295-2.604 0-4.731-2.16-4.731-4.823 0-2.662 2.127-4.822 4.731-4.822 1.485 0 2.479.633 3.045 1.178l2.073-1.994c-1.33-1.245-3.056-1.995-5.118-1.995C3.412 4.365 0 7.785 0 12s3.412 7.635 7.635 7.635c4.41 0 7.332-3.098 7.332-7.461 0-.501-.054-.885-.12-1.265H7.635zm16.365 0h-2.183V8.726h-2.183v2.183h-2.182v2.181h2.182v2.184h2.183v-2.184H24v-2.181z" />
      </svg>
    ),
  },
];

const Footer = () => {
  return (
    <footer className="bg-[#E8E5F5] text-gray-800 ">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/logo/logo.png" alt="EnterFly Logo" width={120} height={100} />
            </div>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              Discover premium verified stores within 50km. Real-time deals, clean UI, and a
              superior local shopping experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-black text-violet-600 mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-gray-700 hover:text-violet-600 transition text-xs sm:text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Center */}
          <div>
            <h4 className="text-base sm:text-lg font-black text-violet-600 mb-3 sm:mb-4">Support Center</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {supportLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-gray-700 hover:text-violet-600 transition text-xs sm:text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            {/* Keep In Touch */}
            <h5 className="text-sm sm:text-base font-black text-gray-800 mb-2 sm:mb-3">Keep In Touch</h5>
            <p className="mb-3 max-w-xs text-xs leading-relaxed text-gray-600 sm:mb-4 sm:text-sm">
              Follow EnterFly for fresh deals and local shopping updates.
            </p>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/75 bg-white shadow-[0_8px_20px_-14px_rgba(17,24,39,0.75)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_28px_-18px_rgba(17,24,39,0.8)] sm:h-11 sm:w-11"
                >
                  <span className={`absolute inset-0 ${social.color}`} />
                  <span className="absolute inset-[1px] rounded-[11px] bg-white/10 backdrop-blur-[1px]" />
                  <span className="relative z-10 text-white transition-transform duration-300 group-hover:scale-110">
                    {social.icon}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
