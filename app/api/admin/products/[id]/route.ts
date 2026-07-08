import { adminRoute } from "@/lib/api/handlers";
import { jsonError } from "@/lib/api/response";
import {
  getProductById,
  serializeAdminProduct,
} from "@/lib/services/product.service";

type Params = { id: string };

/**
 * GET /api/admin/products/[id]
 *
 * Admin only. Returns a single full product row, including buyingPrice,
 * through the admin namespace only.
 */
export const GET = adminRoute<unknown, Params>({
  scope: "admin.products/[id].GET",
  handler: async ({ params }) => {
    const product = await getProductById(params.id);
    if (!product) return { raw: jsonError(404, "Product not found.") };
    return { data: serializeAdminProduct(product) };
  },
});
