export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

export function readApiError(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  if (!record) return fallback;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return fallback;
}

export async function readApiData<T>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error(fallbackError);
  }

  const envelope = payload as ApiEnvelope<T>;
  if (!response.ok || !envelope?.success) {
    throw new Error(readApiError(payload, fallbackError));
  }

  return envelope.data;
}
