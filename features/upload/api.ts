import { readApiData } from "@/features/http/api-envelope";

/**
 * Client helper for the `/api/upload` route.
 *
 * The browser only ever talks to our own endpoint — the ImgBB API key
 * stays on the server. Components send a `File` and get back the hosted
 * URL to store in their form state.
 */

export type UploadedImage = {
  url: string;
  displayUrl: string;
  thumbUrl: string;
  deleteUrl: string;
  width: number;
  height: number;
  size: number;
};

export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif";

/** Upload a single image file and resolve with its hosted URLs. */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const body = new FormData();
  body.append("image", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body,
    cache: "no-store",
  });

  return readApiData<UploadedImage>(response, "Image upload failed.");
}
