"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  formatDateTime,
  formatMoney,
  orderStatusLabels,
} from "@/lib/api";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import {
  fetchAdminOrders,
  fulfillmentLabel,
  paymentLabel,
  statusLabel,
  type AdminOrderListItem,
} from "@/lib/admin-orders";

function Icon({
  name,
  size = 18,
}: {
  name:
    | "orders"
    | "search"
    | "refresh"
    | "alert"
    | "check"
    | "eye"
    | "clock"
    | "truck"
    | "user"
    | "filter";
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
    search: (
      <svg {...props}>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M16.2 16.2L20 20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
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
    check: (
      <svg {...props}>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    eye: (
      <svg {...props}>
        <path
          d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
    clock: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 8v4.5l3 1.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
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
    filter: (
      <svg {...props}>
        <path
          d="M4 6h16M7 12h10M10 18h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
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

const QUICK_STATUS = [
  { value: "", label: "الكل" },
  { value: "awaiting_confirmation", label: "بانتظار واتساب" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "processing", label: "قيد التجهيز" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
] as const;

export default function AdminOrdersPage() {
  const { accessToken, hasPermission } = useAuth();
  const canRead = hasPermission("orders.read");

  const [items, setItems] = useState<AdminOrderListItem[]>([]);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const stats = useMemo(() => {
    const awaiting = items.filter(
      (o) => o.status === "awaiting_confirmation",
    ).length;
    const processing = items.filter((o) =>
      ["confirmed", "processing", "ready_for_shipment"].includes(o.status),
    ).length;
    const delivered = items.filter((o) => o.status === "delivered").length;
    return { total, awaiting, processing, delivered };
  }, [items, total]);

  const load = useCallback(async () => {
    if (!accessToken || !canRead) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminOrders(accessToken, {
        page,
        limit: 20,
        q: q || undefined,
        status: status || undefined,
        payment_status: paymentStatus || undefined,
      });
      setItems(res.data);
      setTotal(res.meta.total || res.data.length);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [accessToken, canRead, page, q, status, paymentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <div className="order-admin">
      <header className="cat-admin__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon" aria-hidden>
            <Icon name="orders" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">المبيعات والعمليات</p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              إدارة الطلبات
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              تابع الطلبات، فلتر بالحالة والدفع، وافتح التفاصيل لتغيير الحالة.
            </p>
          </div>
        </div>
      </header>

      <section className="cat-stats">
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="orders" />
          </span>
          <div>
            <p>الإجمالي</p>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <button
          type="button"
          className={`cat-stat cat-stat--btn ${status === "awaiting_confirmation" ? "is-active" : ""}`}
          onClick={() => {
            setPage(1);
            setStatus((s) =>
              s === "awaiting_confirmation" ? "" : "awaiting_confirmation",
            );
          }}
        >
          <span className="cat-stat__icon cat-stat__icon--root">
            <Icon name="clock" />
          </span>
          <div>
            <p>بانتظار واتساب</p>
            <strong>{stats.awaiting}</strong>
          </div>
        </button>
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="refresh" />
          </span>
          <div>
            <p>قيد المعالجة</p>
            <strong>{stats.processing}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--ok">
            <Icon name="check" />
          </span>
          <div>
            <p>مُسلَّمة (بالصفحة)</p>
            <strong>{stats.delivered}</strong>
          </div>
        </article>
      </section>

      <div className="order-quick-filters" role="tablist" aria-label="فلتر سريع بالحالة">
        <span className="order-quick-filters__label">
          <Icon name="filter" size={14} />
          حالة سريعة
        </span>
        {QUICK_STATUS.map((s) => (
          <button
            key={s.value || "all"}
            type="button"
            role="tab"
            aria-selected={status === s.value}
            className={`order-chip ${status === s.value ? "is-active" : ""}`}
            onClick={() => {
              setPage(1);
              setStatus(s.value);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="cat-toolbar">
        <label className="cat-search">
          <Icon name="search" size={17} />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="رقم الطلب / الجوال / الاسم..."
          />
        </label>
        <label className="brand-filter">
          الحالة
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">الكل</option>
            {Object.entries(orderStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="brand-filter">
          الدفع
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPage(1);
              setPaymentStatus(e.target.value);
            }}
          >
            <option value="">الكل</option>
            <option value="pending">معلّق</option>
            <option value="paid">مدفوع</option>
            <option value="failed">فشل</option>
            <option value="refunded">مسترد</option>
          </select>
        </label>
        <button
          type="button"
          className="admin-btn cat-toolbar__refresh"
          onClick={() => void load()}
        >
          <Icon name="refresh" size={16} />
          تحديث
        </button>
      </div>

      {error && (
        <p className="cat-alert cat-alert--error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}

      <section className="admin-panel">
        <div className="cat-panel-head">
          <div className="cat-panel-head__title">
            <span className="cat-panel-head__icon">
              <Icon name="orders" size={16} />
            </span>
            <div>
              <h3>قائمة الطلبات</h3>
              <p>
                {loading
                  ? "جاري التحميل..."
                  : `${items.length} في الصفحة · إجمالي ${total}`}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table order-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>الحالة</th>
                <th>الدفع / التجهيز</th>
                <th>الإجمالي</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="cat-empty">
                      <PageLoader variant="inline" label="جاري تحميل الطلبات" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="cat-empty">
                      <Icon name="orders" size={28} />
                      <p>لا توجد طلبات مطابقة</p>
                      <p className="text-sm text-ink-muted">
                        جرّب تغيير الفلاتر أو مسح البحث.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((o) => {
                  const pay = o.payment_status || "pending";
                  const fulfill = o.fulfillment_status || "unfulfilled";
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="order-num-cell">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="order-number"
                            dir="ltr"
                          >
                            {o.order_number}
                          </Link>
                          {o.items_count != null && (
                            <span className="order-items-count">
                              {o.items_count} منتج
                            </span>
                          )}
                          {o.coupon_code && (
                            <span className="admin-badge admin-badge--muted">
                              {o.coupon_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="order-customer">
                          <span className="order-customer__avatar" aria-hidden>
                            <Icon name="user" size={14} />
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate">
                              {o.shipping_name || o.customer_name || "ضيف"}
                            </strong>
                            <span className="order-customer__phone" dir="ltr">
                              {o.phone || o.guest_email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`order-pill order-pill--${statusTone(o.status)}`}
                          >
                            {statusLabel(o.status)}
                          </span>
                          {o.status === "awaiting_confirmation" ? (
                            <span className="order-pill order-pill--sm order-pill--warn">
                              واتساب
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="order-meta-stack">
                          <span
                            className={`order-pill order-pill--sm order-pill--${paymentTone(pay)}`}
                          >
                            {paymentLabel(pay)}
                          </span>
                          <span className="order-fulfill">
                            <Icon name="truck" size={12} />
                            {fulfillmentLabel(fulfill)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong className="order-total">
                          {formatMoney(o.total)}
                        </strong>
                      </td>
                      <td>
                        <time className="order-date" dateTime={o.created_at}>
                          {formatDateTime(o.created_at)}
                        </time>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="admin-btn admin-btn--sm admin-btn--primary"
                          >
                            <Icon name="eye" size={14} />
                            تفاصيل
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="cat-pagination">
            <button
              type="button"
              className="admin-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </button>
            <span>
              صفحة {page} من {totalPages}
            </span>
            <button
              type="button"
              className="admin-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
