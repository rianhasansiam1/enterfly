import { requireAdmin } from "@/lib/api/guards";
import { ok } from "@/lib/api/response";
import { getDashboardOverview } from "@/lib/services/dashboard.service";
import { handleServiceError } from "@/lib/services/service-error";

/**
 * GET /api/admin/dashboard
 *
 * Admin only. Bundles every aggregate the dashboard page needs into
 * a single payload (headline stats, sales series, recent orders, top
 * products, activity feed) so the UI loads with one request and one
 * spinner.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const overview = await getDashboardOverview();
    return ok(overview);
  } catch (error) {
    return handleServiceError("admin.dashboard.GET", error);
  }
}
