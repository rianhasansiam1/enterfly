"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Trash2, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";

import {
  isServerWishlistRole,
  removeWishlistItemOnServer,
  syncWishlistToServer,
} from "@/features/wishlist/api";
import {
  readLocalWishlist,
  writeLocalWishlist,
} from "@/features/wishlist/storage";
import {
  setWishlistError,
  setWishlistItems,
  setWishlistLoading,
  setWishlistMode,
} from "@/store/slices/wishlist.slice";
import type { AppDispatch, RootState } from "@/store";
import { toast } from "@/lib/feedback";
import { useAnimatedRemoval } from "@/hooks/useAnimatedRemoval";
import {
  LIST_ITEM_TRANSITION,
  LIST_ITEM_VARIANTS,
} from "@/lib/motion/list-removal";

import { FALLBACK_PRODUCT_IMAGE } from "./constants";

const PROFILE_PREVIEW_LIMIT = 6;

/**
 * Wishlist preview tab on the profile page.
 *
 * Mirrors the hydration logic from the standalone /wishlist page so
 * server-stored items still appear when the user lands here first.
 * The full management UX (filters, bulk actions) lives on /wishlist;
 * this tab is the at-a-glance view with one-tap "remove" and a deep
 * link to the full page.
 */
export default function WishlistTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: session, status } = useSession();

  const items = useSelector((state: RootState) => state.wishlist.items);
  const isLoading = useSelector((state: RootState) => state.wishlist.isLoading);
  const error = useSelector((state: RootState) => state.wishlist.error);
  const itemsRef = useRef(items);

  const canUseServer =
    status === "authenticated" && isServerWishlistRole(session?.user?.role);
  const { visibleItems, queueRemoval } = useAnimatedRemoval({
    items,
    getId: (item) => item.id,
  });

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (status === "loading") return;

    let ignore = false;

    const hydrate = async () => {
      const localItems = readLocalWishlist();
      dispatch(setWishlistError(null));
      dispatch(setWishlistLoading(true));

      if (!canUseServer) {
        dispatch(setWishlistMode("local"));
        dispatch(setWishlistItems(localItems));
        dispatch(setWishlistLoading(false));
        return;
      }

      dispatch(setWishlistMode("server"));

      try {
        const serverItems = await syncWishlistToServer(
          localItems.map((item) => item.id),
        );
        if (ignore) return;
        dispatch(setWishlistItems(serverItems));
        writeLocalWishlist(serverItems);
      } catch (err) {
        if (ignore) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load wishlist from server.";
        dispatch(setWishlistError(message));
        dispatch(setWishlistMode("local"));
        dispatch(setWishlistItems(localItems));
      } finally {
        if (!ignore) {
          dispatch(setWishlistLoading(false));
        }
      }
    };

    void hydrate();

    return () => {
      ignore = true;
    };
  }, [canUseServer, dispatch, status]);

  const handleRemove = (id: string) => {
    queueRemoval(
      id,
      async () => {
        dispatch(setWishlistError(null));

        if (canUseServer) {
          try {
            await removeWishlistItemOnServer(id);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to remove from wishlist.";
            dispatch(setWishlistError(message));
            throw new Error(message);
          }
        }

        const next = itemsRef.current.filter((item) => item.id !== id);
        dispatch(setWishlistItems(next));
        writeLocalWishlist(next);
        toast.success("Removed from wishlist");
      },
      (error) => {
        const message =
          error instanceof Error ? error.message : "Failed to remove from wishlist.";
        toast.error(message);
      },
    );
  };

  const previewItems = visibleItems.slice(0, PROFILE_PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, items.length - PROFILE_PREVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-rose-700">
              <Heart className="h-4 w-4 fill-current" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                Wishlist
              </h2>
              <p className="text-xs text-gray-500">
                {items.length} saved {items.length === 1 ? "item" : "items"}.
                Manage filters and bulk actions on the full wishlist page.
              </p>
            </div>
          </div>
          <Link
            href="/wishlist"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 sm:w-auto"
          >
            Open wishlist
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isLoading && items.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-violet-700 shadow-sm sm:rounded-3xl sm:p-10">
          Loading wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center shadow-sm sm:rounded-3xl sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-700">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-extrabold text-gray-900">
            Your wishlist is empty
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Save products you love and they&apos;ll show up here.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ShoppingBag className="h-4 w-4" />
            Discover products
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {previewItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={LIST_ITEM_VARIANTS}
                  transition={LIST_ITEM_TRANSITION}
                  className="group flex gap-3 overflow-hidden rounded-2xl border border-violet-100 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                >
                <Link
                  href={`/products/${item.id}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50 min-[380px]:h-20 min-[380px]:w-20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || FALLBACK_PRODUCT_IMAGE}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                    {item.brand} • {item.category}
                  </p>
                  <Link
                    href={`/products/${item.id}`}
                    className="mt-0.5 line-clamp-2 text-sm font-bold text-gray-900 hover:text-violet-700"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {item.rating.toFixed(1)} ({item.reviewCount})
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="min-w-0 truncate text-xs font-extrabold text-violet-700 min-[380px]:text-sm">
                      BDT {item.price.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove from wishlist"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {hiddenCount > 0 && (
            <Link
              href="/wishlist"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-violet-300 bg-white px-4 py-3 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-50"
            >
              View {hiddenCount} more {hiddenCount === 1 ? "item" : "items"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
