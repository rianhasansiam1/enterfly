import type { ReactNode } from "react";

import PolicyHero from "@/components/policy/PolicyHero";
import RelatedPolicies from "@/components/policy/RelatedPolicies";

type PolicyLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  lastUpdated?: string;
  currentPath?: string;
  children: ReactNode;
};

export default function PolicyLayout({
  eyebrow = "Legal",
  title,
  description,
  lastUpdated,
  currentPath,
  children,
}: PolicyLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <PolicyHero
          eyebrow={eyebrow}
          title={title}
          description={description}
          lastUpdated={lastUpdated}
        />

        <article className="space-y-6 sm:space-y-8">{children}</article>

        <RelatedPolicies currentPath={currentPath} />
      </div>
    </div>
  );
}
