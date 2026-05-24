import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { FIELD_LIMITS } from "@/lib/auth/policy";
import { verifyPassword } from "@/lib/auth/passwords";
import { rateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/schemas";
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
});
