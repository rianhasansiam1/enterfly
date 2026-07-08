import type { z } from "zod";

import { adminRoute } from "@/lib/api/handlers";
import {
  listProducts,
  serializeAdminProduct,
} from "@/lib/services/product.service";
import { productQuerySchema } from "@/lib/validations/product.validation";

type AdminProductQuery = z.infer<typeof productQuerySchema>;

/**
 * GET /api/admin/products
 *
 * Admin only. Returns the full admin product listing, including
 * buyingPrice, through the admin namespace only.
 */
export const GET = adminRoute({
  scope: "admin.products.GET",
  querySchema: productQuerySchema,
  handler: async ({ query }) => {
    const parsed = query as AdminProductQuery;
    const { items, meta } = await listProducts(parsed);

    return {
      data: items.map(serializeAdminProduct),
      meta: {
        ...meta,
        pageSize: parsed.pageSize,
      },
    };
  },
});
