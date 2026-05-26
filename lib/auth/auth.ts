import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth/auth.config";
import { FIELD_LIMITS } from "@/lib/auth/policy";
import { verifyPassword } from "@/lib/auth/passwords";
import { rateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth.validation";
import { prisma } from "@/lib/prisma";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
  message = "Invalid email or password.";
}

class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
  message = "Too many attempts. Please try again later.";
}

/**
 * Login rate-limit policy.
 *
 * We key by IP+email so two users behind the same NAT don't lock each
 * other out, but a single attacker can't credential-stuff an account
 * either. 5 attempts per 5 minutes is generous for humans, painful for
 * bots.
 */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Always show the account picker so users can switch accounts mid-session.
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw, request) => {
        // Reject oversized passwords before bcrypt sees them. Anything
        // over 72 bytes is already non-policy and would just waste CPU.
        const rawPassword = (raw as { password?: unknown })?.password;
        if (
          typeof rawPassword === "string" &&
          rawPassword.length > FIELD_LIMITS.PASSWORD_MAX
        ) {
          throw new InvalidCredentialsError();
        }

        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentialsError();

        const { email, password } = parsed.data;

        // Best-effort IP from proxy headers; falls back to "unknown".
        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers.get("x-real-ip") ??
          "unknown";

        const attempt = rateLimit(
          `login:${ip}:${email}`,
          LOGIN_MAX_ATTEMPTS,
          LOGIN_WINDOW_MS,
        );
        if (!attempt.allowed) throw new TooManyAttemptsError();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          },
        });

        // Always run bcrypt — even when the user doesn't exist — so the
        // response time of "no such user" matches "wrong password".
        const passwordMatches = await verifyPassword(
          password,
          user?.password ?? null,
        );

        if (!user || !passwordMatches) throw new InvalidCredentialsError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Persist Google sign-ins to our User table on first login, then refresh
     * `user.id`/`user.role` from the DB so downstream callbacks (jwt/session)
     * see the values our app actually uses.
     *
     * Returning `false` aborts the sign-in (NextAuth then renders its
     * AccessDenied page). We log every rejection so the cause is visible
     * in the dev server console.
     */
    signIn: async ({ user, account, profile }) => {
      if (account?.provider !== "google") return true;

      // Prefer the email Google sent us in the profile, fall back to the
      // one Auth.js already extracted onto `user`.
      const email =
        (profile as { email?: string } | undefined)?.email ?? user.email ?? null;
      const emailVerified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;

      if (!email) {
        console.error("[auth/google] sign-in rejected: no email on profile");
        return false;
      }
      // Only reject when Google explicitly says the email isn't verified.
      // `undefined` (older flows) is treated as OK.
      if (emailVerified === false) {
        console.error("[auth/google] sign-in rejected: email not verified", {
          email,
        });
        return false;
      }

      try {
        // Upsert keeps the email column as the join key. We never overwrite a
        // password set during Credentials signup — that field stays untouched.
        const dbUser = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: user.name ?? email.split("@")[0],
            image: user.image ?? null,
          },
          update: {
            // Refresh display fields, but only when Google actually has them.
            ...(user.name ? { name: user.name } : {}),
            ...(user.image ? { image: user.image } : {}),
          },
          select: { id: true, role: true },
        });

        // Mutate the `user` object so the jwt() callback (which runs next,
        // with `user` populated only on this initial sign-in) picks up our IDs.
        user.id = dbUser.id;
        user.role = dbUser.role;

        return true;
      } catch (error) {
        console.error("[auth/google] upsert failed", error);
        return false;
      }
    },
  },
});
