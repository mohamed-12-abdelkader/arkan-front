import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CatalogBrowse,
  CatalogFiltersShell,
} from "@/components/CatalogBrowse";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  fetchCategory,
  fetchCategoryFilters,
  fetchCategoryProducts,
  fetchHomeCategories,
  toHomeProduct,
  type CategoryFilterMeta,
  type HomeCategory,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    brand_id?: string;
    sort?: string;
    order?: string;
    sort_preset?: string;
    min_price?: string;
    max_price?: string;
    in_stock?: string;
  }>;
};

const SORTS = [
  { id: "newest", label: "الأحدث", sort: "created_at", order: "desc" },
  { id: "price_desc", label: "السعر: من الأعلى", sort: "price", order: "desc" },
  { id: "price_asc", label: "السعر: من الأقل", sort: "price", order: "asc" },
  { id: "name", label: "الاسم", sort: "name", order: "asc" },
] as const;

function sortId(sort?: string, order?: string) {
  return (
    SORTS.find((item) => item.sort === sort && item.order === order)?.id ||
    "newest"
  );
}

function catalogQuery(
  slug: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined> = {},
) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/categories/${slug}${query ? `?${query}` : ""}`;
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const preset = SORTS.find((item) => item.id === sp.sort_preset);
  const activeSort =
    preset ||
    SORTS.find((item) => item.id === sortId(sp.sort, sp.order)) ||
    SORTS[0];
  const filters: Record<string, string | undefined> = {
    brand_id: sp.brand_id || undefined,
    sort: activeSort.id === "newest" ? undefined : activeSort.sort,
    order: activeSort.id === "newest" ? undefined : activeSort.order,
    min_price: sp.min_price || undefined,
    max_price: sp.max_price || undefined,
    in_stock: sp.in_stock === "true" ? "true" : undefined,
  };

  let categoryName = slug;
  let categories: HomeCategory[] = [];

  try {
    const [category, home, filterMeta] = await Promise.all([
      fetchCategory(slug),
      fetchHomeCategories(8).catch(() => [] as HomeCategory[]),
      fetchCategoryFilters(slug).catch(
        () => ({ brands: [], price: { min: 0, max: 0 } }) as CategoryFilterMeta,
      ),
    ]);
    categoryName = category.name;
    categories = Array.isArray(home) ? home : [];

    const result = await fetchCategoryProducts(slug, {
      page,
      limit: 12,
      sort: activeSort.sort,
      order: activeSort.order,
      brand_id: filters.brand_id,
      min_price: filters.min_price,
      max_price: filters.max_price,
      in_stock: filters.in_stock === "true" ? "true" : undefined,
    });
    const products = (result.data || []).map(toHomeProduct);
    const totalPages = result.meta?.totalPages || 1;
    const total = result.meta?.total || products.length;
    const activeBrand = filterMeta.brands.find(
      (brand) => String(brand.id) === filters.brand_id,
    );

    return (
      <>
        <Navbar categories={categories} />
        <main className="catalog-page pb-16">
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
              <Link href="/">الرئيسية</Link>
              <span>/</span>
              <Link href="/#categories">التصنيفات</Link>
              <span>/</span>
              <span className="product-breadcrumb__current">{category.name}</span>
            </nav>

            <header className="catalog-hero">
              <span className="catalog-hero__media">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(category.image)} alt="" />
                ) : (
                  <span>{category.name.slice(0, 1)}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="catalog-hero__eyebrow">التصنيف</p>
                <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                  {category.name}
                </h1>
                {category.description ? (
                  <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                    {category.description}
                  </p>
                ) : null}
              </div>
              <p className="catalog-hero__count">
                <strong>{total}</strong>
                <span>منتج</span>
              </p>
            </header>

            <div className="catalog-layout">
              <CatalogFiltersShell
                activeCount={
                  [
                    filters.brand_id,
                    filters.min_price,
                    filters.max_price,
                    filters.in_stock,
                  ].filter(Boolean).length
                }
              >
                <div className="catalog-filters__head">
                  <h2>تصفية النتائج</h2>
                  <Link href={`/categories/${slug}`} className="catalog-filters__reset">
                    مسح الكل
                  </Link>
                </div>

                <form className="catalog-filters__form" action={`/categories/${slug}`}>
                  <input type="hidden" name="sort_preset" value={activeSort.id} />

                  {filterMeta.brands.length > 0 && (
                    <div className="catalog-section">
                      <p className="catalog-section__title">
                        <span aria-hidden>●</span>
                        البراند
                      </p>
                      <fieldset className="catalog-brands">
                        <legend>البراند</legend>
                        <label className="catalog-brand">
                          <input
                            type="radio"
                            name="brand_id"
                            value=""
                            defaultChecked={!filters.brand_id}
                          />
                          <span className="catalog-brand__name">كل البراندات</span>
                        </label>
                        {filterMeta.brands.map((brand) => (
                          <label key={brand.id} className="catalog-brand">
                            <input
                              type="radio"
                              name="brand_id"
                              value={brand.id}
                              defaultChecked={filters.brand_id === String(brand.id)}
                            />
                            <span className="catalog-brand__logo">
                              {brand.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mediaUrl(brand.logo)} alt="" />
                              ) : (
                                brand.name.slice(0, 1)
                              )}
                            </span>
                            <span className="catalog-brand__name">{brand.name}</span>
                            <em>{brand.products_count}</em>
                          </label>
                        ))}
                      </fieldset>
                    </div>
                  )}

                  <div className="catalog-section catalog-price">
                    <p className="catalog-section__title">
                      <span aria-hidden>●</span>
                      نطاق السعر
                    </p>
                    <div>
                      <label>
                        من
                        <input
                          name="min_price"
                          type="number"
                          min={0}
                          step="1"
                          placeholder={String(Math.floor(filterMeta.price.min || 0))}
                          defaultValue={filters.min_price || ""}
                        />
                      </label>
                      <label>
                        إلى
                        <input
                          name="max_price"
                          type="number"
                          min={0}
                          step="1"
                          placeholder={String(Math.ceil(filterMeta.price.max || 0))}
                          defaultValue={filters.max_price || ""}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="catalog-section">
                    <label className="catalog-stock">
                      <input
                        type="checkbox"
                        name="in_stock"
                        value="true"
                        defaultChecked={filters.in_stock === "true"}
                      />
                      <span className="catalog-stock__switch" aria-hidden />
                      <span>
                        <strong>المتوفر فقط</strong>
                        <small>إخفاء المنتجات غير المتوفرة</small>
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="catalog-apply">
                    عرض النتائج
                  </button>
                </form>
              </CatalogFiltersShell>

              <CatalogBrowse
                summary={
                  <p>
                    {products.length > 0 ? (
                      <>
                        عرض <strong>{products.length}</strong> من{" "}
                        <strong>{total}</strong> منتج
                      </>
                    ) : (
                      "لا توجد نتائج"
                    )}
                  </p>
                }
                sorts={SORTS.map((item) => (
                  <Link
                    key={item.id}
                    href={catalogQuery(slug, filters, {
                      page: undefined,
                      sort: item.id === "newest" ? undefined : item.sort,
                      order: item.id === "newest" ? undefined : item.order,
                    })}
                    className={item.id === activeSort.id ? "is-active" : ""}
                    aria-current={item.id === activeSort.id ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                chips={
                  activeBrand ||
                  filters.min_price ||
                  filters.max_price ||
                  filters.in_stock ? (
                    <div className="catalog-chips">
                      {activeBrand && (
                        <Link
                          href={catalogQuery(slug, filters, {
                            brand_id: undefined,
                            page: undefined,
                          })}
                        >
                          {activeBrand.name}
                          <span aria-hidden>×</span>
                        </Link>
                      )}
                      {(filters.min_price || filters.max_price) && (
                        <Link
                          href={catalogQuery(slug, filters, {
                            min_price: undefined,
                            max_price: undefined,
                            page: undefined,
                          })}
                        >
                          {filters.min_price || "0"} — {filters.max_price || "أي سعر"}
                          <span aria-hidden>×</span>
                        </Link>
                      )}
                      {filters.in_stock && (
                        <Link
                          href={catalogQuery(slug, filters, {
                            in_stock: undefined,
                            page: undefined,
                          })}
                        >
                          المتوفر فقط
                          <span aria-hidden>×</span>
                        </Link>
                      )}
                    </div>
                  ) : null
                }
                empty={
                  products.length === 0 ? (
                    <div className="catalog-empty">
                      <p>لا توجد منتجات مطابقة لهذه التصفية</p>
                      <Link href={`/categories/${slug}`} className="admin-btn">
                        عرض كل منتجات التصنيف
                      </Link>
                    </div>
                  ) : null
                }
                pager={
                  totalPages > 1 ? (
                    <nav className="catalog-pager" aria-label="صفحات المنتجات">
                      <Link
                        href={catalogQuery(slug, filters, {
                          page: page > 1 ? String(page - 1) : undefined,
                        })}
                        className={page <= 1 ? "is-disabled" : ""}
                        aria-disabled={page <= 1}
                      >
                        السابق
                      </Link>
                      {Array.from({ length: totalPages }, (_, index) => index + 1)
                        .filter(
                          (n) =>
                            n === 1 ||
                            n === totalPages ||
                            Math.abs(n - page) <= 1,
                        )
                        .map((n, index, list) => {
                          const prev = list[index - 1];
                          return (
                            <span key={n} className="contents">
                              {prev && n - prev > 1 ? (
                                <span className="catalog-pager__gap">…</span>
                              ) : null}
                              <Link
                                href={catalogQuery(slug, filters, {
                                  page: n === 1 ? undefined : String(n),
                                })}
                                className={n === page ? "is-current" : ""}
                                aria-current={n === page ? "page" : undefined}
                              >
                                {n}
                              </Link>
                            </span>
                          );
                        })}
                      <Link
                        href={catalogQuery(slug, filters, {
                          page:
                            page < totalPages ? String(page + 1) : String(page),
                        })}
                        className={page >= totalPages ? "is-disabled" : ""}
                        aria-disabled={page >= totalPages}
                      >
                        التالي
                      </Link>
                    </nav>
                  ) : null
                }
              >
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </CatalogBrowse>
            </div>
          </div>
        </main>
        <Footer categories={categories} />
      </>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <>
        <Navbar categories={categories} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">{categoryName}</h1>
          <p className="mt-3 text-ink-muted">
            {err instanceof ApiError ? err.message : "تعذر تحميل التصنيف"}
          </p>
          <Link href="/" className="admin-btn mt-6 inline-flex">
            العودة للرئيسية
          </Link>
        </main>
      </>
    );
  }
}
