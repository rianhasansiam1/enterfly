import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/api/guards";
import { ok } from "@/lib/api/response";
import { deleteReview } from "@/lib/services/review.service";
import { handleServiceError } from "@/lib/services/service-error";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/reviews/[id]
 *
 * Admin only. Hard-delete a review.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const result = await deleteReview(id);
    revalidateTag("admin-reviews", "max");
    return ok(result);
  } catch (error) {
    return handleServiceError("admin.reviews/[id].DELETE", error);
  }
}
