import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { previewCheckout } from "@/lib/services/checkout.service";
import { handleServiceError } from "@/lib/services/service-error";
import { checkoutPreviewSchema } from "@/lib/validations/checkout.validation";

/**
 * POST /api/checkout/preview
 *
 * Authenticated users only. Used by the checkout page to render
 * server-priced totals as the customer types a promo code or toggles
 * between cart / buy-now items. Read-only by design — nothing in the
 * DB is mutated. All money math (tax rate, shipping fee,
 * free-shipping threshold, promo discount) happens server-side.
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser();
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

  const parsed = checkoutPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const preview = await previewCheckout(guard.session.user.id, parsed.data);
    return ok(preview);
  } catch (error) {
    return handleServiceError("checkout.preview.POST", error);
  }
}
