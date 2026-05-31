import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError, ok } from "@/lib/api/response";
import {
  createAdminReview,
  listReviewsForAdmin,
} from "@/lib/services/review.service";
import { handleServiceError } from "@/lib/services/service-error";
import {
  adminReviewQuerySchema,
  createAdminReviewSchema,
} from "@/lib/validations/review.validation";

/**
 * GET /api/admin/reviews
 *
 * Admin only. Pagination, search across author/title/comment/product,
 * filter by rating and source, newest first.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminReviewQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listReviewsForAdmin(parsed.data);
    return ok(items, meta);
  } catch (error) {
    return handleServiceError("admin.reviews.GET", error);
  }
}

/**
 * POST /api/admin/reviews
 *
 * Admin only. Seed a review for a specific product (not tied to a user).
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

  const parsed = createAdminReviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const review = await createAdminReview(parsed.data);
    revalidateTag("admin-reviews", "max");
    return created(review);
  } catch (error) {
    return handleServiceError("admin.reviews.POST", error);
  }
}
