"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  buildCategoryFormData,
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategoryTree,
  flattenCategories,
  updateCategory,
  type Category,
  type CategoryFormFields,
} from "@/lib/catalog";

const emptyForm: CategoryFormFields = {
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  display_order: 0,
  is_featured: false,
  is_active: true,
};

function Icon({
  name,
  size = 18,
}: {
  name:
    | "folder"
    | "plus"
    | "search"
    | "refresh"
    | "edit"
    | "trash"
    | "tree"
    | "star"
    | "check"
    | "x"
    | "layers"
    | "link"
    | "image"
    | "sort"
    | "alert"
    | "success"
    | "root"
    | "close"
    | "save";
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
    folder: (
      <svg {...props}>
        <path
          d="M3.5 8.5A2.5 2.5 0 0 1 6 6h3.2l1.5 1.8H18A2.5 2.5 0 0 1 20.5 10.3v6.2A2.5 2.5 0 0 1 18 19H6A2.5 2.5 0 0 1 3.5 16.5v-8z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
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
        <path d="M17.5 3.5V6.8H14M6.5 20.5V17.2H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
    tree: (
      <svg {...props}>
        <path
          d="M12 3v6M8 21v-6h8v6M12 9a4 4 0 1 0 0-0.01"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
    star: (
      <svg {...props}>
        <path
          d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.6 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    check: (
      <svg {...props}>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    x: (
      <svg {...props}>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
    link: (
      <svg {...props}>
        <path
          d="M10 13a4.5 4.5 0 0 0 6.4.4l2.2-2.2a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M14 11a4.5 4.5 0 0 0-6.4-.4L5.4 12.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
    image: (
      <svg {...props}>
        <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" />
        <path d="M4.5 16.5l4.5-4 4 3.5 3-2.5 3.5 3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    sort: (
      <svg {...props}>
        <path d="M8 5v14M8 5l-3 3M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
        <path d="M8.5 12.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    root: (
      <svg {...props}>
        <circle cx="12" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8.2v4.3M8 18v-3.2A2.3 2.3 0 0 1 10.3 12.5h3.4A2.3 2.3 0 0 1 16 14.8V18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    close: (
      <svg {...props}>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
        <path d="M8 5v5h7V5M8 19v-6h8v6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  };

  return icons[name];
}

export default function AdminCategoriesPage() {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("categories.manage");

  const [items, setItems] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormFields>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const parentOptions = useMemo(() => flattenCategories(tree), [tree]);
  const flatTree = useMemo(() => flattenCategories(tree), [tree]);

  const stats = useMemo(() => {
    const active = items.filter((c) => c.is_active !== false).length;
    const featured = items.filter((c) => c.is_featured).length;
    const roots = items.filter((c) => !c.parent_id).length;
    return {
      total: items.length,
      active,
      featured,
      roots,
    };
  }, [items]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [listRes, treeRes] = await Promise.all([
        fetchCategories(accessToken, { page: 1, limit: 100, q: q || undefined }),
        fetchCategoryTree(accessToken),
      ]);
      setItems(listRes.data);
      setTree(treeRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل الأصناف");
    } finally {
      setLoading(false);
    }
  }, [accessToken, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
    setSuccess("");
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug || "",
      description: cat.description || "",
      parent_id: cat.parent_id ?? null,
      display_order: cat.display_order ?? 0,
      is_featured: !!cat.is_featured,
      is_active: cat.is_active !== false,
    });
    setImageFile(null);
    setModalOpen(true);
    setSuccess("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage) return;
    setSaving(true);
    setError("");
    try {
      const formData = buildCategoryFormData(
        {
          name: form.name.trim(),
          slug: form.slug?.trim() || undefined,
          description: form.description?.trim() || undefined,
          parent_id: form.parent_id || null,
          display_order: Number(form.display_order) || 0,
          is_featured: !!form.is_featured,
          is_active: !!form.is_active,
        },
        imageFile,
      );

      if (editing) {
        await updateCategory(accessToken, editing.id, formData);
        setSuccess("تم تحديث الصنف بنجاح");
      } else {
        await createCategory(accessToken, formData);
        setSuccess("تم إضافة الصنف بنجاح");
      }
      setModalOpen(false);
      setImageFile(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حفظ الصنف");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (cat: Category) => {
    if (!accessToken || !canManage) return;
    if (!window.confirm(`حذف الصنف "${cat.name}"؟`)) return;
    setError("");
    try {
      await deleteCategory(accessToken, cat.id);
      setSuccess("تم حذف الصنف");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حذف الصنف");
    }
  };

  return (
    <div className="cat-admin">
      <header className="cat-admin__hero">
        <div className="cat-admin__hero-main">
          <span className="cat-admin__hero-icon" aria-hidden>
            <Icon name="folder" size={26} />
          </span>
          <div>
            <p className="cat-admin__eyebrow">إدارة الكتالوج</p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              التصنيفات
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              نظّم الأقسام الأب والفرعية لعرض أوضح في المتجر ولوحة التحكم.
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
            إضافة صنف
          </button>
        )}
      </header>

      <section className="cat-stats">
        <article className="cat-stat">
          <span className="cat-stat__icon">
            <Icon name="layers" />
          </span>
          <div>
            <p>إجمالي الأصناف</p>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--ok">
            <Icon name="check" />
          </span>
          <div>
            <p>نشطة</p>
            <strong>{stats.active}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--star">
            <Icon name="star" />
          </span>
          <div>
            <p>مميزة</p>
            <strong>{stats.featured}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <span className="cat-stat__icon cat-stat__icon--root">
            <Icon name="root" />
          </span>
          <div>
            <p>أصناف جذر</p>
            <strong>{stats.roots}</strong>
          </div>
        </article>
      </section>

      <div className="cat-toolbar">
        <label className="cat-search">
          <Icon name="search" size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو الـ slug..."
          />
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
          حسابك لا يملك صلاحية التعديل (`categories.manage`).
        </p>
      )}

      <div className="cat-layout">
        <section className="admin-panel cat-list-panel">
          <div className="cat-panel-head">
            <div className="cat-panel-head__title">
              <span className="cat-panel-head__icon">
                <Icon name="layers" size={16} />
              </span>
              <div>
                <h3>قائمة الأصناف</h3>
                <p>{loading ? "جاري التحميل..." : `${items.length} نتيجة`}</p>
              </div>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table cat-table">
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>Slug</th>
                  <th>الأب</th>
                  <th>الترتيب</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="cat-empty">
                        <PageLoader variant="inline" label="جاري تحميل الأصناف" />
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="cat-empty">
                        <Icon name="folder" size={28} />
                        <p>لا توجد أصناف مطابقة</p>
                        {canManage && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary admin-btn--sm"
                            onClick={openCreate}
                          >
                            <Icon name="plus" size={14} />
                            إنشاء أول صنف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((cat) => {
                    const parent = parentOptions.find((p) => p.id === cat.parent_id);
                    return (
                      <tr key={cat.id}>
                        <td>
                          <div className="cat-name-cell">
                            <span className="cat-name-cell__avatar" aria-hidden>
                              {cat.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(cat.image)} alt="" />
                              ) : (
                                <Icon name="folder" size={16} />
                              )}
                            </span>
                            <div className="min-w-0">
                              <strong className="block truncate">{cat.name}</strong>
                              <div className="cat-name-cell__tags">
                                {cat.is_featured ? (
                                  <span className="admin-badge">
                                    <Icon name="star" size={11} />
                                    مميز
                                  </span>
                                ) : null}
                                {!cat.parent_id ? (
                                  <span className="admin-badge admin-badge--muted">
                                    جذر
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="cat-slug" dir="ltr">
                            <Icon name="link" size={13} />
                            {cat.slug}
                          </span>
                        </td>
                        <td>{parent?.name || "—"}</td>
                        <td>
                          <span className="cat-order">
                            <Icon name="sort" size={13} />
                            {cat.display_order ?? 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`cat-status ${
                              cat.is_active === false ? "is-off" : "is-on"
                            }`}
                          >
                            <span className="cat-status__dot" />
                            {cat.is_active === false ? "غير نشط" : "نشط"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm"
                              onClick={() => openEdit(cat)}
                              disabled={!canManage}
                              title="تعديل"
                            >
                              <Icon name="edit" size={14} />
                              تعديل
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => void onDelete(cat)}
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
        </section>

        <section className="admin-panel cat-tree-panel">
          <div className="cat-panel-head">
            <div className="cat-panel-head__title">
              <span className="cat-panel-head__icon">
                <Icon name="tree" size={16} />
              </span>
              <div>
                <h3>شجرة الأصناف</h3>
                <p>هيكل هرمي مباشر</p>
              </div>
            </div>
          </div>

          {flatTree.length === 0 ? (
            <div className="cat-empty cat-empty--compact">
              <Icon name="tree" size={24} />
              <p>لا توجد شجرة بعد</p>
            </div>
          ) : (
            <ul className="cat-tree">
              {flatTree.map((cat) => (
                <li
                  key={cat.id}
                  className="cat-tree__item"
                  style={{ paddingInlineStart: `${cat.depth * 1.15 + 0.15}rem` }}
                >
                  <span className="cat-tree__icon" aria-hidden>
                    {cat.depth === 0 ? (
                      <Icon name="root" size={14} />
                    ) : (
                      <Icon name="folder" size={14} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{cat.name}</p>
                    <p className="truncate text-xs text-ink-muted" dir="ltr">
                      {cat.slug}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      className="cat-tree__edit"
                      onClick={() => openEdit(cat)}
                      aria-label={`تعديل ${cat.name}`}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
                    {editing ? "تعديل صنف" : "إضافة صنف جديد"}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {editing ? `تعديل: ${editing.name}` : "أنشئ قسمًا أو قسمًا فرعيًا"}
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
              <label className="checkout-field">
                <span>الاسم *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: كروت الشاشة"
                />
              </label>
              <label className="checkout-field">
                <span>Slug</span>
                <input
                  dir="ltr"
                  value={form.slug || ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="graphics-cards"
                />
              </label>
              <label className="checkout-field">
                <span>التصنيف الرئيسي (أب)</span>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      parent_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                >
                  <option value="">— تصنيف رئيسي —</option>
                  {parentOptions
                    .filter((p) => !editing || p.id !== editing.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                </select>
                <span className="mt-1 block text-xs text-ink-muted">
                  مثال: إكسسوارات (رئيسي) ← كيبوردات / ماوسات / كراسي (فرعي). المنتجات تُضاف للفرعي فقط.
                </span>
              </label>
              <label className="checkout-field">
                <span>ترتيب العرض</span>
                <input
                  type="number"
                  value={form.display_order ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, display_order: Number(e.target.value) }))
                  }
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
                  placeholder="وصف مختصر يظهر في الإدارة والمتجر"
                />
              </label>
              <div className="checkout-field checkout-field--full">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="image" size={14} />
                  صورة التصنيف
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="cat-file-input"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  تُرفع من الجهاز كـ multipart وتُحفظ في uploads/categories
                </p>
                {(imagePreview || (editing?.image && !imageFile)) && (
                  <div className="cat-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview || mediaUrl(editing?.image)}
                      alt=""
                    />
                    {imageFile && (
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => setImageFile(null)}
                      >
                        إزالة الملف
                      </button>
                    )}
                  </div>
                )}
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={!!form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.checked }))
                  }
                />
                <Icon name="star" size={14} />
                مميز
              </label>
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
                {saving ? "جاري الحفظ..." : "حفظ الصنف"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
