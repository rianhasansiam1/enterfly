import type { ContactMessageStatus } from "@/features/admin-messages/api";

export const STATUS_BADGE: Record<ContactMessageStatus, string> = {
  NEW: "bg-violet-50 text-violet-700 ring-violet-200",
  READ: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-gray-100 text-gray-600 ring-gray-200",
};
