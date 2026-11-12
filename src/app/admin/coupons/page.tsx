"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, formatDateTime, formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  formToCouponBody,
  updateCoupon,
  type Coupon,
  type CouponFormFields,
} from "@/lib/coupons";

const emptyForm: CouponFormFields = {
  code: "",
  value: 10,
  type: "percentage",
  min_order_amount: "",
  max_discount: "",
  starts_at: "",
  ends_at: "",
  usage_limit: "",
  per_customer_limit: "",
  first_order_only: false,
  is_active: true,
};

function Icon({
  name,
  size = 18,
}: {
  name:
    | "ticket"
    | "plus"
    | "refresh"
    | "edit"
    | "trash"
    | "check"
    | "alert"
    | "success"
    | "close"
    | "save"
    | "percent"
    | "search"
    | "calendar"
    | "copy"
    | "spark";
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
    ticket: (
      <svg {...props}>
        <path
          d="M4 9.5A2.5 2.5 0 0 0 6.5 12 2.5 2.5 0 0 0 4 14.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5A2.5 2.5 0 0 0 17.5 12 2.5 2.5 0 0 0 20 9.5V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
    plus: (
      <svg {...props}>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.9"
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
    edit: (
      <svg {...props}>
        <path
          d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
    trash: (
      <svg {...props}>
        <path
          d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
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
    close: (
      <svg {...props}>
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
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
    percent: (
      <svg {...props}>
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.7" />
        <circle
          cx="16.5"
          cy="16.5"
          r="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M17 7L7 17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
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
    calendar: (
      <svg {...props}>
        <rect
          x="3.5"
          y="5"
          width="17"
          height="15"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8 3.5V7M16 3.5V7M3.5 10h17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    copy: (
      <svg {...props}>
        <rect
          x="8"
          y="8"
          width="11"
          height="11"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M6 15V6a2 2 0 0 1 2-2h9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    spark: (
      <svg {...props}>
        <path
          d="M12 3l1.2 5.2L18 9.5l-4.2 2.2L12 17l-1.8-5.3L6 9.5l4.8-1.3L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[name];
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function typeLabel(type: Coupon["type"]) {
  if (type === "percentage") return "نسبة %";
  if (type === "fixed") return "مبلغ ثابت";
  return "شحن مجاني";
}

function typeClass(type: Coupon["type"]) {
  if (type === "percentage") return "coupon-type coupon-type--pct";
  if (type === "fixed") return "coupon-type coupon-type--fixed";
  return "coupon-type coupon-type--ship";
}

function valueLabel(c: Coupon) {
  if (c.type === "percentage") return `${c.value}%`;
  if (c.type === "fixed") return formatMoney(c.value);
  return "شحن مجاني";
}

function usagePct(c: Coupon) {
  const used = Number(c.used_count || 0);
  const limit = c.usage_limit != null ? Number(c.usage_limit) : null;
  if (!limit || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

function isExpired(c: Coupon) {
  if (!c.ends_at) return false;
  const t = new Date(c.ends_at).getTime();
  return Number.isFinite(t) && t < Date.now();
}

function isUpcoming(c: Coupon) {
  if (!c.starts_at) return false;
  const t = new Date(c.starts_at).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export default function AdminCouponsPage() {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("coupons.manage");

  const [items, setItems] = useState<Coupon[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormFields>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const active = items.filter(
      (c) => c.is_active !== false && !isExpired(c),
    ).length;
    return {
      total,
      active,
      inactive: Math.max(0, items.length - active),
      used: items.reduce((s, c) => s + Number(c.used_count || 0), 0),
    };
  }, [items, total]);

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    return items.filter((c) => {
      if (term && !c.code.toUpperCase().includes(term)) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter === "active" && (c.is_active === false || isExpired(c)))
        return false;
      if (statusFilter === "inactive" && c.is_active !== false && !isExpired(c))
        return false;
      return true;
    });
  }, [items, q, typeFilter, statusFilter]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchCoupons(accessToken, { page, limit: 20 });
      setItems(res.data);
      setTotal(res.meta.total || res.data.length);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل أكواد الخصم");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
    setSuccess("");
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      value: Number(coupon.value) || 0,
      type: coupon.type || "percentage",
      min_order_amount:
        coupon.min_order_amount != null ? String(coupon.min_order_amount) : "",
      max_discount:
        coupon.max_discount != null ? String(coupon.max_discount) : "",
      starts_at: toLocalInput(coupon.starts_at),
      ends_at: toLocalInput(coupon.ends_at),
      usage_limit:
        coupon.usage_limit != null ? String(coupon.usage_limit) : "",
      per_customer_limit:
        coupon.per_customer_limit != null
          ? String(coupon.per_customer_limit)
          : "",
      first_order_only: !!coupon.first_order_only,
      is_active: coupon.is_active !== false,
    });
    setFormError("");
    setModalOpen(true);
    setSuccess("");
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setFormError("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage) return;
    if (!form.code.trim()) {
      setFormError("كود الخصم مطلوب");
      return;
    }
    if (form.type !== "free_shipping" && !(form.value > 0)) {
      setFormError("قيمة الخصم يجب أن تكون أكبر من صفر");
      return;
    }
    if (form.type === "percentage" && form.value > 100) {
      setFormError("نسبة الخصم لا تتجاوز 100%");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const body = formToCouponBody(form);
      if (editing) {
        await updateCoupon(accessToken, editing.id, body);
        setSuccess("تم تحديث كود الخصم");
      } else {
        await createCoupon(accessToken, body);
        setSuccess("تم إنشاء كود الخصم");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "تعذر حفظ كود الخصم",
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (coupon: Coupon) => {
    if (!accessToken || !canManage) return;
    if (!window.confirm(`حذف كود الخصم "${coupon.code}"؟`)) return;
    setError("");
    try {
      await deleteCoupon(accessToken, coupon.id);
      setSuccess("تم حذف كود الخصم");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حذف كود الخصم");
    }
  };

  const copyCode = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      window.setTimeout(() => setCopiedId(null), 1400);
    } catch {
      // ignore
    }
  };

  return (
    <div className="coupon-admin">
      <header className="cat-admin__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon" aria-hidden>
            <Icon name="ticket" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">التسويق والمبيعات</p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              أكواد الخصم
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              أنشئ كوبونات نسبة أو مبلغ ثابت أو شحن مجاني — يطبّقها العميل في
              السلة قبل الدفع.
            </p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            className="admin-btn admin-btn--primary cat-admin__cta"
            onClick={openCreate}
          >
            <Icon name="plus" size={18} />
            كود خصم جديد
          </button>
        )}
      </header>

      <section className="cat-stats">
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="ticket" />
          </span>
          <div>
            <p>الإجمالي</p>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--ok">
            <Icon name="check" />
          </span>
          <div>
            <p>نشطة (بالصفحة)</p>
            <strong>{stats.active}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="spark" />
          </span>
          <div>
            <p>مرات الاستخدام</p>
            <strong>{stats.used}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--root">
            <Icon name="alert" />
          </span>
          <div>
            <p>موقوف / منتهي</p>
            <strong>{stats.inactive}</strong>
          </div>
        </article>
      </section>

      <div className="cat-toolbar">
        <label className="cat-search">
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالكود..."
            dir="ltr"
          />
        </label>
        <label className="brand-filter">
          النوع
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">الكل</option>
            <option value="percentage">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
            <option value="free_shipping">شحن مجاني</option>
          </select>
        </label>
        <label className="brand-filter">
          الحالة
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">الكل</option>
            <option value="active">نشط</option>
            <option value="inactive">موقوف / منتهي</option>
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
      {success && (
        <p className="cat-alert cat-alert--success">
          <Icon name="success" size={16} />
          {success}
        </p>
      )}
      {!canManage && (
        <p className="cat-alert cat-alert--info">
          <Icon name="alert" size={16} />
          حسابك لا يملك صلاحية التعديل (`coupons.manage`).
        </p>
      )}

      <section className="admin-panel">
        <div className="cat-panel-head">
          <div className="cat-panel-head__title">
            <span className="cat-panel-head__icon">
              <Icon name="ticket" size={16} />
            </span>
            <div>
              <h3>قائمة الأكواد</h3>
              <p>
                {loading
                  ? "جاري التحميل..."
                  : `${filtered.length} من ${items.length} · إجمالي ${total}`}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table coupon-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>النوع / القيمة</th>
                <th>الاستخدام</th>
                <th>الصلاحية</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="cat-empty">
                      <PageLoader variant="inline" label="جاري تحميل أكواد الخصم" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="cat-empty">
                      <Icon name="ticket" size={28} />
                      <p>
                        {items.length === 0
                          ? "لا توجد أكواد خصم بعد"
                          : "لا نتائج مطابقة للفلاتر"}
                      </p>
                      {canManage && items.length === 0 && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          onClick={openCreate}
                        >
                          <Icon name="plus" size={14} />
                          إنشاء أول كود
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const pct = usagePct(c);
                  const expired = isExpired(c);
                  const upcoming = isUpcoming(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="coupon-code-cell">
                          <span className="coupon-ticket" dir="ltr">
                            <Icon name="ticket" size={14} />
                            {c.code}
                          </span>
                          <button
                            type="button"
                            className="coupon-copy"
                            title="نسخ الكود"
                            onClick={() => void copyCode(c)}
                          >
                            <Icon name="copy" size={13} />
                            {copiedId === c.id ? "تم" : "نسخ"}
                          </button>
                          {c.first_order_only ? (
                            <span className="admin-badge admin-badge--muted">
                              أول طلب فقط
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="coupon-value-cell">
                          <span className={typeClass(c.type)}>
                            {c.type === "percentage" ? (
                              <Icon name="percent" size={12} />
                            ) : null}
                            {typeLabel(c.type)}
                          </span>
                          <strong className="coupon-value">{valueLabel(c)}</strong>
                          {c.min_order_amount != null &&
                            Number(c.min_order_amount) > 0 && (
                              <span className="coupon-meta">
                                حد أدنى {formatMoney(c.min_order_amount)}
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <div className="coupon-usage">
                          <span>
                            {c.used_count ?? 0}
                            {c.usage_limit != null
                              ? ` / ${c.usage_limit}`
                              : " · بلا حد"}
                          </span>
                          {pct != null && (
                            <span
                              className="coupon-usage__bar"
                              aria-hidden
                            >
                              <i style={{ width: `${pct}%` }} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="coupon-dates">
                          <Icon name="calendar" size={13} />
                          <div>
                            {c.starts_at || c.ends_at ? (
                              <>
                                {c.starts_at && (
                                  <p>من {formatDateTime(c.starts_at)}</p>
                                )}
                                {c.ends_at && (
                                  <p className={expired ? "is-expired" : ""}>
                                    إلى {formatDateTime(c.ends_at)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>بدون تاريخ انتهاء</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`cat-status ${
                            c.is_active === false || expired
                              ? "is-off"
                              : "is-on"
                          }`}
                        >
                          <span className="cat-status__dot" />
                          {expired
                            ? "منتهي"
                            : upcoming
                              ? "قريبًا"
                              : c.is_active === false
                                ? "موقوف"
                                : "نشط"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm"
                            onClick={() => openEdit(c)}
                            disabled={!canManage}
                            title="تعديل"
                          >
                            <Icon name="edit" size={14} />
                            تعديل
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--danger"
                            onClick={() => void onDelete(c)}
                            disabled={!canManage}
                            title="حذف"
                          >
                            <Icon name="trash" size={14} />
                            حذف
                          </button>
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

      {modalOpen && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="إغلاق"
            onClick={closeModal}
          />
          <form
            className="admin-modal__panel cat-modal coupon-modal"
            onSubmit={onSubmit}
          >
            <div className="cat-modal__head">
              <div className="cat-modal__title">
                <span className="cat-modal__icon" aria-hidden>
                  <Icon name={editing ? "edit" : "plus"} size={18} />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">
                    {editing ? "تعديل كود الخصم" : "كود خصم جديد"}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {editing
                      ? `تعديل: ${editing.code}`
                      : "حدد الكود والقيمة والحدود ثم احفظ"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cat-modal__close"
                aria-label="إغلاق"
                onClick={closeModal}
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="coupon-modal__sections">
              <section className="coupon-modal__section">
                <h4>
                  <Icon name="ticket" size={14} />
                  البيانات الأساسية
                </h4>
                <div className="admin-form-grid">
                  <label className="checkout-field">
                    <span>الكود *</span>
                    <input
                      required
                      dir="ltr"
                      className="coupon-code-input"
                      value={form.code}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="SAVE10"
                      autoFocus={!editing}
                    />
                  </label>
                  <label className="checkout-field">
                    <span>نوع الخصم</span>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          type: e.target.value as CouponFormFields["type"],
                          value:
                            e.target.value === "free_shipping"
                              ? 1
                              : f.value || 10,
                        }))
                      }
                    >
                      <option value="percentage">نسبة مئوية %</option>
                      <option value="fixed">مبلغ ثابت</option>
                      <option value="free_shipping">شحن مجاني</option>
                    </select>
                  </label>
                  {form.type !== "free_shipping" && (
                    <label className="checkout-field checkout-field--full">
                      <span>
                        {form.type === "percentage"
                          ? "نسبة الخصم % *"
                          : "قيمة الخصم (ر.س) *"}
                      </span>
                      <input
                        required
                        type="number"
                        min={1}
                        max={form.type === "percentage" ? 100 : undefined}
                        step="0.01"
                        value={form.value}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            value: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  )}
                </div>
              </section>

              <section className="coupon-modal__section">
                <h4>
                  <Icon name="percent" size={14} />
                  الحدود والشروط
                </h4>
                <div className="admin-form-grid">
                  <label className="checkout-field">
                    <span>حد أدنى للطلب</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.min_order_amount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          min_order_amount: e.target.value,
                        }))
                      }
                      placeholder="اختياري"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>أقصى خصم</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.max_discount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          max_discount: e.target.value,
                        }))
                      }
                      placeholder="للنسبة المئوية"
                      disabled={form.type !== "percentage"}
                    />
                  </label>
                  <label className="checkout-field">
                    <span>حد الاستخدام الكلي</span>
                    <input
                      type="number"
                      min={1}
                      value={form.usage_limit}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          usage_limit: e.target.value,
                        }))
                      }
                      placeholder="بدون حد"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>حد لكل عميل</span>
                    <input
                      type="number"
                      min={1}
                      value={form.per_customer_limit}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          per_customer_limit: e.target.value,
                        }))
                      }
                      placeholder="بدون حد"
                    />
                  </label>
                </div>
              </section>

              <section className="coupon-modal__section">
                <h4>
                  <Icon name="calendar" size={14} />
                  فترة الصلاحية
                </h4>
                <div className="admin-form-grid">
                  <label className="checkout-field">
                    <span>يبدأ من</span>
                    <input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, starts_at: e.target.value }))
                      }
                    />
                  </label>
                  <label className="checkout-field">
                    <span>ينتهي في</span>
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ends_at: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="coupon-modal__section coupon-modal__section--flags">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                  />
                  <Icon name="check" size={14} />
                  نشط ومتاح للاستخدام
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.first_order_only}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        first_order_only: e.target.checked,
                      }))
                    }
                  />
                  <Icon name="spark" size={14} />
                  لأول طلب فقط
                </label>
              </section>
            </div>

            {formError && (
              <p className="cat-alert cat-alert--error mt-3 mb-0">
                <Icon name="alert" size={16} />
                {formError}
              </p>
            )}

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <Icon name="close" size={14} />
                إلغاء
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving || !canManage}
              >
                <Icon name="save" size={14} />
                {saving
                  ? "جاري الحفظ..."
                  : editing
                    ? "حفظ التعديلات"
                    : "إنشاء الكود"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
