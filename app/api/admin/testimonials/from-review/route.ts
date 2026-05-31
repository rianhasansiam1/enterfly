import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError } from "@/lib/api/response";
import { createTestimonialFromReview } from "@/lib/services/testimonial.service";
import { handleServiceError } from "@/lib/services/service-error";
import { createTestimonialFromReviewSchema } from "@/lib/validations/testimonial.validation";

/**
 * POST /api/admin/testimonials/from-review
 *
 * Admin only. Promotes an existing customer product review into a
 * testimonial shown on the About page.
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

  const parsed = createTestimonialFromReviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const testimonial = await createTestimonialFromReview(parsed.data);
    revalidateTag("testimonials", "max");
    return created(testimonial);
  } catch (error) {
    return handleServiceError("admin.testimonials.from-review.POST", error);
  }
}
