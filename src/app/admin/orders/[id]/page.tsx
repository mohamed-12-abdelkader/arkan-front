"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, formatDateTime, formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  fetchAdminOrder,
  fulfillmentLabel,
  FULFILLMENT_STATUS_OPTIONS,
  paymentLabel,
  PAYMENT_STATUS_OPTIONS,
  statusLabel,
  updateAdminOrder,
  updateOrderStatus,
  type AdminOrderDetail,
} from "@/lib/admin-orders";
import { resendConfirmErrorMessage, resendWhatsAppConfirm } from "@/lib/whatsapp";

function Icon({
  name,
  size = 18,
}: {
  name:
    | "back"
    | "alert"
    | "success"
    | "save"
    | "refresh"
    | "user"
    | "truck"
    | "orders"
    | "note"
    | "history";
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
    back: (
      <svg {...props}>
        <path
          d="M15 5l-7 7 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    alert: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 8v5M12 16.5h.01"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    success: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M8.5 12.2l2.3 2.3 4.7-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    save: (
      <svg {...props}>
        <path
          d="M5 5h11.5L19 7.5V19H5V5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 5v5h7V5M8 19v-6h8v6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
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
    user: (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M5 19c1.5-3.2 3.8-4.8 7-4.8s5.5 1.6 7 4.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    truck: (
      <svg {...props}>
        <path
          d="M3 7h11v9H3zM14 10h4.5L21 13v3h-7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
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
    note: (
      <svg {...props}>
        <path
          d="M6 4h9l3 3v13H6V4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9 10h6M9 14h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    history: (
      <svg {...props}>
        <path
          d="M4 12a8 8 0 1 0 2.3-5.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M4 4v4h4M12 8v4l2.5 1.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return icons[name];
}

function statusTone(status: string) {
  if (status === "delivered") return "ok";
  if (status === "cancelled" || status === "failed") return "danger";
  if (
    status === "awaiting_confirmation" ||
    status === "pending" ||
    status === "pending_payment"
  )
    return "warn";
  if (status === "shipped" || status === "ready_for_shipment") return "ship";
  if (status === "return_requested" || status === "returned") return "return";
  return "info";
}

function paymentTone(status: string) {
  if (status === "paid") return "ok";
  if (status === "failed") return "danger";
  if (status === "refunded" || status === "partially_refunded") return "return";
  return "warn";
}

function addrText(
  json: Record<string, unknown> | null | undefined,
  fallback?: string | null,
) {
  if (!json || typeof json !== "object") return fallback || "—";
  const parts = [
    json.full_name,
    json.phone,
    json.city,
    json.governorate,
    json.address_line1,
    json.address_line2,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(" — ") : fallback || "—";
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, hasPermission } = useAuth();
  const canRead = hasPermission("orders.read");
  const canManage = hasPermission("orders.manage");

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const [adminNotes, setAdminNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("unfulfilled");
  const [metaBusy, setMetaBusy] = useState(false);
  const [waBusy, setWaBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !canRead || !params.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminOrder(accessToken, params.id);
      setOrder(data);
      setAdminNotes(data.admin_notes || "");
      setPaymentStatus(data.payment_status || "pending");
      setFulfillmentStatus(data.fulfillment_status || "unfulfilled");
      const next = data.allowed_next_statuses?.[0] || "";
      setNextStatus(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل الطلب");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, canRead, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onStatusSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage || !order || !nextStatus) return;
    setStatusBusy(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateOrderStatus(accessToken, order.id, {
        status: nextStatus,
        note: statusNote.trim() || undefined,
      });
      setSuccess(`تم تحديث الحالة إلى: ${statusLabel(updated.status)}`);
      setStatusNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحديث الحالة");
    } finally {
      setStatusBusy(false);
    }
  };

  const onMetaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage || !order) return;
    setMetaBusy(true);
    setError("");
    setSuccess("");
    try {
      await updateAdminOrder(accessToken, order.id, {
        admin_notes: adminNotes.trim() || null,
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
      });
      setSuccess("تم حفظ ملاحظات وحالات الدفع/التجهيز");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر الحفظ");
    } finally {
      setMetaBusy(false);
    }
  };

  if (!canRead) {
    return (
      <div className="order-admin">
        <div className="cat-alert cat-alert--error">
          <Icon name="alert" />
          <span>ليس لديك صلاحية عرض الطلبات.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-admin">
        <PageLoader label="جاري تحميل الطلب" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-admin space-y-4">
        <div className="cat-alert cat-alert--error">
          <Icon name="alert" />
          <span>{error || "الطلب غير موجود"}</span>
        </div>
        <Link href="/admin/orders" className="admin-btn">
          <Icon name="back" />
          العودة للطلبات
        </Link>
      </div>
    );
  }

  const shipping = order.shipping_address_json as Record<string, unknown> | null;
  const pay = order.payment_status || "pending";
  const customerPhone = order.phone || order.customer_phone || "";
  const showWhatsAppResend =
    canManage &&
    (order.status === "awaiting_confirmation" || order.status === "confirmed");

  const onResendWhatsApp = async () => {
    if (!accessToken || !canManage) return;
    setWaBusy(true);
    setError("");
    setSuccess("");
    try {
      await resendWhatsAppConfirm(accessToken, order.id);
      setSuccess("تم إرسال رسالة التأكيد عبر واتساب");
    } catch (err) {
      const msg = err instanceof ApiError || err instanceof Error ? err.message : "فشل الإرسال";
      setError(resendConfirmErrorMessage(msg));
    } finally {
      setWaBusy(false);
    }
  };

  return (
    <div className="order-admin order-detail">
      <div className="order-detail__nav">
        <button
          type="button"
          className="admin-btn"
          onClick={() => router.push("/admin/orders")}
        >
          <Icon name="back" />
          كل الطلبات
        </button>
        <button type="button" className="admin-btn" onClick={() => void load()}>
          <Icon name="refresh" size={16} />
          تحديث
        </button>
      </div>

      <header className="cat-admin__hero order-detail__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon" aria-hidden>
            <Icon name="orders" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">تفاصيل الطلب</p>
            <h2
              className="font-display text-2xl font-bold text-ink sm:text-3xl"
              dir="ltr"
            >
              {order.order_number}
            </h2>
            <div className="order-detail__hero-meta">
              <time dateTime={order.created_at}>
                {formatDateTime(order.created_at)}
              </time>
              <span
                className={`order-pill order-pill--${statusTone(order.status)}`}
              >
                {statusLabel(order.status)}
              </span>
              {order.status === "awaiting_confirmation" ? (
                <span className="order-pill order-pill--sm order-pill--warn">واتساب</span>
              ) : null}
              <span
                className={`order-pill order-pill--sm order-pill--${paymentTone(pay)}`}
              >
                {paymentLabel(pay)}
              </span>
            </div>
          </div>
        </div>
        <div className="order-detail__total">
          <p>الإجمالي</p>
          <strong>{formatMoney(order.total)}</strong>
        </div>
      </header>

      {error && (
        <p className="cat-alert cat-alert--error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
      {success && (
        <p className="cat-alert cat-alert--success">
          <Icon name="success" size={16} />
          {success}
        </p>
      )}

      <div className="order-detail__grid">
        <div className="order-detail__main">
          <section className="admin-panel">
            <div className="cat-panel-head">
              <div className="cat-panel-head__title">
                <span className="cat-panel-head__icon">
                  <Icon name="orders" size={16} />
                </span>
                <div>
                  <h3>المنتجات</h3>
                  <p>{(order.items || []).length} عنصر</p>
                </div>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-semibold text-ink">
                          {item.product_name}
                        </p>
                        {item.sku && (
                          <p className="text-xs text-ink-muted" dir="ltr">
                            {item.sku}
                          </p>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.price)}</td>
                      <td className="font-bold text-accent">
                        {formatMoney(
                          item.line_total ??
                            Number(item.price) * item.quantity,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-totals">
              <div>
                <span>المجموع</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {Number(order.discount_total) > 0 && (
                <div>
                  <span>
                    الخصم
                    {order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </span>
                  <span className="text-accent">
                    −{formatMoney(order.discount_total)}
                  </span>
                </div>
              )}
              <div>
                <span>الشحن</span>
                <span>{formatMoney(order.shipping_total)}</span>
              </div>
              <div className="order-totals__grand">
                <span>الإجمالي</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <div className="cat-panel-head">
              <div className="cat-panel-head__title">
                <span className="cat-panel-head__icon">
                  <Icon name="history" size={16} />
                </span>
                <div>
                  <h3>سجل الحالات</h3>
                  <p>تتبع تغييرات الطلب</p>
                </div>
              </div>
            </div>

            {(order.history || []).length === 0 ? (
              <div className="cat-empty cat-empty--compact">
                <Icon name="history" size={22} />
                <p>لا يوجد سجل بعد</p>
              </div>
            ) : (
              <ol className="order-timeline">
                {order.history.map((h, idx) => (
                  <li key={h.id ?? `${h.created_at}-${idx}`}>
                    <span className="order-timeline__dot" aria-hidden />
                    <div>
                      <p className="order-timeline__title">
                        {h.from_status
                          ? `${statusLabel(h.from_status)} → ${statusLabel(h.to_status)}`
                          : statusLabel(h.to_status)}
                      </p>
                      <span className="order-timeline__meta">
                        {formatDateTime(h.created_at)}
                        {h.actor_name ? ` · ${h.actor_name}` : ""}
                      </span>
                      {h.note && (
                        <p className="order-timeline__note">{h.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="order-detail__aside">
          {showWhatsAppResend ? (
            <section className="admin-panel wa-order-panel">
              <div className="cat-panel-head">
                <div className="cat-panel-head__title">
                  <span className="cat-panel-head__icon">WA</span>
                  <div>
                    <h3>تأكيد واتساب</h3>
                    <p>
                      {order.status === "awaiting_confirmation"
                        ? "بانتظار رد العميل على الرسالة"
                        : "إعادة تنبيه العميل عبر واتساب"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink-muted">
                {customerPhone
                  ? `يُتوقع إرسال رسالة تأكيد للعميل على الرقم ${customerPhone}`
                  : "هذا الطلب بدون رقم هاتف — تعذر إرسال واتساب"}
              </p>
              <button
                type="button"
                className="admin-btn admin-btn--primary mt-3 w-full"
                disabled={waBusy || !customerPhone}
                onClick={() => void onResendWhatsApp()}
              >
                {waBusy ? "جاري الإرسال…" : "إعادة إرسال رسالة واتساب"}
              </button>
              <Link href="/admin/whatsapp" className="mt-2 inline-flex text-sm font-bold text-accent hover:text-ink">
                إدارة جلسات واتساب
              </Link>
            </section>
          ) : null}

          <section className="admin-panel">
            <div className="cat-panel-head">
              <div className="cat-panel-head__title">
                <span className="cat-panel-head__icon">
                  <Icon name="user" size={16} />
                </span>
                <div>
                  <h3>العميل والتوصيل</h3>
                  <p>بيانات الشحن</p>
                </div>
              </div>
            </div>

            <dl className="order-info-list">
              <div>
                <dt>الاسم</dt>
                <dd>
                  {(shipping?.full_name as string) ||
                    order.customer_name ||
                    "ضيف"}
                </dd>
              </div>
              <div>
                <dt>الجوال</dt>
                <dd dir="ltr">{order.phone || order.customer_phone || "—"}</dd>
              </div>
              <div>
                <dt>البريد</dt>
                <dd dir="ltr" className="break-all">
                  {order.guest_email || order.customer_email || "—"}
                </dd>
              </div>
              <div className="order-info-list__block">
                <dt>العنوان</dt>
                <dd>{addrText(shipping, order.shipping_address)}</dd>
              </div>
              {order.customer_notes && (
                <div className="order-info-list__block">
                  <dt>ملاحظات العميل</dt>
                  <dd>{order.customer_notes}</dd>
                </div>
              )}
              <div>
                <dt>الدفع</dt>
                <dd>
                  <span
                    className={`order-pill order-pill--sm order-pill--${paymentTone(pay)}`}
                  >
                    {paymentLabel(pay)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>التجهيز</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <Icon name="truck" size={13} />
                  {fulfillmentLabel(order.fulfillment_status || "unfulfilled")}
                </dd>
              </div>
            </dl>
          </section>

          {canManage && (
            <section className="admin-panel">
              <div className="cat-panel-head">
                <div className="cat-panel-head__title">
                  <span className="cat-panel-head__icon">
                    <Icon name="truck" size={16} />
                  </span>
                  <div>
                    <h3>تغيير الحالة</h3>
                    <p>انتقالات مسموحة فقط</p>
                  </div>
                </div>
              </div>

              {(order.allowed_next_statuses || []).length === 0 ? (
                <p className="text-sm text-ink-muted px-1">
                  لا توجد انتقالات متاحة من الحالة الحالية.
                </p>
              ) : (
                <form className="order-action-form" onSubmit={onStatusSubmit}>
                  <label className="checkout-field">
                    <span>الحالة التالية</span>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      required
                    >
                      {order.allowed_next_statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkout-field">
                    <span>ملاحظة (اختياري)</span>
                    <textarea
                      rows={2}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="سبب التغيير أو ملاحظة داخلية"
                    />
                  </label>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary w-full"
                    disabled={statusBusy}
                  >
                    {statusBusy ? "جاري التحديث..." : "تحديث الحالة"}
                  </button>
                </form>
              )}
            </section>
          )}

          {canManage && (
            <section className="admin-panel">
              <div className="cat-panel-head">
                <div className="cat-panel-head__title">
                  <span className="cat-panel-head__icon">
                    <Icon name="note" size={16} />
                  </span>
                  <div>
                    <h3>ملاحظات وحالات</h3>
                    <p>دفع · تجهيز · ملاحظات</p>
                  </div>
                </div>
              </div>

              <form className="order-action-form" onSubmit={onMetaSubmit}>
                <label className="checkout-field">
                  <span>ملاحظات الأدمن</span>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="ملاحظات داخلية عن الطلب"
                  />
                </label>
                <label className="checkout-field">
                  <span>حالة الدفع</span>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {paymentLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkout-field">
                  <span>حالة التجهيز</span>
                  <select
                    value={fulfillmentStatus}
                    onChange={(e) => setFulfillmentStatus(e.target.value)}
                  >
                    {FULFILLMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {fulfillmentLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary w-full"
                  disabled={metaBusy}
                >
                  <Icon name="save" size={16} />
                  {metaBusy ? "جاري الحفظ..." : "حفظ"}
                </button>
              </form>
            </section>
          )}

          {(order.payments || []).length > 0 && (
            <section className="admin-panel">
              <div className="cat-panel-head">
                <div className="cat-panel-head__title">
                  <div>
                    <h3>المدفوعات</h3>
                    <p>{order.payments.length} عملية</p>
                  </div>
                </div>
              </div>
              <ul className="order-payments">
                {order.payments.map((p) => (
                  <li key={p.id}>
                    <span>
                      {p.method || p.provider || "—"} ·{" "}
                      {paymentLabel(p.status || "pending")}
                    </span>
                    <strong>{formatMoney(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
