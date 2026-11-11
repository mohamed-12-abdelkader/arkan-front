"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  buildBrandFormData,
  createBrand,
  deleteBrand,
  fetchBrands,
  updateBrand,
  type Brand,
  type BrandFormFields,
} from "@/lib/catalog";

const emptyForm: BrandFormFields = {
  name: "",
  description: "",
  website: "",
  is_active: true,
};

function Icon({
  name,
  size = 18,
}: {
  name:
    | "tag"
    | "plus"
    | "search"
    | "refresh"
    | "edit"
    | "trash"
    | "globe"
    | "check"
    | "alert"
    | "success"
    | "image"
    | "close"
    | "save"
    | "layers";
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
    tag: (
      <svg {...props}>
        <path
          d="M4 12.5V6.8A1.8 1.8 0 0 1 5.8 5h5.7L20 13.5 13.5 20 4 12.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="8.8" r="1.2" fill="currentColor" />
      </svg>
    ),
    plus: (
      <svg {...props}>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg {...props}>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
    globe: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4.5 12h15M12 4c2.5 2.8 2.5 12.2 0 16M12 4c-2.5 2.8-2.5 12.2 0 16"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    check: (
      <svg {...props}>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    alert: (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8v5M12 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
    image: (
      <svg {...props}>
        <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" />
        <path
          d="M4.5 16.5l4.5-4 4 3.5 3-2.5 3.5 3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
    close: (
      <svg {...props}>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
    save: (
      <svg {...props}>
        <path d="M5 5h11.5L19 7.5V19H5V5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 5v5h7V5M8 19v-6h8v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    layers: (
      <svg {...props}>
        <path
          d="M12 4l8 4-8 4-8-4 8-4zm0 8l8 4-8 4-8-4 8-4z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return icons[name];
}

export default function AdminBrandsPage() {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("brands.manage");

  const [items, setItems] = useState<Brand[]>([]);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandFormFields>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const active = items.filter((b) => b.is_active !== false).length;
    return {
      total,
      active,
      inactive: Math.max(0, items.length - active),
      withLogo: items.filter((b) => !!b.logo).length,
    };
  }, [items, total]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchBrands(accessToken, {
        page,
        limit: 20,
        q: q || undefined,
        is_active: activeFilter || undefined,
      });
      setItems(res.data);
      setTotal(res.meta.total || res.data.length);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل البراندات");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, q, activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setModalOpen(true);
    setSuccess("");
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description || "",
      website: brand.website || "",
      is_active: brand.is_active !== false,
    });
    setLogoFile(null);
    setModalOpen(true);
    setSuccess("");
  };

  const onLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage) return;
    if (!form.name.trim()) {
      setError("اسم البراند مطلوب");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const formData = buildBrandFormData(form, logoFile);
      if (editing) {
        await updateBrand(accessToken, editing.id, formData);
        setSuccess("تم تحديث البراند بنجاح");
      } else {
        await createBrand(accessToken, formData);
        setSuccess("تم إضافة البراند بنجاح");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حفظ البراند");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (brand: Brand) => {
    if (!accessToken || !canManage) return;
    if (
      !window.confirm(
        `حذف البراند "${brand.name}"؟ سيتم فك ارتباطه من المنتجات دون حذفها.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await deleteBrand(accessToken, brand.id);
      setSuccess("تم حذف البراند");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حذف البراند");
    }
  };

  return (
    <div className="brand-admin">
      <header className="cat-admin__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon" aria-hidden>
            <Icon name="tag" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">إدارة الكتالوج</p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              البراندات
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              أضف وعدّل العلامات التجارية مع رفع اللوجو عبر multipart/form-data.
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
            إضافة براند
          </button>
        )}
      </header>

      <section className="cat-stats">
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="layers" />
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
            <Icon name="image" />
          </span>
          <div>
            <p>بلوجو</p>
            <strong>{stats.withLogo}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--root">
            <Icon name="alert" />
          </span>
          <div>
            <p>غير نشطة (بالصفحة)</p>
            <strong>{stats.inactive}</strong>
          </div>
        </article>
      </section>

      <div className="cat-toolbar">
        <label className="cat-search">
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="ابحث بالاسم أو الـ slug..."
          />
        </label>
        <label className="brand-filter">
          الحالة
          <select
            value={activeFilter}
            onChange={(e) => {
              setPage(1);
              setActiveFilter(e.target.value);
            }}
          >
            <option value="">الكل</option>
            <option value="true">نشط</option>
            <option value="false">غير نشط</option>
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
          حسابك لا يملك صلاحية التعديل (`brands.manage`).
        </p>
      )}

      <section className="admin-panel">
        <div className="cat-panel-head">
          <div className="cat-panel-head__title">
            <span className="cat-panel-head__icon">
              <Icon name="tag" size={16} />
            </span>
            <div>
              <h3>قائمة البراندات</h3>
              <p>{loading ? "جاري التحميل..." : `${total} براند`}</p>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>البراند</th>
                <th>Slug</th>
                <th>الموقع</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="cat-empty">
                      <PageLoader variant="inline" label="جاري تحميل البراندات" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="cat-empty">
                      <Icon name="tag" size={28} />
                      <p>لا توجد براندات</p>
                      {canManage && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          onClick={openCreate}
                        >
                          <Icon name="plus" size={14} />
                          إضافة أول براند
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      <div className="brand-cell">
                        <span className="brand-cell__logo" aria-hidden>
                          {brand.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(brand.logo)} alt="" />
                          ) : (
                            <Icon name="tag" size={16} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate">{brand.name}</strong>
                          {brand.description ? (
                            <p className="truncate text-xs text-ink-muted">
                              {brand.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-slug" dir="ltr">
                        {brand.slug}
                      </span>
                    </td>
                    <td>
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noreferrer"
                          className="brand-link"
                        >
                          <Icon name="globe" size={13} />
                          <span dir="ltr">{brand.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`cat-status ${
                          brand.is_active === false ? "is-off" : "is-on"
                        }`}
                      >
                        <span className="cat-status__dot" />
                        {brand.is_active === false ? "غير نشط" : "نشط"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          onClick={() => openEdit(brand)}
                          disabled={!canManage}
                        >
                          <Icon name="edit" size={14} />
                          تعديل
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          onClick={() => void onDelete(brand)}
                          disabled={!canManage}
                        >
                          <Icon name="trash" size={14} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button
            type="button"
            className="admin-btn admin-btn--sm"
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
            className="admin-btn admin-btn--sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </button>
        </div>
      </section>

      {modalOpen && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="إغلاق"
            onClick={() => setModalOpen(false)}
          />
          <form className="admin-modal__panel cat-modal" onSubmit={onSubmit}>
            <div className="cat-modal__head">
              <div className="cat-modal__title">
                <span className="cat-modal__icon" aria-hidden>
                  <Icon name={editing ? "edit" : "plus"} size={18} />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">
                    {editing ? "تعديل براند" : "إضافة براند جديد"}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {editing
                      ? `تعديل: ${editing.name}`
                      : "multipart/form-data · لوجو اختياري"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cat-modal__close"
                aria-label="إغلاق"
                onClick={() => setModalOpen(false)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="admin-form-grid">
              <label className="checkout-field checkout-field--full">
                <span>اسم البراند *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ASUS"
                />
              </label>

              <label className="checkout-field checkout-field--full">
                <span>الوصف</span>
                <textarea
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="ASUS hardware"
                />
              </label>

              <label className="checkout-field checkout-field--full">
                <span>الموقع</span>
                <input
                  dir="ltr"
                  value={form.website || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  placeholder="https://www.asus.com"
                />
              </label>

              <div className="checkout-field checkout-field--full">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="image" size={14} />
                  اللوجو (من الجهاز)
                </span>
                <label className="product-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onLogoChange}
                  />
                  <span className="product-upload__box">
                    <strong>اختر صورة اللوجو</strong>
                    <em>تُحفظ في uploads/brands</em>
                  </span>
                </label>

                {(logoPreview || (editing?.logo && !logoFile)) && (
                  <div className="brand-logo-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview || mediaUrl(editing?.logo)}
                      alt="معاينة اللوجو"
                    />
                    {logoFile && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => setLogoFile(null)}
                      >
                        إزالة الملف الجديد
                      </button>
                    )}
                  </div>
                )}
              </div>

              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                <Icon name="check" size={14} />
                نشط
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-btn"
                onClick={() => setModalOpen(false)}
              >
                <Icon name="close" size={14} />
                إلغاء
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
              >
                <Icon name="save" size={14} />
                {saving ? "جاري الحفظ..." : "حفظ البراند"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
