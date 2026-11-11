"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  buildProductFormData,
  createProduct,
  fetchBrands,
  fetchCategoryTree,
  fetchProduct,
  flattenLeafCategories,
  updateProduct,
  type Brand,
  type ProductFormFields,
  type ProductStatus,
} from "@/lib/catalog";

type Props = {
  productId?: string;
};

const empty: ProductFormFields = {
  name: "",
  description: "",
  price: "",
  discount: "",
  cost_price: "",
  stock: "",
  category_id: "",
  brand_id: "",
  status: "active",
};

export function ProductForm({ productId }: Props) {
  const router = useRouter();
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("products.manage");
  const isEdit = !!productId;

  const [form, setForm] = useState<ProductFormFields>(empty);
  const [categories, setCategories] = useState<
    ReturnType<typeof flattenLeafCategories>
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const [tree, brandRes] = await Promise.all([
          fetchCategoryTree(accessToken),
          fetchBrands(accessToken),
        ]);
        setCategories(flattenLeafCategories(tree));
        setBrands(brandRes.data);
      } catch {
        // ignore select load errors
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !productId) return;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetchProduct(accessToken, productId);
        setForm({
          name: p.name || "",
          description: p.description || "",
          price: p.price != null ? String(p.price) : "",
          discount:
            p.discount != null
              ? String(p.discount)
              : p.sale_price != null
                ? String(p.sale_price)
                : "",
          cost_price: p.cost_price != null ? String(p.cost_price) : "",
          stock: p.stock != null ? String(p.stock) : "",
          category_id: p.category_id ?? "",
          brand_id: p.brand_id ?? "",
          status: (p.status as ProductStatus) || "active",
        });

        const urls: string[] = [];
        if (p.images?.length) {
          for (const img of p.images) {
            if (img.url) urls.push(mediaUrl(img.url));
          }
        } else if (p.image) {
          urls.push(mediaUrl(p.image));
        }
        setExistingImages(urls);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "تعذر تحميل المنتج");
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, productId]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  const title = useMemo(
    () => (isEdit ? "تعديل منتج" : "إضافة منتج"),
    [isEdit],
  );

  const onFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !canManage) return;
    if (!form.name.trim()) {
      setError("اسم المنتج مطلوب");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const formData = buildProductFormData(form, files);

      if (isEdit && productId) {
        await updateProduct(accessToken, Number(productId), formData);
        router.push("/admin/products");
      } else {
        const created = await createProduct(accessToken, formData);
        router.push(`/admin/products/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر حفظ المنتج");
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="جاري تحميل المنتج" />;
  }

  return (
    <form className="admin-page product-form" onSubmit={onSubmit}>
      <div className="admin-page__head">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {isEdit
              ? `PUT /products/${productId} · multipart/form-data`
              : "POST /products · multipart/form-data"}
          </p>
        </div>
        <Link href="/admin/products" className="admin-btn">
          رجوع للقائمة
        </Link>
      </div>

      {!canManage && (
        <p className="admin-hint">حسابك لا يملك صلاحية `products.manage`.</p>
      )}
      {error && <p className="checkout-error">{error}</p>}

      <section className="admin-panel">
        <div className="admin-form-grid">
          <label className="checkout-field checkout-field--full">
            <span>اسم المنتج *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ASUS RTX 4070"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field checkout-field--full">
            <span>الوصف</span>
            <textarea
              rows={4}
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="وصف اختياري للمنتج"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field">
            <span>السعر</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="28500"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field">
            <span>سعر الخصم (discount)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.discount ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount: e.target.value }))
              }
              placeholder="26900"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field">
            <span>سعر التكلفة</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.cost_price ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, cost_price: e.target.value }))
              }
              placeholder="24000"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field">
            <span>المخزون</span>
            <input
              type="number"
              min={0}
              step="1"
              value={form.stock ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              placeholder="15"
              disabled={!canManage}
            />
          </label>

          <label className="checkout-field">
            <span>التصنيف الفرعي</span>
            <select
              value={form.category_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category_id: e.target.value || "",
                }))
              }
              disabled={!canManage}
            >
              <option value="">— بدون —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-muted">
              لو التصنيف الرئيسي فيه أقسام فرعية (مثل إكسسوارات ← كيبوردات)، المنتج يُضاف للفرعي فقط.
            </span>
          </label>

          <label className="checkout-field">
            <span>البراند</span>
            <select
              value={form.brand_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  brand_id: e.target.value || "",
                }))
              }
              disabled={!canManage}
            >
              <option value="">— بدون —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="checkout-field">
            <span>الحالة</span>
            <select
              value={form.status || "active"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as ProductStatus,
                }))
              }
              disabled={!canManage}
            >
              <option value="active">منشور (active)</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </select>
          </label>

          <div className="checkout-field checkout-field--full">
            <span>صور المنتج (من الجهاز)</span>
            <label className={`product-upload ${!canManage ? "is-disabled" : ""}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFilesChange}
                disabled={!canManage}
              />
              <span className="product-upload__box">
                <strong>اختر صورًا من الجهاز</strong>
                <em>يمكن رفع أكثر من صورة — تُحفظ في uploads/products</em>
              </span>
            </label>

            {isEdit && existingImages.length > 0 && files.length === 0 && (
              <div className="product-upload__preview">
                <p className="product-upload__label">الصور الحالية</p>
                <div className="product-upload__grid">
                  {existingImages.map((src) => (
                    <div key={src} className="product-upload__thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previews.length > 0 && (
              <div className="product-upload__preview">
                <p className="product-upload__label">
                  صور جديدة ({previews.length})
                </p>
                <div className="product-upload__grid">
                  {previews.map((src, i) => (
                    <div key={`${src}-${i}`} className="product-upload__thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                      <button
                        type="button"
                        className="product-upload__remove"
                        onClick={() => removeFile(i)}
                        aria-label="إزالة الصورة"
                      >
                        ×
                      </button>
                      <span className="product-upload__name">{files[i]?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-modal__actions mt-6">
          <Link href="/admin/products" className="admin-btn">
            إلغاء
          </Link>
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={saving || !canManage}
          >
            {saving ? "جاري الرفع والحفظ..." : isEdit ? "حفظ التعديلات" : "إنشاء المنتج"}
          </button>
        </div>
      </section>
    </form>
  );
}
