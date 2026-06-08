import { adminRoute } from "@/lib/api/handlers";
import { deleteReview } from "@/lib/services/review.service";

type Params = { id: string };

/**
 * DELETE /api/admin/reviews/[id]
 *
 * Admin only. Hard-delete a review.
 */
export const DELETE = adminRoute<unknown, Params>({
  scope: "admin.reviews/[id].DELETE",
  revalidate: ["admin-reviews"],
  handler: async ({ params }) => {
    const result = await deleteReview(params.id);
    return { data: result };
  },
});
