"use client";

import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";

import store from "@/store";

/**
 * Single client-side provider tree mounted by the root layout.
 *
 * Wraps the app in:
 *   - NextAuth's `SessionProvider` so any descendant client component can
 *     call `useSession`, `signIn`, or `signOut`.
 *   - The Redux store so dispatch/select hooks work app-wide.
 *
 * Kept as one file so the root layout only mounts one client boundary.
 */
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>{children}</ReduxProvider>
    </SessionProvider>
  );
}
