import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/admin", "/profile", "/checkout"];
const ADMIN_PREFIX = "/admin";
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default auth((request) => {
  const { nextUrl } = request;
  const session = request.auth;
  const isLoggedIn = Boolean(session?.user);
  const role = session?.user?.role;

  // Already-signed-in users have no business on /login or /register.
  if (isLoggedIn && startsWithAny(nextUrl.pathname, AUTH_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (startsWithAny(nextUrl.pathname, PROTECTED_PREFIXES)) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set(
        "callbackUrl",
        `${nextUrl.pathname}${nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    // Admin section is ADMIN-only.
    if (
      startsWithAny(nextUrl.pathname, [ADMIN_PREFIX]) &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

/**
 * Skip Next internals, the auth API (it manages its own redirects),
 * static assets, and the favicon. Everything else flows through the
 * matcher so logged-in users can be bounced from /login as well.
 */
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map|txt|xml)$).*)",
  ],
};
