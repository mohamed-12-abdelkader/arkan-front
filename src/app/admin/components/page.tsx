"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  COMPONENT_TYPES,
  SPEC_FIELDS,
  archiveComponent,
  createComponent,
  fetchComponents,
  updateComponent,
  type BuilderComponent,
  type ComponentType,
} from "@/lib/builder-admin";

type FormState = {
  name: string;
  component_type: ComponentType;
  price: string;
  stock: string;
  description: string;
  specs: Record<string, string>;
};

const emptyForm = (): FormState => ({
  name: "",
  component_type: "cpu",
  price: "",
  stock: "10",
  description: "",
  specs: {},
});

function typeLabel(value: string) {
  return COMPONENT_TYPES.find((item) => item.value === value)?.label || value;
}

function money(value: string | number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function AdminComponentsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<BuilderComponent[]>([]);
  const [filter, setFilter] = useState<ComponentType | "">("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<BuilderComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      setItems(await fetchComponents(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل المكونات");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => items.filter((item) => !filter || item.component_type === filter),
    [items, filter],
  );

  const activeCount = items.filter((item) => item.is_active !== false).length;
  const lowStock = items.filter((item) => Number(item.stock) <= 3).length;

  function startEdit(item: BuilderComponent) {
    const specs: Record<string, string> = {};
    for (const field of SPEC_FIELDS[item.component_type]) {
      const value = item.specs?.[field.key];
      specs[field.key] = value == null ? "" : String(value);
    }
    setEditing(item);
    setForm({
      name: item.name,
      component_type: item.component_type,
      price: String(item.price),
      stock: String(item.stock),
      description: item.description || "",
      specs,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const specs: Record<string, string | number> = {};
    for (const field of SPEC_FIELDS[form.component_type]) {
      const raw = form.specs[field.key]?.trim();
      if (!raw) continue;
      specs[field.key] = field.numeric ? Number(raw) : raw;
    }
    const input = {
      name: form.name.trim(),
      component_type: form.component_type,
      price: Number(form.price),
      stock: Number(form.stock || 0),
      description: form.description.trim(),
      specs,
      is_active: true,
    };
    try {
      if (editing) await updateComponent(accessToken, editing.id, input);
      else await createComponent(accessToken, input);
      setSuccess(editing ? "تم تحديث المكوّن" : "تمت إضافة المكوّن");
      setEditing(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حفظ المكوّن");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(item: BuilderComponent) {
    if (!accessToken || !confirm(`أرشفة ${item.name}؟`)) return;
    setError("");
    try {
      await archiveComponent(accessToken, item.id);
      setSuccess("تمت أرشفة المكوّن");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر الأرشفة");
    }
  }

  return (
    <div className="build-admin">
      <header className="cat-admin__hero">
        <div>
          <p className="cat-admin__eyebrow">التجميعات</p>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            مكونات التجميعة
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">
            القطع التي تظهر للعميل عند اختيار مكونات الجهاز. أضف قطعة أو عدّل مواصفاتها من هنا.
          </p>
        </div>
      </header>

      <section className="cat-stats">
        <article className="cat-stat">
          <div>
            <p>كل المكونات</p>
            <strong>{items.length}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <div>
            <p>النشطة</p>
            <strong>{activeCount}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <div>
            <p>مخزون منخفض</p>
            <strong>{lowStock}</strong>
          </div>
        </article>
        <article className="cat-stat">
          <div>
            <p>المعروض الآن</p>
            <strong>{visible.length}</strong>
          </div>
        </article>
      </section>

      {error && <p className="cat-alert cat-alert--error">{error}</p>}
      {success && <p className="cat-alert cat-alert--success">{success}</p>}

      <form onSubmit={onSubmit} className="admin-panel build-form">
        <div className="cat-panel-head">
          <div>
            <h3>{editing ? `تعديل: ${editing.name}` : "مكوّن جديد"}</h3>
            <p>{editing ? "حدّث البيانات ثم احفظ" : "أدخل بيانات القطعة ومواصفاتها"}</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="checkout-field">
            <span>الاسم</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="مثال: Ryzen 5 7600"
            />
          </label>
          <label className="checkout-field">
            <span>نوع المكوّن</span>
            <select
              value={form.component_type}
              onChange={(event) =>
                setForm({
                  ...form,
                  component_type: event.target.value as ComponentType,
                  specs: {},
                })
              }
            >
              {COMPONENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkout-field">
            <span>السعر</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </label>
          <label className="checkout-field">
            <span>المخزون</span>
            <input
              required
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
            />
          </label>
          <label className="checkout-field checkout-field--full">
            <span>الوصف</span>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="وصف مختصر يظهر في الاختيار"
            />
          </label>
          {SPEC_FIELDS[form.component_type].map((field) => (
            <label key={field.key} className="checkout-field">
              <span>{field.label}</span>
              <input
                value={form.specs[field.key] || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    specs: { ...form.specs, [field.key]: event.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>

        <div className="build-form__actions">
          <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
            {saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة المكوّن"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm());
              }}
              className="admin-btn"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      <section className="admin-panel">
        <div className="cat-panel-head">
          <div>
            <h3>قائمة المكونات</h3>
            <p>{loading ? "جاري التحميل..." : `${visible.length} قطعة`}</p>
          </div>
        </div>

        <div className="build-filters" role="tablist" aria-label="تصفية النوع">
          <button
            type="button"
            onClick={() => setFilter("")}
            className={`order-chip ${filter === "" ? "is-active" : ""}`}
          >
            الكل
          </button>
          {COMPONENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFilter(type.value)}
              className={`order-chip ${filter === type.value ? "is-active" : ""}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المكوّن</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="cat-empty">
                      <PageLoader variant="inline" label="جاري تحميل المكونات" />
                    </div>
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="cat-empty">لا توجد مكونات في هذا النوع</div>
                  </td>
                </tr>
              ) : (
                visible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="text-ink">{item.name}</strong>
                      {item.description ? (
                        <p className="build-row__desc">{item.description}</p>
                      ) : null}
                    </td>
                    <td>
                      <span className="order-pill order-pill--info">
                        {typeLabel(item.component_type)}
                      </span>
                    </td>
                    <td className="font-bold text-accent">{money(item.price)}</td>
                    <td>
                      <span
                        className={`order-pill order-pill--sm ${
                          Number(item.stock) <= 3 ? "order-pill--warn" : "order-pill--ok"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="admin-btn admin-btn--sm"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchive(item)}
                          className="admin-btn admin-btn--sm admin-btn--danger"
                        >
                          أرشفة
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
