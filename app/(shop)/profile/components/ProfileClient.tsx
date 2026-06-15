"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";

import {
  fetchProfileOverview,
  type ProfileOverview,
  type ProfileUser,
} from "@/features/profile/api";

import CartTab from "./CartTab";
import OrdersTab from "./OrdersTab";
import OverviewTab from "./OverviewTab";
import ProfileHeader from "./ProfileHeader";
import ProfileSidebar from "./ProfileSidebar";
import SecurityTab from "./SecurityTab";
import SettingsTab from "./SettingsTab";
import WishlistTab from "./WishlistTab";
import { PROFILE_TABS, type ProfileTabId } from "./constants";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; overview: ProfileOverview }
  | { status: "error"; message: string };

const VALID_TABS = new Set(PROFILE_TABS.map((tab) => tab.id));

function isProfileTabId(value: string | null | undefined): value is ProfileTabId {
  return Boolean(value) && VALID_TABS.has(value as ProfileTabId);
}

/**
 * The actual My Profile dashboard.
 *
 * Layout is a two-column shell with a sticky sidebar of tabs on the
 * left and the active tab's panel on the right. We keep the active
 * tab in the URL search param (`?tab=`) so the user can deep-link to
 * a panel and the navbar's "My Profile" link always opens the most
 * useful default (Overview).
 */
export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, update: updateSession } = useSession();

  const tabFromUrl = searchParams.get("tab");
  const activeTab = isProfileTabId(tabFromUrl) ? tabFromUrl : "overview";

  const [state, setState] = useState<LoadState>({ status: "loading" });

  const handleTabChange = useCallback(
    (tabId: ProfileTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.replace(`/profile?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Hydrate the overview payload (user + aggregate stats) once the
  // session has resolved. Anonymous visitors are bounced into the
  // sign-in page with a callback that brings them right back.
  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated") return;

    let ignore = false;

    void (async () => {
      await Promise.resolve();
      if (ignore) return;
      setState({ status: "loading" });

      try {
        const overview = await fetchProfileOverview();
        if (ignore) return;
        setState({ status: "ready", overview });
      } catch (error) {
        if (ignore) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load your profile. Please try again.";
        setState({ status: "error", message });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authStatus]);

  /**
   * Apply a freshly returned user record to local state. Called from
   * the Settings tab after a successful PATCH so we don't have to
   * refetch the whole overview.
   */
  const handleUserPatched = useCallback(
    (nextUser: ProfileUser) => {
      setState((current) => {
        if (current.status !== "ready") return current;
        return {
          status: "ready",
          overview: {
            ...current.overview,
            user: nextUser,
          },
        };
      });

      // Push the new display fields into the NextAuth session so the
      // navbar avatar/name updates without a sign-out / sign-in.
      void updateSession({
        name: nextUser.name,
        image: nextUser.image,
      });
    },
    [updateSession],
  );

  if (
    authStatus === "loading" ||
    (authStatus === "authenticated" && state.status === "loading")
  ) {
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700 shadow-sm sm:rounded-3xl sm:p-10">
            Loading your profile...
          </div>
        </div>
      </main>
    );
  }

  if (authStatus !== "authenticated" || state.status === "error") {
    const isUnauth = authStatus !== "authenticated";
    const message = isUnauth
      ? "Sign in to view your profile."
      : state.status === "error"
        ? state.message
        : "Failed to load your profile. Please try again.";
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-2xl px-3 py-8 sm:px-6 sm:py-16">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
              Profile unavailable
            </h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              {isUnauth ? (
                <Link
                  href="/login?callbackUrl=/profile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (state.status !== "ready") {
    return (
      <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
        <div className="mx-auto w-full max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
          <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700 shadow-sm sm:rounded-3xl sm:p-10">
            Loading your profile...
          </div>
        </div>
      </main>
    );
  }

  const { user, stats } = state.overview;

  return (
    <main className="min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:py-10">
        <ProfileHeader user={user} stats={stats} />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <ProfileSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            stats={stats}
          />

          <section className="@container min-w-0 overflow-x-auto">
            {activeTab === "overview" && (
              <OverviewTab
                user={user}
                stats={stats}
                onJumpToTab={handleTabChange}
              />
            )}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "wishlist" && <WishlistTab />}
            {activeTab === "cart" && <CartTab />}
            {activeTab === "settings" && (
              <SettingsTab user={user} onUpdated={handleUserPatched} />
            )}
            {activeTab === "security" && <SecurityTab user={user} />}
          </section>
        </div>
      </div>
    </main>
  );
}
