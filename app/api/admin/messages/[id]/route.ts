import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/api/guards";
import { jsonError, ok } from "@/lib/api/response";
import {
  deleteMessage,
  updateMessageStatus,
} from "@/lib/services/contact.service";
import { handleServiceError } from "@/lib/services/service-error";
import { updateMessageStatusSchema } from "@/lib/validations/contact.validation";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/messages/[id]
 *
 * Admin only. Flip a message between NEW / READ / ARCHIVED.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

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

  const parsed = updateMessageStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Please review the highlighted fields and try again.", {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const message = await updateMessageStatus(id, parsed.data);
    revalidateTag("admin-messages", "max");
    return ok(message);
  } catch (error) {
    return handleServiceError("admin.messages/[id].PATCH", error);
  }
}

/**
 * DELETE /api/admin/messages/[id]
 *
 * Admin only. Hard-delete a message.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    await deleteMessage(id);
    revalidateTag("admin-messages", "max");
    return ok({ id });
  } catch (error) {
    return handleServiceError("admin.messages/[id].DELETE", error);
  }
}
