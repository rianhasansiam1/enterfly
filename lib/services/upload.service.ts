import "server-only";

import { ServiceError } from "@/lib/services/service-error";

/**
 * ImgBB upload service.
 *
 * The API key lives in `IMGBB_API_KEY` (server-only env). We never ship
 * it to the browser — clients POST their file to `/api/upload` and this
 * service forwards it to ImgBB, returning only the hosted URL.
 *
 * See https://api.imgbb.com/ for the upload contract.
 */

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";

/** 32 MB is ImgBB's documented hard limit for the free tier. */
export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
] as const;

export type UploadResult = {
  url: string;
  displayUrl: string;
  thumbUrl: string;
  deleteUrl: string;
  width: number;
  height: number;
  size: number;
};

type ImgBbResponse = {
  success?: boolean;
  status?: number;
  data?: {
    url?: string;
    display_url?: string;
    delete_url?: string;
    width?: string | number;
    height?: string | number;
    size?: string | number;
    thumb?: { url?: string };
    medium?: { url?: string };
  };
  error?: { message?: string };
};

function toNumber(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Upload a single image File to ImgBB and return the hosted URLs.
 *
 * @param file       The image provided by the client (multipart form field).
 * @param expiration Optional seconds-to-live. Omit for permanent storage.
 */
export async function uploadImageToImgBB(
  file: File,
  expiration?: number,
): Promise<UploadResult> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new ServiceError(500, "Image hosting is not configured.");
  }

  if (file.size === 0) {
    throw new ServiceError(400, "The uploaded file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ServiceError(413, "Image exceeds the 32MB upload limit.");
  }
  if (!ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw new ServiceError(415, "Only image files can be uploaded.");
  }

  // ImgBB accepts the raw binary as a `image` form field (base64 or file).
  // We forward the bytes as base64 which is the most portable across
  // server runtimes.
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const params = new URLSearchParams({ key: apiKey });
  if (typeof expiration === "number" && expiration > 0) {
    params.set("expiration", String(expiration));
  }

  const body = new URLSearchParams({ image: base64 });

  let response: Response;
  try {
    response = await fetch(`${IMGBB_ENDPOINT}?${params.toString()}`, {
      method: "POST",
      body,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[upload.service] network error", error);
    throw new ServiceError(502, "Could not reach the image host. Try again.");
  }

  let payload: ImgBbResponse;
  try {
    payload = (await response.json()) as ImgBbResponse;
  } catch {
    throw new ServiceError(502, "Image host returned an invalid response.");
  }

  if (!response.ok || !payload.success || !payload.data?.url) {
    const message = payload.error?.message ?? "Image upload failed.";
    throw new ServiceError(response.status === 200 ? 502 : response.status, message);
  }

  const data = payload.data;

  return {
    url: data.url!,
    displayUrl: data.display_url ?? data.url!,
    thumbUrl: data.thumb?.url ?? data.display_url ?? data.url!,
    deleteUrl: data.delete_url ?? "",
    width: toNumber(data.width),
    height: toNumber(data.height),
    size: toNumber(data.size),
  };
}
