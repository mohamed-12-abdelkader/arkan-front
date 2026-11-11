"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, formatMoney, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  deleteProduct,
  fetchCategoryTree,
  fetchProducts,
  flattenCategories,
  productStatusLabels,
  updateProductStatus,
  type Product,
  type ProductStatus,
} from "@/lib/catalog";

export default function AdminProductsPage() {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("products.manage");

  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    ReturnType<typeof flattenCategories>
  >([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchProducts(accessToken, {
        page,
        limit: 20,
        q: q || undefined,
        status: status || undefined,
        category_id: categoryId || undefined,
        sort: "created_at",
        order: "desc",
      });
      setItems(res.data);
      setTotalPages(res.meta.totalPages || 1);
      setTotal(res.meta.total || res.data.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, q, status, categoryId]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchCategoryTree(accessToken)
      .then((tree) => setCategories(flattenCategories(tree)))
      .catch(() => setCategories([]));
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPublish = async (product: Product) => {
    if (!accessToken || !canManage) return;
    try {
      await updateProductStatus(accessToken, product.id, "active");
      setSuccess("تم نشر المنتج");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر النشر");
    }
  };

  const onDelete = async (permanent: boolean) => {
    if (!accessToken || !canManage || !deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteProduct(accessToken, deleteTarget.id, { permanent });
      setSuccess(
        permanent
          ? "تم الحذف النهائي للمنتج"
          : "تم أرشفة المنتج وإخفاؤه من المتجر",
      );
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : permanent
            ? "تعذر الحذف النهائي (قد يكون مستخدمًا في طلبات أو تجميعات)"
            : "تعذر أرشفة المنتج",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">المنتجات</h2>
          <p className="mt-1 text-sm text-ink-muted">
            إدارة الكتالوج عبر `/products` — الإجمالي: {total}
          </p>
        </div>
        {canManage && (
          <Link href="/admin/products/new" className="admin-btn admin-btn--primary">
            + إضافة منتج
          </Link>
        )}
      </div>

      <div className="admin-filters">
        <label>
          بحث
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="اسم / SKU"
          />
        </label>
        <label>
          الحالة
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="active">منشور</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>
        </label>
        <label>
          التصنيف
          <select
            value={categoryId}
            onChange={(e) => {
              setPage(1);
              setCategoryId(e.target.value);
            }}
          >
            <option value="">الكل</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="admin-refresh" onClick={() => void load()}>
          تحديث
        </button>
      </div>

      {error && <p className="checkout-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}
      {!canManage && (
        <p className="admin-hint">حسابك لا يملك صلاحية `products.manage` للتعديل.</p>
      )}

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>SKU</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <PageLoader variant="inline" label="جاري تحميل المنتجات" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-ink-muted">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const st = (p.status || "active") as ProductStatus;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link
                          href={`/products/${p.id}`}
                          className="admin-product-cell admin-product-cell--link"
                        >
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaUrl(p.image)}
                              alt=""
                              className="admin-product-thumb"
                            />
                          ) : (
                            <span className="admin-product-thumb admin-product-thumb--empty" />
                          )}
                          <div className="min-w-0">
                            <strong className="block truncate">{p.name}</strong>
                            {p.is_featured ? (
                              <span className="admin-badge">مميز</span>
                            ) : null}
                          </div>
                        </Link>
                      </td>
                      <td dir="ltr">{p.sku || "—"}</td>
                      <td>{p.category_name || "—"}</td>
                      <td>
                        {formatMoney(p.effective_price ?? p.price)}
                      </td>
                      <td>
                        {p.available_stock ?? p.stock ?? 0}
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            st === "archived"
                              ? "admin-badge--muted"
                              : st === "draft"
                                ? "admin-badge--warn"
                                : ""
                          }`}
                        >
                          {productStatusLabels[st] || st}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="admin-btn admin-btn--sm"
                          >
                            تعديل
                          </Link>
                          {st === "draft" && canManage && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--primary"
                              onClick={() => void onPublish(p)}
                            >
                              نشر
                            </button>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => {
                                setSuccess("");
                                setError("");
                                setDeleteTarget(p);
                              }}
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {deleteTarget && (
        <div className="admin-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="admin-modal__backdrop"
            aria-label="إغلاق"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="admin-modal__panel product-delete-modal">
            <h3 className="font-display text-xl font-bold text-ink">
              حذف المنتج
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              اختر نوع الحذف لـ{" "}
              <strong className="text-ink">{deleteTarget.name}</strong>
            </p>

            <div className="product-delete-options">
              <button
                type="button"
                className="product-delete-option product-delete-option--soft"
                disabled={deleting}
                onClick={() => void onDelete(false)}
              >
                <span className="product-delete-option__badge">موصى به</span>
                <strong>حذف عادي (أرشفة)</strong>
                <em>
                  يخفي المنتج من المتجر (`archived`) ويحافظ على الطلبات القديمة.
                </em>
                <code dir="ltr">DELETE /products/{deleteTarget.id}</code>
              </button>

              <button
                type="button"
                className="product-delete-option product-delete-option--hard"
                disabled={deleting}
                onClick={() => {
                  if (
                    window.confirm(
                      "تأكيد الحذف النهائي؟ لا يمكن التراجع. يفشل إن كان المنتج مستخدمًا في طلبات أو تجميعات PC.",
                    )
                  ) {
                    void onDelete(true);
                  }
                }}
              >
                <strong>حذف نهائي</strong>
                <em>
                  يُحذف من قاعدة البيانات فقط إذا لم يُستخدم في طلبات أو تجميعات.
                </em>
                <code dir="ltr">
                  DELETE /products/{deleteTarget.id}?permanent=true
                </code>
              </button>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-btn"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
