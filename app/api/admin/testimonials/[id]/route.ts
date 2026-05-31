import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  deleteTestimonial,
  updateTestimonial,
} from "@/lib/services/testimonial.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updateTestimonialSchema } from "@/lib/validations/testimonial.validation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/testimonials/[id]
 *
 * Admin only. Partial update of a testimonial.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

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

  const parsed = updateTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const testimonial = await updateTestimonial(id, parsed.data);
    revalidateTag("testimonials", "max");
    return ok(testimonial);
  } catch (error) {
    return handleServiceError("admin.testimonials/[id].PATCH", error);
  }
}

/**
 * DELETE /api/admin/testimonials/[id]
 *
 * Admin only. Hard-delete a testimonial.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const result = await deleteTestimonial(id);
    revalidateTag("testimonials", "max");
    return ok(result);
  } catch (error) {
    return handleServiceError("admin.testimonials/[id].DELETE", error);
  }
}
