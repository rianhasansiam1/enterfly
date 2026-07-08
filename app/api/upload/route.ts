import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api/guards";
import { ok, jsonError, tooManyRequests } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/auth/rate-limit";
import {
  handleServiceError,
} from "@/lib/services/service-error";
import {
  MAX_UPLOAD_BYTES,
  uploadImageToImgBB,
} from "@/lib/services/upload.service";

/**
 * POST /api/upload
 *
 * Accepts a `multipart/form-data` body with a single `image` file field
 * and forwards it to ImgBB. Returns the hosted URL inside the standard
 * `{ success, data }` envelope.
 *
 * Auth-gated to logged-in users so anonymous visitors can't burn our
 * ImgBB quota, plus a per-IP rate limit as a second line of defence.
 */
export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const ip = getClientIp(request);
  const limit = await rateLimit(`rate:upload:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return tooManyRequests(limit.resetMs);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonError(415, "Content-Type must be multipart/form-data.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "Invalid form data payload.");
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return jsonError(400, "An image file is required.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, "Image exceeds the 32MB upload limit.");
  }

  try {
    const result = await uploadImageToImgBB(file);
    return ok(result);
  } catch (error) {
    return handleServiceError("upload.POST", error);
  }
}
