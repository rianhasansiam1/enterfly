import { adminRoute } from "@/lib/api/handlers";
import { getDashboardOverviewCached } from "@/lib/services/dashboard.service";

/**
 * GET /api/admin/dashboard
 *
 * Admin only. Bundles every aggregate the dashboard page needs into
 * a single payload (headline stats, sales series, recent orders, top
 * products, activity feed) so the UI loads with one request and one
 * spinner.
 *
 * The payload is served from a 30 s `unstable_cache` (tag:
 * `admin-dashboard`) so back-to-back loads don't re-run 15+ queries.
 */
export const GET = adminRoute({
  scope: "admin.dashboard.GET",
  handler: async () => {
    const overview = await getDashboardOverviewCached();
    return { data: overview };
  },
});
