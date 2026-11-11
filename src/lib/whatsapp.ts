import { apiRequest } from "@/lib/api";

export type WhatsAppStatus = {
  configured: boolean;
  order_confirm_session_id: string | null;
  /** glassShop alias */
  orderConfirmSessionId?: string | null;
};

function normalizeWhatsAppStatus(raw: Record<string, unknown> | WhatsAppStatus): WhatsAppStatus {
  const sessionId =
    (typeof raw.order_confirm_session_id === "string" && raw.order_confirm_session_id) ||
    (typeof (raw as WhatsAppStatus).orderConfirmSessionId === "string" &&
      (raw as WhatsAppStatus).orderConfirmSessionId) ||
    null;
  return {
    configured: Boolean((raw as WhatsAppStatus).configured),
    order_confirm_session_id: sessionId,
    orderConfirmSessionId: sessionId,
  };
}

export type WhatsAppSession = {
  id: string;
  status?: string;
  qr?: string | null;
  qrCode?: string | null;
  phone?: string | null;
  [key: string]: unknown;
};

export type ResendConfirmResult = {
  ok: true;
  sessionId: string;
};

export function asWhatsAppSessions(payload: unknown): WhatsAppSession[] {
  if (Array.isArray(payload)) {
    return payload
      .map((row) => normalizeSession(row))
      .filter((s): s is WhatsAppSession => Boolean(s));
  }
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.sessions)) return asWhatsAppSessions(o.sessions);
    if (Array.isArray(o.data)) return asWhatsAppSessions(o.data);
  }
  return [];
}

function normalizeSession(row: unknown): WhatsAppSession | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = String(o.id || o.sessionId || o.session_id || "").trim();
  if (!id) return null;
  return {
    ...o,
    id,
    status: o.status != null ? String(o.status) : undefined,
    qr: typeof o.qr === "string" ? o.qr : null,
    qrCode: typeof o.qrCode === "string" ? o.qrCode : typeof o.qr_code === "string" ? o.qr_code : null,
    phone: o.phone != null ? String(o.phone) : null,
  };
}

export function whatsAppQrSrc(session: Pick<WhatsAppSession, "qr" | "qrCode"> | null | undefined) {
  if (!session) return "";
  const raw = session.qr || session.qrCode || "";
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
  return `data:image/png;base64,${raw}`;
}

export function isWhatsAppConnected(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return ["connected", "ready", "open", "authenticated", "online"].includes(s);
}

export function isWhatsAppWaitingQr(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return ["qr", "connecting", "pending", "scan", "pair", "pairing", ""].includes(s) || s.includes("qr");
}

export function sessionStatusLabel(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (isWhatsAppConnected(s)) return "متصلة";
  if (s.includes("qr") || s === "scan" || s === "pairing") return "بانتظار المسح";
  if (s === "connecting" || s === "pending") return "جاري الاتصال";
  if (s === "disconnected" || s === "close" || s === "closed") return "منقطعة";
  return status || "غير معروف";
}

export function resendConfirmErrorMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("whatsapp_not_configured")) return "بوابة واتساب غير مُعدّة في السيرفر";
  if (m.includes("no_session_assigned")) return "لم يتم تعيين جلسة تأكيد بعد";
  if (m.includes("no_phone")) return "الطلب بدون رقم هاتف";
  if (m.includes("send_failed")) return "فشل الإرسال عبر البوابة، حاول لاحقاً";
  if (m.includes("order_not_found")) return "الطلب غير موجود";
  return message || "تعذر إرسال رسالة التأكيد";
}

export async function fetchWhatsAppStatus(token: string) {
  const raw = await apiRequest<Record<string, unknown>>("/whatsapp/status", { token });
  return normalizeWhatsAppStatus(raw);
}

export async function fetchWhatsAppSessions(token: string) {
  const raw = await apiRequest<{
    sessions: unknown;
    order_confirm_session_id?: string | null;
    orderConfirmSessionId?: string | null;
  }>("/whatsapp/sessions", { token });
  const sessionId = raw.order_confirm_session_id ?? raw.orderConfirmSessionId ?? null;
  return {
    sessions: raw.sessions,
    order_confirm_session_id: sessionId,
    orderConfirmSessionId: sessionId,
  };
}

export function createWhatsAppSession(token: string, id: string) {
  return apiRequest<WhatsAppSession | Record<string, unknown>>("/whatsapp/sessions", {
    method: "POST",
    token,
    body: { id },
  });
}

export function fetchWhatsAppSession(token: string, id: string) {
  return apiRequest<WhatsAppSession | Record<string, unknown>>(
    `/whatsapp/sessions/${encodeURIComponent(id)}`,
    { token },
  );
}

export function reconnectWhatsAppSession(token: string, id: string) {
  return apiRequest(`/whatsapp/sessions/${encodeURIComponent(id)}/reconnect`, {
    method: "POST",
    token,
    body: {},
  });
}

export function deleteWhatsAppSession(token: string, id: string) {
  return apiRequest(`/whatsapp/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

export async function saveWhatsAppSettings(token: string, orderConfirmSessionId: string | null) {
  const raw = await apiRequest<Record<string, unknown>>("/whatsapp/settings", {
    method: "PUT",
    token,
    // send both glassShop + Arkan keys
    body: {
      orderConfirmSessionId,
      order_confirm_session_id: orderConfirmSessionId,
    },
  });
  return normalizeWhatsAppStatus(raw);
}

export function resendWhatsAppConfirm(token: string, orderId: number) {
  return apiRequest<ResendConfirmResult>(`/whatsapp/orders/${orderId}/resend-confirm`, {
    method: "POST",
    token,
    body: {},
  });
}
