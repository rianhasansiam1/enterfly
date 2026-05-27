import type { Metadata } from "next";

import ProfileClient from "./components/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile | EnterFly",
  description:
    "Manage your account, view orders, wishlist, and cart history on EnterFly.",
  robots: { index: false, follow: false },
};

/**
 * "My Profile" dashboard.
 *
 * Server wrapper only — every tab below this needs the live session
 * and Redux stores (cart, wishlist), so the bulk of the page is a
 * client component.
 */
export default function ProfilePage() {
  return <ProfileClient />;
}
