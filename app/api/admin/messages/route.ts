import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import { listMessagesForAdminCached } from "@/lib/services/contact.service";
import { handleServiceError } from "@/lib/services/service-error";
import { adminMessageQuerySchema } from "@/lib/validations/contact.validation";

/**
 * GET /api/admin/messages
 *
 * Admin only. Pagination, search across name/email/phone/subject/message,
 * filter by status. Reads are served from the Next.js data cache and
 * busted on demand from the public POST route.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminMessageQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Invalid query parameters.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const { items, meta } = await listMessagesForAdminCached(parsed.data);
    return ok(items, meta);
  } catch (error) {
    return handleServiceError("admin.messages.GET", error);
  }
}
