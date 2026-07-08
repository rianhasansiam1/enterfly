import { readApiError } from "@/features/http/api-envelope";

export type ContactMessageStatus = "NEW" | "READ" | "ARCHIVED";

export type AdminMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  newCount?: number;
  readCount?: number;
  archivedCount?: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: ApiMeta;
};



export const STATUS_VALUES: readonly ContactMessageStatus[] = [
  "NEW",
  "READ",
  "ARCHIVED",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parseStatus(value: unknown): ContactMessageStatus {
  if (value === "READ" || value === "ARCHIVED" || value === "NEW") return value;
  return "NEW";
}

function parseRow(entry: unknown): AdminMessageRow {
  const item = (entry ?? {}) as Partial<AdminMessageRow>;
  return {
    id: asString(item.id),
    name: asString(item.name),
    email: asString(item.email),
    phone: asNullableString(item.phone),
    subject: asString(item.subject),
    message: asString(item.message),
    status: parseStatus(item.status),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt),
  };
}

export function parseMessagesPayload(payload: unknown): {
  items: AdminMessageRow[];
  meta: ApiMeta;
} {
  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success || !Array.isArray(envelope.data)) {
    throw new Error("Messages API returned an invalid response.");
  }

  return {
    items: envelope.data.map(parseRow),
    meta: envelope.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  };
}

export type AdminMessageQueryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContactMessageStatus;
};

/**
 * Fetch a single page of admin messages from the server.
 */
export async function fetchAdminMessagesPage(
  params: AdminMessageQueryParams = {},
): Promise<{ items: AdminMessageRow[]; meta: ApiMeta }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);

  const response = await fetch(`/api/admin/messages?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("Failed to parse messages response.");
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to load messages."));
  }

  return parseMessagesPayload(payload);
}

export async function patchMessageStatus(
  messageId: string,
  status: ContactMessageStatus,
): Promise<AdminMessageRow> {
  const response = await fetch(`/api/admin/messages/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(readApiError(payload, "Failed to update message."));
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (!envelope?.success) {
    throw new Error(readApiError(payload, "Failed to update message."));
  }

  return parseRow(envelope.data);
}

export async function deleteAdminMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/admin/messages/${messageId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      // ignore
    }
    throw new Error(readApiError(payload, "Failed to delete message."));
  }
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
