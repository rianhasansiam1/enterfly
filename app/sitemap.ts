import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Dynamic sitemap for EnterFly.
 *
 * Lists the static public pages plus every ACTIVE category and ACTIVE
 * product. Inactive/soft-deleted rows (status === "INACTIVE") and all
 * private/transactional routes are excluded. Database reads are wrapped
 * so a transient DB error degrades to the static entries instead of
 * failing the whole build/request.
 *
 * Revalidate hourly so newly published products/categories surface
 * without a redeploy.
 */
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let categoryEntries: MetadataRoute.Sitemap = [];
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const categories = await prisma.category.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    categoryEntries = categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    // Never let a DB hiccup break the sitemap — log and fall back.
    console.error("sitemap: failed to load categories", error);
  }

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    productEntries = products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("sitemap: failed to load products", error);
  }

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
