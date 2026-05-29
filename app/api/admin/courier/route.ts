import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { checkCourierInfo } from "@/lib/services/courier.service";
import { handleServiceError } from "@/lib/services/service-error";
import { courierCheckSchema } from "@/lib/validations/courier.validation";

/**
 * POST /api/admin/courier
 *
 * Admin only. Looks up a customer's delivery / fraud history across the
 * local couriers via the third-party fraudbd.com API. The upstream API
 * key stays server-side; the client only ever receives the normalised
 * report.
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

  const parsed = courierCheckSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const report = await checkCourierInfo(parsed.data);
    return ok(report);
  } catch (error) {
    return handleServiceError("admin.courier.POST", error);
  }
}
