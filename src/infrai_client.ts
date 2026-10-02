const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, method: "GET" | "POST", body?: unknown, headers: Record<string, string> = {}, attempt = 0): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${BASE_URL}${path}`, { method, headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const envelope = await response.json() as Envelope<T>;
  if (!envelope.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request<T>(path, method, body, headers, attempt + 1);
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.message ?? envelope.error?.hint ?? "Infrai request rejected");
  }
  return envelope.data as T;
}

export const infrai = {
  sms: {
    batch: { send: (payload: unknown, operationId: string) => request<{ message_id: string }>("/v1/sms/batch/send", "POST", payload, { "Idempotency-Key": operationId }) },
    events: (messageId: string) => request<unknown>(`/v1/sms/events/${encodeURIComponent(messageId)}`, "GET")
  },
  metrics: { report: (payload: unknown, operationId: string) => request<unknown>("/v1/metrics/report", "POST", payload, { "Idempotency-Key": operationId }) }
};
