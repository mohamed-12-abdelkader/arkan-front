import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductAdminFacts } from "@/components/ProductAdminFacts";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { Reveal } from "@/components/Reveal";
import { ApiError, formatMoney, mediaUrl } from "@/lib/api";
import { fetchProduct, type ProductVariant } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function toNumber(value: string | number | null | undefined) {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function variantAttrs(attrs?: Record<string, unknown> | null) {
  if (!attrs || typeof attrs !== "object") return "—";
  const parts = Object.entries(attrs).map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(" · ") : "—";
}

const trustItems = [
  {
    title: "توصيل سريع",
    desc: "خلال 1–3 أيام عمل",
    icon: (
      <path
        d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "ضمان أصلي",
    desc: "سنة على عيوب الصناعة",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "دفع آمن",
    desc: "بطاقة · تحويل · عند الاستلام",
    icon: (
      <path
        d="M4 8h16v10H4V8zm0 3h16M8 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "إرجاع سهل",
    desc: "خلال 7 أيام",
    icon: (
      <path
        d="M4 12a8 8 0 1 0 2.3-5.6M4 5v4h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
] as const;

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  let product;
  try {
    product = await fetchProduct(null, id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  if (!product) notFound();

  const listPrice = toNumber(product.price);
  const effective = toNumber(product.effective_price ?? product.price);
  const discountAmount = toNumber(product.discount);
  const oldPrice =
    listPrice > effective
      ? listPrice
      : discountAmount > 0 && discountAmount < listPrice
        ? listPrice
        : undefined;
  const discountPercent =
    oldPrice && oldPrice > effective
      ? Math.round(((oldPrice - effective) / oldPrice) * 100)
      : 0;

  const stock = product.stock ?? 0;
  const available = product.available_stock ?? stock;
  const inStock = available > 0;
  const brand = product.brand;
  const category = product.category;
  const variants: ProductVariant[] = product.variants ?? [];
  const description =
    product.description?.trim() ||
    product.short_description?.trim() ||
    "لا يوجد وصف لهذا المنتج حاليًا.";
  const badge =
    discountPercent > 0
      ? `خصم ${discountPercent}%`
      : product.is_featured
        ? "مميز"
        : undefined;

  const cartImage =
    mediaUrl(product.image) || mediaUrl(product.images?.[0]?.url) || "";

  const stockRatio =
    stock > 0 ? Math.min(100, Math.round((available / stock) * 100)) : 0;

  return (
    <>
      <Navbar />
      <main className="product-page pb-20">
        <div className="product-page__atmosphere" aria-hidden />
        <div className="product-page__grid" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            <span aria-hidden>/</span>
            {category && (
              <>
                <Link href={`/#category-${category.id}`}>{category.name}</Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span className="product-breadcrumb__current">{product.name}</span>
          </nav>

          <section className="product-hero">
            <Reveal variant="scale" className="min-w-0">
              <ProductGallery
                name={product.name}
                image={product.image}
                images={product.images}
                badge={badge}
              />
            </Reveal>

            <Reveal variant="left" delay={80} className="min-w-0">
              <div className="product-info">
                <div className="product-info__meta">
                  {category && (
                    <Link
                      href={`/#category-${category.id}`}
                      className="product-pill product-pill--cat"
                    >
                      {category.name}
                    </Link>
                  )}
                  {brand && (
                    <span className="product-pill product-pill--brand">
                      {brand.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(brand.logo)} alt="" />
                      ) : null}
                      {brand.name}
                    </span>
                  )}
                  <span
                    className={`product-stock ${inStock ? "" : "product-stock--out"}`}
                  >
                    <span className="product-stock__dot" />
                    {inStock ? "متوفر للطلب" : "غير متوفر"}
                  </span>
                </div>

                <h1 className="product-info__title">{product.name}</h1>

                {(product.sku || product.slug) && (
                  <div className="product-info__codes">
                    {product.sku && (
                      <span>
                        SKU <b dir="ltr">{product.sku}</b>
                      </span>
                    )}
                    {product.slug && (
                      <span dir="ltr" className="product-info__slug">
                        {product.slug}
                      </span>
                    )}
                  </div>
                )}

                <p className="product-info__lead">{description}</p>

                <div className="product-stats">
                  <div className="product-stat">
                    <span>المخزون</span>
                    <strong>{stock}</strong>
                  </div>
                  <div className="product-stat">
                    <span>المتاح</span>
                    <strong className={inStock ? "text-ok" : "text-danger"}>
                      {available}
                    </strong>
                  </div>
                  <div className="product-stat product-stat--wide">
                    <span>جاهزية التوفر</span>
                    <div className="product-stock-bar" aria-hidden>
                      <i style={{ width: `${stockRatio}%` }} />
                    </div>
                  </div>
                </div>

                <ProductPurchase
                  productId={String(product.id)}
                  price={effective}
                  oldPrice={oldPrice}
                  discountPercent={discountPercent}
                  available={available}
                  snapshot={{
                    name: product.name,
                    price: effective,
                    image: cartImage,
                  }}
                />

                <ProductAdminFacts
                  costPrice={product.cost_price}
                  status={product.status}
                />

                <Link href="/#products" className="product-back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 5l-7 7 7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  العودة لكل المنتجات
                </Link>
              </div>
            </Reveal>
          </section>

          <Reveal className="mt-10">
            <ul className="product-trust">
              {trustItems.map((item) => (
                <li key={item.title}>
                  <span className="product-trust__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                      {item.icon}
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="product-panels mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal variant="up">
              <section className="product-panel">
                <header className="product-panel__head">
                  <h2>وصف المنتج</h2>
                  <p>تفاصيل الاستخدام والمواصفات العامة.</p>
                </header>
                <div className="product-panel__body product-panel__body--prose">
                  <p>{description}</p>
                </div>
              </section>
            </Reveal>

            <Reveal variant="up" delay={100}>
              <section className="product-panel product-panel--specs">
                <header className="product-panel__head">
                  <h2>ملخص الأسعار</h2>
                  <p>الأسعار والتصنيف المرتبط بهذا المنتج.</p>
                </header>
                <dl className="product-specs">
                  <div className="product-specs__row">
                    <dt>السعر الأساسي</dt>
                    <dd>{formatMoney(listPrice)}</dd>
                  </div>
                  <div className="product-specs__row">
                    <dt>الخصم</dt>
                    <dd>
                      {discountAmount > 0 ? formatMoney(discountAmount) : "—"}
                    </dd>
                  </div>
                  <div className="product-specs__row product-specs__row--accent">
                    <dt>السعر الفعلي</dt>
                    <dd>{formatMoney(effective)}</dd>
                  </div>
                  <div className="product-specs__row">
                    <dt>البراند</dt>
                    <dd>{brand?.name || product.brand_name || "—"}</dd>
                  </div>
                  <div className="product-specs__row">
                    <dt>التصنيف</dt>
                    <dd>{category?.name || product.category_name || "—"}</dd>
                  </div>
                </dl>
              </section>
            </Reveal>
          </div>

          {variants.length > 0 && (
            <section className="mt-14">
              <Reveal className="mb-6">
                <div className="product-section-head">
                  <div>
                    <h2>المتغيرات</h2>
                    <p>خيارات المنتج المتاحة ({variants.length}).</p>
                  </div>
                </div>
              </Reveal>
              <div className="product-variant-grid">
                {variants.map((v, i) => (
                  <Reveal key={v.id} delay={i * 50} variant="up">
                    <article
                      className={`product-variant-card ${
                        v.is_active === false ? "is-inactive" : ""
                      }`}
                    >
                      <header>
                        <h3>{v.name}</h3>
                        {v.is_active === false && (
                          <span className="product-pill">غير نشط</span>
                        )}
                      </header>
                      <p className="product-variant-card__sku" dir="ltr">
                        {v.sku || "—"}
                      </p>
                      <p className="product-variant-card__attrs">
                        {variantAttrs(v.attributes)}
                      </p>
                      <footer>
                        <strong>
                          {v.price != null && v.price !== ""
                            ? formatMoney(v.price)
                            : "—"}
                        </strong>
                        <span>مخزون {v.stock ?? 0}</span>
                      </footer>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
