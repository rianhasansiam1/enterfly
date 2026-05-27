import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { buildReport } from "@/lib/services/report.service";
import { handleServiceError } from "@/lib/services/service-error";
import { reportQuerySchema } from "@/lib/validations/report.validation";

/**
 * GET /api/admin/reports
 *
 * Admin only. Returns a fully aggregated payload for the requested
 * report type and date window. The client renders the preview and
 * generates the PDF entirely from this response.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = reportQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const data = await buildReport(parsed.data);
    return ok(data);
  } catch (error) {
    return handleServiceError("admin.reports.GET", error);
  }
}
