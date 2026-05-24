"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client wrapper around `SessionProvider` so it can be used inside the
 * (server) root layout. Required for `useSession` and the client `signOut`
 * helper to work in any descendant client component (e.g. the Navbar).
 */
export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
