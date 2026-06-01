"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";

import type { AppDispatch, RootState } from "@/store";
import { setCartData, resetCartState } from "@/store/slices/cart.slice";
import {
  setWishlistItems,
  resetWishlistState,
} from "@/store/slices/wishlist.slice";
import { readLocalCart, writeLocalCart } from "@/features/cart/storage";
import { CART_LOCAL_STORAGE_KEY } from "@/features/cart/storage";
import { computeCartSummary } from "@/features/cart/summary";
import {
  canUseServerCart,
  fetchServerCartSnapshot,
  mergeGuestCartToServer,
} from "@/features/cart/api";
import {
  readLocalWishlist,
  writeLocalWishlist,
  WISHLIST_LOCAL_STORAGE_KEY,
} from "@/features/wishlist/storage";
import {
  canUseServerWishlist,
  fetchServerWishlist,
  mergeGuestWishlistToServer,
} from "@/features/wishlist/api";

/**
 * Invisible component that manages the lifecycle of cart & wishlist
 * Redux state across guest / authenticated sessions.
 *
 * Responsibilities:
 *   1. Hydrate Redux from localStorage on first mount so navbar badges
 *      render correct counts immediately (before any server call).
 *   2. When the session resolves to "authenticated", merge any guest
 *      localStorage data into the server via dedicated merge APIs,
 *      then replace Redux + localStorage with the server response.
 *   3. Detect session transitions:
 *      - login  (unauthenticated → authenticated): run merge flow
 *      - logout (authenticated → unauthenticated): reset Redux + clear localStorage
 *
 * Must sit inside both `<ReduxProvider>` and `<SessionProvider>`.
 * Renders nothing — pure side-effect.
 */
export default function StoreHydrator() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();
  const cartHydrated = useSelector((s: RootState) => s.cart.isHydrated);
  const wishlistHydrated = useSelector((s: RootState) => s.wishlist.isHydrated);

  // Guards against React Strict Mode double-mount
  const didLocalHydrateRef = useRef(false);
  // Track previous session status for transition detection
  const prevStatusRef = useRef<string>(status);
  // Prevent concurrent server-sync operations
  const serverSyncInProgressRef = useRef(false);

  /* ═══════════════════════════════════════════════════════════════════
   * Phase 1: Immediate localStorage hydration
   *
   * Runs once on mount. Populates Redux with whatever is in
   * localStorage so the navbar badges are visible instantly.
   * ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (didLocalHydrateRef.current) return;
    didLocalHydrateRef.current = true;

    if (!cartHydrated) {
      const localCart = readLocalCart();
      dispatch(
        setCartData({
          items: localCart,
          summary: computeCartSummary(localCart),
        }),
      );
    }

    if (!wishlistHydrated) {
      const localWishlist = readLocalWishlist();
      dispatch(setWishlistItems(localWishlist));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
   * Phase 2 & 3: Session-aware sync + transition detection
   *
   * Runs whenever the NextAuth session status changes. Handles:
   *   • First "authenticated" resolution → merge guest data & fetch
   *   • unauthenticated → authenticated (login)  → merge
   *   • authenticated → unauthenticated (logout)  → reset
   * ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Still loading — nothing to do yet.
    if (status === "loading") return;

    /* ── Logout: authenticated → unauthenticated ──────────────────── */
    if (prevStatus === "authenticated" && status === "unauthenticated") {
      // Reset Redux to empty state
      dispatch(resetCartState());
      dispatch(resetWishlistState());

      // Clear localStorage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CART_LOCAL_STORAGE_KEY);
        window.localStorage.removeItem(WISHLIST_LOCAL_STORAGE_KEY);
      }
      return;
    }

    /* ── Authenticated: fetch/merge from server ───────────────────── */
    if (status === "authenticated") {
      if (serverSyncInProgressRef.current) return;
      serverSyncInProgressRef.current = true;

      const role = session?.user?.role;
      const isLogin = prevStatus === "unauthenticated";

      // Read guest data BEFORE async operations
      const guestCartItems = readLocalCart();
      const guestWishlistItems = readLocalWishlist();
      const hasGuestCart = guestCartItems.length > 0;
      const hasGuestWishlist = guestWishlistItems.length > 0;

      // Decide whether to merge or just fetch
      const shouldMergeCart = isLogin && hasGuestCart;
      const shouldMergeWishlist = isLogin && hasGuestWishlist;

      // Cart: merge or fetch
      if (canUseServerCart(role, status)) {
        const cartPromise = shouldMergeCart
          ? mergeGuestCartToServer(guestCartItems)
          : fetchServerCartSnapshot();

        cartPromise
          .then((snapshot) => {
            writeLocalCart(snapshot.items);
            dispatch(setCartData(snapshot));
          })
          .catch(() => {
            // Fail silently — localStorage data is already in Redux
          });
      }

      // Wishlist: merge or fetch
      if (canUseServerWishlist(role, status)) {
        const wishlistPromise = shouldMergeWishlist
          ? mergeGuestWishlistToServer(
              guestWishlistItems.map((item) => item.id),
            )
          : fetchServerWishlist();

        wishlistPromise
          .then((items) => {
            writeLocalWishlist(items);
            dispatch(setWishlistItems(items));
          })
          .catch(() => {
            // Fail silently — localStorage data is already in Redux
          });
      }
    }

    /* ── Unauthenticated (guest): localStorage is already loaded ── */
    // Phase 1 already populated Redux from localStorage.
    // Nothing more to do for guests.
  }, [status, session, dispatch]);

  return null;
}
