import Link from "next/link";

type RelatedPoliciesProps = {
  /** Path of the page currently being rendered, so it can be excluded from the list. */
  currentPath?: string;
};

const LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact Us" },
];

/**
 * Footer navigation card linking to the other customer-facing policies.
 * Shown at the bottom of every policy page; the current page is filtered
 * out when `currentPath` is provided.
 */
export default function RelatedPolicies({ currentPath }: RelatedPoliciesProps) {
  const links = currentPath ? LINKS.filter((l) => l.href !== currentPath) : LINKS;

  return (
    <nav
      aria-label="Related policies"
      className="rounded-3xl bg-linear-to-br from-violet-50 to-pink-50 p-5 ring-1 ring-violet-100 sm:p-6"
    >
      <h2 className="text-base font-black text-gray-900 sm:text-lg">Related policies</h2>
      <p className="mt-1 text-xs text-gray-600 sm:text-sm">
        Please also review our other customer policies.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
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
  );
}
