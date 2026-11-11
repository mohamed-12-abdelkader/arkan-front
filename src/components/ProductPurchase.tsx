"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart, type CartProductSnapshot } from "@/lib/cart";

type ProductPurchaseProps = {
  productId: string;
  price: number;
  oldPrice?: number;
  discountPercent: number;
  available: number;
  snapshot: CartProductSnapshot;
};

const FAVORITES_KEY = "arkan-favorites";

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

export function ProductPurchase({
  productId,
  price,
  oldPrice,
  discountPercent,
  available,
  snapshot,
}: ProductPurchaseProps) {
  const { addItem } = useCart();
  const { canAccessDashboard, loading } = useAuth();
  const [qty, setQty] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [heartPop, setHeartPop] = useState(false);
  const outOfStock = available <= 0;
  const maxQty = Math.max(1, Math.min(99, available || 1));
  const isAdmin = !loading && canAccessDashboard;

  useEffect(() => {
    setFavorite(readFavorites().includes(productId));
  }, [productId]);

  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

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
    if (outOfStock || isAdmin || busy) return;
    setBusy(true);
    setError("");
    try {
      await addItem(productId, qty, snapshot);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر الإضافة للسلة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="product-purchase">
      <div className="product-purchase__price">
        <div className="product-purchase__price-row">
          <span className="product-purchase__amount">{formatMoney(price)}</span>
          {oldPrice != null && oldPrice > price && (
            <span className="product-purchase__old">{formatMoney(oldPrice)}</span>
          )}
          {discountPercent > 0 && (
            <span className="product-pill product-pill--deal">
              وفر {discountPercent}%
            </span>
          )}
        </div>
        <p className="product-purchase__note">
          السعر الفعلي بعد الخصم · الدفع عند الاستلام
        </p>
      </div>

      {isAdmin ? (
        <div className="product-admin-cta">
          <p>أنت مسجّل كمسؤول — عرض المنتج فقط بدون شراء.</p>
          <Link
            href={`/admin/products/${productId}`}
            className="product-cta product-cta--admin"
          >
            تعديل المنتج
          </Link>
        </div>
      ) : (
        <>
          <div className="product-purchase__qty">
            <span className="text-sm font-medium text-ink-muted">الكمية</span>
            <div className="qty-control" role="group" aria-label="اختيار الكمية">
              <button
                type="button"
                aria-label="إنقاص الكمية"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1 || outOfStock}
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label="زيادة الكمية"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={outOfStock || qty >= maxQty}
              >
                +
              </button>
            </div>
          </div>

          {error && <p className="checkout-error mt-3">{error}</p>}

          <div className="product-purchase__actions">
            <button
              type="button"
              onClick={() => void addToCart()}
              disabled={outOfStock || loading || busy}
              className={`btn-shine product-cta ${added ? "product-cta--done" : ""}`}
            >
              {outOfStock
                ? "غير متوفر"
                : busy
                  ? "جاري..."
                  : added
                    ? "تمت الإضافة"
                    : "أضف للسلة"}
            </button>

            <Link
              href={`/buy-now/${productId}?qty=${qty}`}
              className={`product-cta product-cta--ghost ${outOfStock ? "pointer-events-none opacity-50" : ""}`}
              aria-disabled={outOfStock}
            >
              اشترِ الآن
            </Link>

            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              aria-pressed={favorite}
              className={`product-action-btn product-action-btn--lg ${
                favorite ? "product-action-btn--active" : ""
              } ${heartPop ? "is-popping" : ""}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.7 4.05 5.15A4.8 4.8 0 0 1 12 6.9a4.8 4.8 0 0 1 7.95-1.75c2.85 1.55 3.25 5.05 1.38 7.75C18.7 16.65 12 21 12 21z"
                  fill={favorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
