import Link from "next/link";

import { Reveal } from "@/components/Reveal";
import { mediaUrl } from "@/lib/api";
import { brandPath, type Brand } from "@/lib/catalog";

type BrandsProps = {
  brands: Brand[];
};

/** Repeat brands until the sequence is long enough for a gap-free marquee. */
function buildMarqueeSequence(brands: Brand[], minItems = 14) {
  if (!brands.length) return [];
  const sequence: Brand[] = [];
  while (sequence.length < minItems) {
    sequence.push(...brands);
  }
  return sequence;
}

function BrandTile({
  brand,
  tabIndex,
}: {
  brand: Brand;
  tabIndex?: number;
}) {
  const logo = mediaUrl(brand.logo);
  const initial = (brand.name || "?").trim().charAt(0);

  return (
    <Link
      href={brandPath(brand)}
      className="brand-card"
      title={brand.name}
      tabIndex={tabIndex}
    >
      <span className="brand-card__logo">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" />
        ) : (
          <span className="brand-card__initial" aria-hidden>
            {initial}
          </span>
        )}
      </span>
      <span className="brand-card__name">{brand.name}</span>
    </Link>
  );
}

export function Brands({ brands }: BrandsProps) {
  if (!brands.length) return null;

  const sequence = buildMarqueeSequence(brands, 14);

  return (
    <section
      id="brands"
      className="brands-home"
      aria-labelledby="brands-home-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="use-categories__intro home-products-intro">
          <p className="use-categories__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7.5h16v10.2A1.8 1.8 0 0 1 18.2 19.5H5.8A1.8 1.8 0 0 1 4 17.7V7.5z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M8 7.5V6.2a4 4 0 0 1 8 0v1.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            شركاؤنا
          </p>
          <h2 id="brands-home-title" className="font-display use-categories__title">
            العلامات التجارية
          </h2>
          <p className="use-categories__subtitle">
            سواء للشغل، أو الدراسة، أو الألعاب — بتلقى الجهاز المناسب لك
          </p>
          <p className="brands-home__tagline">نتعامل مع الأفضل بس</p>
        </Reveal>
      </div>

      <div className="brands-marquee" aria-label="العلامات التجارية">
        <div className="brands-marquee-track">
          <div className="brands-marquee-group">
            {sequence.map((brand, index) => (
              <BrandTile key={`a-${brand.id}-${index}`} brand={brand} />
            ))}
          </div>
          <div className="brands-marquee-group" aria-hidden>
            {sequence.map((brand, index) => (
              <BrandTile
                key={`b-${brand.id}-${index}`}
                brand={brand}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
