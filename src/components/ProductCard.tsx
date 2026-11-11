"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import type { HomeProduct } from "@/lib/catalog";

type ProductCardProps = {
  product: HomeProduct;
  priority?: boolean;
};

const FAVORITES_KEY = "arkan-favorites";

function toNumber(value: string | number | null | undefined) {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function pickSpecChips(specs?: Record<string, unknown> | null) {
  if (!specs || typeof specs !== "object") return [];
  const preferred = ["cpu", "processor", "gpu", "graphics", "ram", "storage", "ssd"];
  const entries = Object.entries(specs)
    .map(([key, value]) => {
      const text =
        value == null
          ? ""
          : typeof value === "object"
            ? ""
            : String(value).trim();
      return { key: key.toLowerCase(), text };
    })
    .filter((e) => e.text.length > 0);

  const ranked = [
    ...preferred
      .map((k) => entries.find((e) => e.key === k || e.key.includes(k)))
      .filter(Boolean),
    ...entries,
  ].filter((e, i, arr) => e && arr.findIndex((x) => x?.text === e.text) === i) as Array<{
    key: string;
    text: string;
  }>;

  return ranked.slice(0, 2).map((e) => e.text);
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { canAccessDashboard, loading } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  const productId = String(product.id);
  const href = `/products/${product.slug || product.id}`;
  const listPrice = toNumber(product.price);
  const effective = toNumber(product.effective_price ?? product.discount ?? product.price);
  const oldPrice = listPrice > effective ? listPrice : undefined;
  const saved = oldPrice != null ? oldPrice - effective : 0;
  const discountPercent =
    oldPrice && oldPrice > effective
      ? Math.round(((oldPrice - effective) / oldPrice) * 100)
      : 0;
  const image = mediaUrl(product.image);
  const isAdmin = !loading && canAccessDashboard;
  const outOfStock = (product.available_stock ?? 1) <= 0;
  const isNew = !product.condition || product.condition === "new";
  const brandName = product.brand_name?.trim() || "";
  const description =
    product.short_description?.trim() ||
    product.description?.trim() ||
    "";
  const specs = pickSpecChips(product.specs);

  useEffect(() => {
    setFavorite(readFavorites().includes(productId));
  }, [productId]);

  const toggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    setHeartPop(true);
    window.setTimeout(() => setHeartPop(false), 420);

    const current = readFavorites();
    writeFavorites(
      next
        ? Array.from(new Set([...current, productId]))
        : current.filter((id) => id !== productId),
    );
  };

  const addToCart = async () => {
    if (isAdmin || outOfStock) return;
    try {
      await addItem(productId, 1, {
        name: product.name,
        price: effective,
        image,
      });
      setCartPulse(true);
      window.setTimeout(() => setCartPulse(false), 520);
    } catch {
      // السلة تعرض الخطأ عبر الـ API message في الـ drawer عند الحاجة
    }
  };

  return (
    <article className="product-card group flex h-full flex-col overflow-hidden">
      <div className="product-card__media">
        <Link href={href} className="product-card__media-link" tabIndex={-1}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <span className="product-card__no-image">لا توجد صورة</span>
          )}
        </Link>

        {discountPercent > 0 ? (
          <span className="product-card__discount" aria-label={`خصم ${discountPercent}%`}>
            {discountPercent}%-
          </span>
        ) : null}

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          aria-pressed={favorite}
          className={`product-card__fav ${favorite ? "is-active" : ""} ${
            heartPop ? "is-popping" : ""
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.7 4.05 5.15A4.8 4.8 0 0 1 12 6.9a4.8 4.8 0 0 1 7.95-1.75c2.85 1.55 3.25 5.05 1.38 7.75C18.7 16.65 12 21 12 21z"
              fill={favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {outOfStock ? (
          <span className="product-card__stockout">نفد</span>
        ) : product.is_featured ? (
          <span className="product-card__grade">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.2 7.8 16l.8-4.7L5.2 8l4.7-.7L12 3z"
                fill="currentColor"
              />
            </svg>
            مميز
          </span>
        ) : null}
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          {isNew ? <span className="product-card__chip">جديد</span> : <span />}
          {brandName ? <span className="product-card__brand">{brandName}</span> : null}
        </div>

        <Link href={href} className="product-card__title">
          {product.name}
        </Link>

        {specs.length > 0 ? (
          <div className="product-card__specs">
            {specs.map((spec) => (
              <span key={spec} className="product-card__spec">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M4 12h10M4 17h7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {spec}
              </span>
            ))}
          </div>
        ) : null}

        {description ? <p className="product-card__desc">{description}</p> : null}

        <div className="product-card__pricing">
          {oldPrice != null ? (
            <span className="product-card__old">{formatMoney(oldPrice)}</span>
          ) : null}
          <span className="product-card__price">{formatMoney(effective)}</span>
          {saved > 0 ? (
            <span className="product-card__save">وفّرت {formatMoney(saved)}</span>
          ) : null}
        </div>

        <div className="product-card__actions">
          {!isAdmin ? (
            <button
              type="button"
              onClick={() => void addToCart()}
              disabled={outOfStock || loading}
              aria-label={outOfStock ? "غير متوفر" : "حط في السلة"}
              title={outOfStock ? "غير متوفر" : "حط في السلة"}
              className={`product-card__cart-btn ${cartPulse ? "is-cart-pulse" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 8h12l-1 11H7L6 8z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 8V7a3 3 0 0 1 6 0v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
          <Link href={href} className="product-card__details">
            شوف التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}
