const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const AUTH_ORIGIN_KEYS = ["AUTH_URL", "NEXTAUTH_URL"] as const;

type Env = Record<string, string | undefined>;

export type OriginValidationResult = {
  ok: boolean;
  errors: string[];
  authOrigin: string | null;
  siteOrigin: string | null;
};

export function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin === "null") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;

  try {
    const hostname = new URL(origin).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return (
      LOCAL_HOSTNAMES.has(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.startsWith("127.")
    );
  } catch {
    return false;
  }
}

function isProductionOriginStrict(env: Env = process.env): boolean {
  return env.NODE_ENV === "production";
}

function getConfiguredAuthOrigin(env: Env = process.env): string | null {
  return normalizeOrigin(env.AUTH_URL) ?? normalizeOrigin(env.NEXTAUTH_URL);
}

function getConfiguredSiteOrigin(env: Env = process.env): string | null {
  return normalizeOrigin(env.NEXT_PUBLIC_SITE_URL);
}

function getDefaultLocalOrigin(env: Env = process.env): string {
  const port = env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

export function getCanonicalSiteOrigin(env: Env = process.env): string {
  return getConfiguredSiteOrigin(env) ?? getDefaultLocalOrigin(env);
}

function getRequestOrigin(
  headers: Pick<Headers, "get">,
  fallbackUrl?: string | URL,
): string | null {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  if (host) {
    const forwardedProto = headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const fallbackProtocol = fallbackUrl
      ? new URL(fallbackUrl).protocol.replace(":", "")
      : null;
    const protocol = forwardedProto || fallbackProtocol || "https";
    return normalizeOrigin(`${protocol}://${host}`);
  }

  return fallbackUrl ? normalizeOrigin(String(fallbackUrl)) : null;
}

export function validateOriginConfig(env: Env = process.env): OriginValidationResult {
  const authOrigin = getConfiguredAuthOrigin(env);
  const siteOrigin = getConfiguredSiteOrigin(env);
  const errors: string[] = [];

  if (!isProductionOriginStrict(env)) {
    return { ok: true, errors, authOrigin, siteOrigin };
  }

  const authUrlOrigin = normalizeOrigin(env.AUTH_URL);
  const nextAuthUrlOrigin = normalizeOrigin(env.NEXTAUTH_URL);

  if (!authOrigin) {
    errors.push("Set AUTH_URL or NEXTAUTH_URL to the deployed origin.");
  }

  if (!siteOrigin) {
    errors.push("Set NEXT_PUBLIC_SITE_URL to the deployed origin.");
  }

  if (env.AUTH_URL && !authUrlOrigin) {
    errors.push("AUTH_URL must be an absolute URL.");
  }

  if (env.NEXTAUTH_URL && !nextAuthUrlOrigin) {
    errors.push("NEXTAUTH_URL must be an absolute URL.");
  }

  if (env.NEXT_PUBLIC_SITE_URL && !siteOrigin) {
    errors.push("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }

  if (authUrlOrigin && nextAuthUrlOrigin && authUrlOrigin !== nextAuthUrlOrigin) {
    errors.push("AUTH_URL and NEXTAUTH_URL must resolve to the same origin.");
  }

  if (authOrigin && siteOrigin && authOrigin !== siteOrigin) {
    errors.push("Auth origin and NEXT_PUBLIC_SITE_URL must resolve to the same origin.");
  }

  if (authOrigin && isLocalOrigin(authOrigin)) {
    errors.push("Production auth origin must not be localhost or loopback.");
  }

  if (siteOrigin && isLocalOrigin(siteOrigin)) {
    errors.push("Production site origin must not be localhost or loopback.");
  }

  return {
    ok: errors.length === 0,
    errors,
    authOrigin,
    siteOrigin,
  };
}

export function getAllowedOrigins(
  headers: Pick<Headers, "get">,
  env: Env = process.env,
  fallbackUrl?: string | URL,
): string[] {
  const requestOrigin = getRequestOrigin(headers, fallbackUrl);

  if (isProductionOriginStrict(env)) {
    const validation = validateOriginConfig(env);
    if (!validation.ok) return [];
    return [validation.authOrigin, validation.siteOrigin].filter(
      (origin): origin is string => Boolean(origin),
    );
  }

  return [
    requestOrigin,
    getConfiguredAuthOrigin(env),
    getConfiguredSiteOrigin(env),
  ].filter((origin): origin is string => Boolean(origin));
}

export function configureLocalAuthOriginEnv(env: NodeJS.ProcessEnv = process.env) {
  if (isProductionOriginStrict(env)) return;

  for (const key of AUTH_ORIGIN_KEYS) {
    if (!env[key]) continue;

    const origin = normalizeOrigin(env[key]);
    if (!origin || isLocalOrigin(origin)) {
      delete env[key];
    }
  }
}
