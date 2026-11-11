import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import type { HomeProduct } from "@/lib/catalog";

type ProductsProps = {
  products: HomeProduct[];
};

export function Products({ products }: ProductsProps) {
  return (
    <section
      id="products"
      className="border-y border-line/80 bg-bg-elevated/55 py-12 sm:py-16"
      aria-labelledby="home-products-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="use-categories__intro home-products-intro">
          <p className="use-categories__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4.5 7.5h15l-1.2 10.2a1.8 1.8 0 0 1-1.8 1.55H7.5a1.8 1.8 0 0 1-1.8-1.55L4.5 7.5z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M9 7.5V6.2a3 3 0 0 1 6 0v1.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            منتجات مميزة
          </p>
          <h2 id="home-products-title" className="font-display use-categories__title">
            اخترنا لك الأفضل
          </h2>
          <p className="use-categories__subtitle">
            سواء للشغل، أو الدراسة، أو الألعاب — بتلقى الجهاز المناسب لك
          </p>
          <a href="#products-grid" className="home-products-cta">
            تسوّق الحين
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>

        {products.length === 0 ? (
          <p className="rounded-xl border border-line bg-bg-elevated/60 px-4 py-10 text-center text-ink-muted">
            حالياً ما فيه منتجات معروضة
          </p>
        ) : (
          <div id="products-grid" className="home-products-grid scroll-mt-28">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={i * 50} variant="up">
                <ProductCard product={product} priority={i < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
