import { adminJsonRoute } from "@/lib/api/handlers";
import { createCategoryBanner } from "@/lib/services/banner.service";
import { createCategoryBannerSchema } from "@/lib/validations/banner.validation";

/**
 * POST /api/admin/banners/category
 *
 * Admin only. Attaches a new banner to an existing category. Busts
 * `admin-banners`, `category-banners`, and `home-categories` so the
 * home page strip refreshes too.
 */
export const POST = adminJsonRoute({
  schema: createCategoryBannerSchema,
  scope: "admin.banners.category.POST",
  revalidate: ["admin-banners", "category-banners", "home-categories"],
  handler: async ({ body }) => {
    const banner = await createCategoryBanner(body);
    return { status: 201, data: banner };
  },
});
