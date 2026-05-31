import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { created, jsonError, ok } from "@/lib/api/response";
import {
  createTestimonial,
  listTestimonialsForAdmin,
} from "@/lib/services/testimonial.service";
import { handleServiceError } from "@/lib/services/service-error";
import {
  adminTestimonialQuerySchema,
  createTestimonialSchema,
} from "@/lib/validations/testimonial.validation";

/**
 * GET /api/admin/testimonials
 *
 * Admin only. Paginated list, optional status filter, ordered by
 * position then newest.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminTestimonialQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listTestimonialsForAdmin(parsed.data);
    return ok(items, meta);
  } catch (error) {
    return handleServiceError("admin.testimonials.GET", error);
  }
}

/**
 * POST /api/admin/testimonials
 *
 * Admin only. Add a testimonial to the About page section.
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

  const parsed = createTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const testimonial = await createTestimonial(parsed.data);
    revalidateTag("testimonials", "max");
    return created(testimonial);
  } catch (error) {
    return handleServiceError("admin.testimonials.POST", error);
  }
}
