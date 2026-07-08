import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Returns (or creates) the singleton PrismaClient.
 *
 * Construction is deferred until the first call so that importing this
 * module during Next.js build / static evaluation / tests never triggers
 * a connection attempt or crashes when DATABASE_URL is absent.
 *
 * In development the instance is cached on `globalThis` so hot-reloads
 * do not leak PrismaClient instances.
 */
function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Prisma cannot connect to the database.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Lazy proxy that behaves exactly like a PrismaClient but defers
 * construction until the first property access (e.g. `prisma.user.findMany()`).
 *
 * Every existing `import { prisma } from "@/lib/db/prisma"` continues to
 * work without any changes.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    // Bind methods so `this` is the real client, not the proxy
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in getPrisma();
  },
  ownKeys() {
    return Reflect.ownKeys(getPrisma());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getPrisma(), prop);
  },
});
