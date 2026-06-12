import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { isAdminRequest, requireAdmin } from "@/lib/api/guards";
import { jsonError, created, ok } from "@/lib/api/response";
import {
  createProduct,
  listProducts,
  serializeProduct,
} from "@/lib/services/product.service";
import {createProductSchema, productQuerySchema,} from "@/lib/validations/product.validation";

/**
 * GET /api/products
 *
 * Public listing with pagination, search, filtering, and sorting.
 * All knobs come from the query string; see `productQuerySchema`.
 */




export async function GET(request: NextRequest) {

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = productQuerySchema.safeParse(params);

  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listProducts(parsed.data);
    // Reveal admin-only fields (buyingPrice) only to signed-in admins.
    const includeBuyingPrice = await isAdminRequest();
    return ok(
      items.map((item) => serializeProduct(item, { includeBuyingPrice })),
      meta,
    );
  } catch (error) {
    console.error("[products.GET] failed", error);
    return jsonError(500, "Failed to fetch products.");
  }
}













/**
 * POST /api/products
 *
 * Admin-only. Creates a product and returns it with its category.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, "Content-Type must be application/json.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON payload.");
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const product = await createProduct(parsed.data);
    // No dedicated "products" cache exists; the catalog read is uncached.
    // Bust the cached surfaces that embed product data.
    revalidateTag("home-categories", "max");
    revalidateTag("categories", "max");
    return created(serializeProduct(product, { includeBuyingPrice: true }));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      if (target.includes("sku")) {
        return jsonError(409, "A variant SKU must be unique.", {
          fieldErrors: { variants: ["Duplicate SKU."] },
        });
      }
      return jsonError(409, "Each size + color combination must be unique.", {
        fieldErrors: { variants: ["Duplicate size + color combination."] },
      });
    }
    console.error("[products.POST] failed", error);
    return jsonError(500, "Failed to create product.");
  }
}
