import "server-only";

import { revalidateTag } from "next/cache";

export const CACHE_PROFILE = "max" as const;

export function revalidateCacheTags(tags: readonly string[] | undefined) {
  if (!tags?.length) return;
  for (const tag of tags) revalidateTag(tag, CACHE_PROFILE);
}
