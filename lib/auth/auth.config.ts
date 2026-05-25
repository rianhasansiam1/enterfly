import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe portion of the NextAuth config. The middleware imports this
 * file and must NOT pull in Prisma or bcrypt (they don't run on the Edge
 * runtime). The full config in `auth.ts` extends this with the Credentials
 * provider's `authorize` callback, which is only used on Node routes.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Providers are added in auth.ts so the middleware bundle stays small.
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.id as string | undefined) ?? "";
        session.user.role = (token.role as string | undefined) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
