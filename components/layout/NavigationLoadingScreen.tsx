"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { LoadingScreen } from "@/components/ui/loading";

const SHOW_DELAY_MS = 140;
const MAX_VISIBLE_MS = 8000;
const URL_CHECK_MS = 80;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldHandleAnchor(anchor: HTMLAnchorElement) {
  if (anchor.dataset.routeLoader === "false") return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#")) return false;

  const nextUrl = new URL(rawHref, window.location.href);
  if (nextUrl.origin !== window.location.origin) return false;

  const currentUrl = new URL(window.location.href);
  return (
    nextUrl.pathname !== currentUrl.pathname ||
    nextUrl.search !== currentUrl.search
  );
}

export default function NavigationLoadingScreen() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlWatcherRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startUrlRef = useRef<string>("");

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (urlWatcherRef.current) {
      clearInterval(urlWatcherRef.current);
      urlWatcherRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setVisible(false);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    startUrlRef.current = window.location.href;

    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    maxTimerRef.current = setTimeout(() => {
      stop();
    }, MAX_VISIBLE_MS);

    urlWatcherRef.current = setInterval(() => {
      if (window.location.href !== startUrlRef.current) {
        stop();
      }
    }, URL_CHECK_MS);
  }, [clearTimers, stop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      stop();
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, stop]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !shouldHandleAnchor(anchor)) return;

      start();
    };

    const handlePopState = () => {
      start();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers, start]);

  if (!visible) return null;

  return <LoadingScreen fixed label="Opening page..." />;
}
