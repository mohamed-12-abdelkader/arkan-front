"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  asWhatsAppSessions,
  createWhatsAppSession,
  deleteWhatsAppSession,
  fetchWhatsAppSession,
  fetchWhatsAppSessions,
  fetchWhatsAppStatus,
  isWhatsAppConnected,
  isWhatsAppWaitingQr,
  reconnectWhatsAppSession,
  saveWhatsAppSettings,
  sessionStatusLabel,
  whatsAppQrSrc,
  type WhatsAppSession,
  type WhatsAppStatus,
} from "@/lib/whatsapp";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "whatsapp"
    | "refresh"
    | "plus"
    | "check"
    | "alert"
    | "qr"
    | "link"
    | "orders"
    | "spark"
    | "trash"
    | "plug";
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };

  const icons: Record<typeof name, ReactNode> = {
    whatsapp: (
      <svg {...props}>
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 9.3c.3-.5.5-.5.8-.5h.6c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.2.6l-.5.5c-.1.1-.1.3 0 .5.4.7 1.1 1.4 1.9 1.9.2.1.4.1.5 0l.5-.5c.2-.2.4-.3.6-.2l1.7.7c.3.1.4.3.4.5v.6c0 .3 0 .5-.5.8-.5.3-1.3.5-2.1.2-1.8-.6-3.4-2-4.3-3.7-.4-.8-.5-1.7-.2-2.5.1-.3.3-.5.5-.7z"
          fill="currentColor"
        />
      </svg>
    ),
    refresh: (
      <svg {...props}>
        <path
          d="M4 12a8 8 0 0 1 13.5-5.7M20 12a8 8 0 0 1-13.5 5.7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M17.5 3.5V6.8H14M6.5 20.5V17.2H10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    plus: (
      <svg {...props}>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
    check: (
      <svg {...props}>
        <path
          d="M5 12.5l4.2 4.2L19 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    alert: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v5M12 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    qr: (
      <svg {...props}>
        <path
          d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 2h2v2h-2v-2zm4-2h2v6h-6v-2h4v-4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    link: (
      <svg {...props}>
        <path
          d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    orders: (
      <svg {...props}>
        <path
          d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.3" fill="currentColor" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      </svg>
    ),
    spark: (
      <svg {...props}>
        <path
          d="M12 3l1.2 5.2L18 9.5l-4.8 1.3L12 16l-1.2-5.2L6 9.5l4.8-1.3L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    trash: (
      <svg {...props}>
        <path
          d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    plug: (
      <svg {...props}>
        <path
          d="M8 7v4a4 4 0 0 0 8 0V7M10 3v4M14 3v4M12 15v6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  return icons[name];
}

function normalizeSession(row: unknown): WhatsAppSession | null {
  const list = asWhatsAppSessions([row]);
  return list[0] || null;
}

export default function AdminWhatsAppPage() {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("settings.manage") || hasPermission("admin");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<WhatsAppSession | null>(null);
  const [newId, setNewId] = useState("arkan-orders");
  const [polling, setPolling] = useState(false);

  const assigned = status?.order_confirm_session_id || null;
  const configured = Boolean(status?.configured);
  const assignedSession = sessions.find((s) => s.id === assigned) || null;
  const assignedConnected = isWhatsAppConnected(assignedSession?.status || detail?.status);

  const readiness = useMemo(() => {
    const hasSession = sessions.length > 0;
    const hasAssigned = Boolean(assigned);
    const connected = Boolean(
      (assigned && isWhatsAppConnected(assignedSession?.status)) ||
        (selectedId === assigned && isWhatsAppConnected(detail?.status)),
    );
    return [
      { id: "env", label: "إعداد البوابة", done: configured },
      { id: "session", label: "إنشاء جلسة", done: hasSession },
      { id: "qr", label: "ربط واتساب (QR)", done: connected || (hasAssigned && assignedConnected) },
      { id: "assign", label: "تعيين جلسة التأكيد", done: hasAssigned },
    ];
  }, [configured, sessions.length, assigned, assignedSession?.status, selectedId, detail?.status, assignedConnected]);

  const readyCount = readiness.filter((s) => s.done).length;
  const systemReady = readyCount === readiness.length;

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const st = await fetchWhatsAppStatus(accessToken);
      setStatus(st);
      if (st.configured) {
        const data = await fetchWhatsAppSessions(accessToken);
        const list = asWhatsAppSessions(data.sessions);
        setSessions(list);
        setStatus({
          configured: true,
          order_confirm_session_id: data.order_confirm_session_id,
        });
        setSelectedId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          if (data.order_confirm_session_id && list.some((s) => s.id === data.order_confirm_session_id)) {
            return data.order_confirm_session_id;
          }
          return list[0]?.id || "";
        });
      } else {
        setSessions([]);
        setDetail(null);
        setSelectedId("");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("ليس لديك صلاحية إدارة واتساب");
      } else {
        setError(err instanceof Error ? err.message : "تعذر التحميل");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshDetail = useCallback(
    async (id: string, silent = false) => {
      if (!accessToken || !id) return;
      if (!silent) {
        setBusy(true);
        setError("");
      }
      try {
        const row = await fetchWhatsAppSession(accessToken, id);
        const normalized = normalizeSession(row) || { id, ...(row as Record<string, unknown>) };
        setDetail(normalized);
        setSelectedId(id);
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...normalized, id } : s)),
        );
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err.message : "تعذر جلب الجلسة");
      } finally {
        if (!silent) setBusy(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (!selectedId || !configured) return;
    void refreshDetail(selectedId, true);
  }, [selectedId, configured, refreshDetail]);

  useEffect(() => {
    if (!selectedId || !detail) {
      setPolling(false);
      return;
    }
    const shouldPoll = isWhatsAppWaitingQr(detail.status) && !isWhatsAppConnected(detail.status);
    setPolling(shouldPoll);
    if (!shouldPoll) return;
    const timer = window.setInterval(() => {
      void refreshDetail(selectedId, true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [selectedId, detail, refreshDetail]);

  const qrSrc = useMemo(() => whatsAppQrSrc(detail), [detail]);
  const connected = isWhatsAppConnected(detail?.status);

  async function onCreate() {
    if (!accessToken || !newId.trim() || !canManage) return;
    const id = newId.trim().replace(/\s+/g, "-").toLowerCase();
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      const created = await createWhatsAppSession(accessToken, id);
      const normalized = normalizeSession(created);
      setOkMsg("تم إنشاء الجلسة — امسح رمز QR من واتساب الجوال");
      await load();
      setSelectedId(id);
      if (normalized) setDetail(normalized);
      else await refreshDetail(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الإنشاء");
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(id: string | null) {
    if (!accessToken || !canManage) return;
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      const saved = await saveWhatsAppSettings(accessToken, id);
      setStatus((prev) => ({
        configured: prev?.configured ?? true,
        order_confirm_session_id: saved.order_confirm_session_id,
      }));
      setOkMsg(id ? `تم تعيين «${id}» كجلسة تأكيد الطلبات` : "تم إلغاء تعيين جلسة التأكيد");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function onReconnect(id: string) {
    if (!accessToken || !canManage) return;
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      await reconnectWhatsAppSession(accessToken, id);
      await refreshDetail(id);
      setOkMsg("تمت إعادة الاتصال — امسح QR الجديد إن ظهر");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إعادة الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!accessToken || !canManage) return;
    if (!window.confirm(`حذف الجلسة ${id}؟`)) return;
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      await deleteWhatsAppSession(accessToken, id);
      if (selectedId === id) {
        setDetail(null);
        setSelectedId("");
      }
      setOkMsg("تم حذف الجلسة");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader label="جاري تحميل واتساب" />;

  return (
    <div className="wa-admin">
      <header className="cat-admin__hero wa-admin__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon wa-admin__hero-icon" aria-hidden>
            <Icon name="whatsapp" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">WhatsApp Order Confirm</p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">واتساب الطلبات</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">
              اربط جلسة واتساب لإرسال ملخص الطلب للعميل ومتابعة رده (نعم للتأكيد / لا للإلغاء)
              تلقائياً عبر الـ Backend.
            </p>
          </div>
        </div>
        <div className="wa-admin__hero-actions">
          <Link href="/admin/orders?status=awaiting_confirmation" className="admin-btn">
            <Icon name="orders" size={16} />
            طلبات بانتظار واتساب
          </Link>
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            تحديث
          </button>
        </div>
      </header>

      {error ? (
        <p className="cat-alert cat-alert--error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="cat-alert cat-alert--success">
          <Icon name="check" size={16} />
          {okMsg}
        </p>
      ) : null}

      <section className="wa-admin__readiness" aria-label="جاهزية النظام">
        <div className="wa-admin__readiness-head">
          <div>
            <h3>جاهزية النظام</h3>
            <p>
              {systemReady
                ? "النظام جاهز لإرسال واستقبال تأكيدات الطلبات"
                : `${readyCount} من ${readiness.length} خطوات مكتملة`}
            </p>
          </div>
          <span className={`wa-admin__ready-badge ${systemReady ? "is-ready" : ""}`}>
            {systemReady ? "جاهز" : "قيد الإعداد"}
          </span>
        </div>
        <ol className="wa-admin__steps">
          {readiness.map((step, index) => (
            <li key={step.id} className={step.done ? "is-done" : ""}>
              <span className="wa-admin__step-index" aria-hidden>
                {step.done ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="wa-admin__kpis">
        <article className="wa-admin__kpi">
          <p>البوابة</p>
          <strong className={configured ? "is-ok" : "is-bad"}>{configured ? "مُعدّة" : "غير مُعدّة"}</strong>
        </article>
        <article className="wa-admin__kpi">
          <p>الجلسات</p>
          <strong>{sessions.length}</strong>
        </article>
        <article className="wa-admin__kpi wa-admin__kpi--wide">
          <p>جلسة تأكيد الطلبات</p>
          <strong className="font-mono text-base" dir="ltr">
            {assigned || "— غير معينة —"}
          </strong>
          {assigned ? (
            <button
              type="button"
              className="admin-btn admin-btn--sm mt-2"
              disabled={busy || !canManage}
              onClick={() => void onAssign(null)}
            >
              إلغاء التعيين
            </button>
          ) : null}
        </article>
      </div>

      {!configured ? (
        <section className="admin-panel wa-admin__setup-card">
          <div className="wa-admin__setup-icon" aria-hidden>
            <Icon name="plug" size={22} />
          </div>
          <div>
            <h3 className="font-bold text-ink">يلزم إعداد السيرفر أولاً</h3>
            <p className="mt-1 text-sm text-ink-muted">
              أضف المتغيرات التالية في `.env` للـ backend ثم أعد تشغيله:
            </p>
            <pre className="wa-admin__code" dir="ltr">
{`WHATSAPP_GATEWAY_URL=...
WHATSAPP_API_KEY=...
WHATSAPP_WEBHOOK_SECRET=...`}
            </pre>
            <p className="mt-3 text-sm text-ink-muted">ووجّه Webhook البوابة إلى:</p>
            <code className="wa-admin__code-inline" dir="ltr">
              POST /api/v1/webhooks/whatsapp
            </code>
          </div>
        </section>
      ) : (
        <>
          <section className="admin-panel wa-admin__create">
            <div>
              <h3 className="font-bold text-ink">إنشاء جلسة جديدة</h3>
              <p className="mt-1 text-sm text-ink-muted">
                معرّف بسيط بدون مسافات — مثال: <span dir="ltr">arkan-orders</span>
              </p>
            </div>
            <div className="wa-admin__create-row">
              <input
                className="wa-admin__input"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="arkan-orders"
                dir="ltr"
                disabled={busy || !canManage}
              />
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={busy || !newId.trim() || !canManage}
                onClick={() => void onCreate()}
              >
                <Icon name="plus" size={16} />
                إنشاء جلسة
              </button>
            </div>
          </section>

          <div className="wa-admin__grid">
            <section className="admin-panel wa-admin__sessions">
              <div className="wa-admin__panel-head">
                <h3 className="font-bold text-ink">الجلسات</h3>
                <span className="text-xs text-ink-muted">{sessions.length} جلسة</span>
              </div>

              {sessions.length === 0 ? (
                <div className="wa-admin__empty">
                  <Icon name="spark" size={22} />
                  <p>لا توجد جلسات بعد</p>
                  <span>أنشئ جلسة للبدء وامسح QR من الجوال</span>
                </div>
              ) : (
                <ul className="wa-admin__session-list">
                  {sessions.map((s) => {
                    const active = selectedId === s.id;
                    const isAssigned = assigned === s.id;
                    const on = isWhatsAppConnected(s.status);
                    return (
                      <li key={s.id} className={active ? "is-active" : ""}>
                        <button
                          type="button"
                          className="wa-admin__session-main"
                          onClick={() => setSelectedId(s.id)}
                        >
                          <span className={`wa-status-dot ${on ? "is-on" : "is-off"}`} />
                          <span className="min-w-0">
                            <span className="wa-admin__session-id" dir="ltr">
                              {s.id}
                            </span>
                            <span className="wa-admin__session-meta">
                              {sessionStatusLabel(s.status)}
                              {isAssigned ? <em>جلسة التأكيد</em> : null}
                            </span>
                          </span>
                        </button>
                        <div className="wa-admin__session-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm"
                            disabled={busy}
                            onClick={() => void refreshDetail(s.id)}
                            title="عرض"
                          >
                            <Icon name="qr" size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--primary"
                            disabled={busy || isAssigned || !canManage}
                            onClick={() => void onAssign(s.id)}
                            title="تعيين"
                          >
                            <Icon name="link" size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm"
                            disabled={busy || !canManage}
                            onClick={() => void onReconnect(s.id)}
                            title="إعادة اتصال"
                          >
                            <Icon name="plug" size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--danger"
                            disabled={busy || !canManage}
                            onClick={() => void onDelete(s.id)}
                            title="حذف"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="admin-panel wa-admin__detail">
              <div className="wa-admin__panel-head">
                <h3 className="font-bold text-ink">QR / تفاصيل الجلسة</h3>
                {polling ? <span className="wa-admin__polling">تحديث تلقائي…</span> : null}
              </div>

              {!detail ? (
                <div className="wa-admin__empty">
                  <Icon name="qr" size={22} />
                  <p>اختر جلسة لعرض رمز الربط</p>
                </div>
              ) : (
                <div className="wa-admin__detail-body">
                  <div className="wa-admin__detail-card">
                    <p className="font-mono text-xs text-ink-muted" dir="ltr">
                      {detail.id}
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink">
                      الحالة: {sessionStatusLabel(detail.status)}
                      {detail.status ? (
                        <span className="ms-2 font-mono text-xs font-normal text-ink-muted" dir="ltr">
                          ({detail.status})
                        </span>
                      ) : null}
                    </p>
                    {detail.phone ? (
                      <p className="mt-1 text-sm text-ink-muted" dir="ltr">
                        {String(detail.phone)}
                      </p>
                    ) : null}
                    {assigned === detail.id ? (
                      <span className="wa-admin__assigned-chip">معيّنة لتأكيد الطلبات</span>
                    ) : null}
                  </div>

                  {connected ? (
                    <div className="wa-admin__connected">
                      <Icon name="check" size={20} />
                      <div>
                        <p>الجلسة متصلة</p>
                        <span>جاهزة لإرسال رسائل تأكيد الطلبات بعد التعيين</span>
                      </div>
                    </div>
                  ) : qrSrc ? (
                    <div className="wa-admin__qr">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrSrc} alt="رمز واتساب" />
                      <p>
                        واتساب ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز
                      </p>
                    </div>
                  ) : (
                    <div className="wa-admin__empty wa-admin__empty--soft">
                      <p>لا يوجد QR حالياً</p>
                      <span>جرّب «إعادة اتصال» أو «تحديث QR»</span>
                    </div>
                  )}

                  <div className="wa-admin__detail-actions">
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy}
                      onClick={() => void refreshDetail(detail.id)}
                    >
                      <Icon name="refresh" size={15} />
                      تحديث QR
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy || !canManage}
                      onClick={() => void onReconnect(detail.id)}
                    >
                      <Icon name="plug" size={15} />
                      إعادة اتصال
                    </button>
                    {assigned !== detail.id ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={busy || !canManage || !connected}
                        onClick={() => void onAssign(detail.id)}
                      >
                        <Icon name="link" size={15} />
                        تعيين كتأكيد طلبات
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="admin-panel wa-admin__howto">
            <h3 className="font-bold text-ink">كيف يعمل النظام؟</h3>
            <div className="wa-admin__flow">
              <div>
                <strong>1</strong>
                <p>طلب جديد (Pending) أو دفع ناجح</p>
              </div>
              <div>
                <strong>2</strong>
                <p>إرسال ملخص الطلب على واتساب</p>
              </div>
              <div>
                <strong>3</strong>
                <p>نجاح الإرسال → بانتظار واتساب</p>
              </div>
              <div>
                <strong>4</strong>
                <p>نعم → مؤكد / لا → ملغي</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              نفس سلوك جفون: لو فشل إرسال واتساب يفضل الطلب Pending للتأكيد اليدوي. من تفاصيل الطلب يمكن إعادة الإرسال.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
