import type { z } from "zod";

import { adminRoute } from "@/lib/api/handlers";
import { buildReportCached } from "@/lib/services/report.service";
import { reportQuerySchema } from "@/lib/validations/report.validation";

type ReportQuery = z.infer<typeof reportQuerySchema>;

/**
 * GET /api/admin/reports
 *
 * Admin only. Returns a fully aggregated payload for the requested
 * report type and date window. The client renders the preview and
 * generates the PDF entirely from this response.
 *
 * Served from a 60 s `unstable_cache` (tag: `admin-reports`).
 */
export const GET = adminRoute({
  scope: "admin.reports.GET",
  querySchema: reportQuerySchema,
  handler: async ({ query }) => {
    const data = await buildReportCached(query as ReportQuery);
    return { data };
  },
});
