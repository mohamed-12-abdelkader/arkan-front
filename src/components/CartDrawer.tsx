"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/PageLoader";
import { formatMoney } from "@/lib/api";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const router = useRouter();
  const {
    isOpen,
    closeCart,
    lines,
    totalCount,
    totalPrice,
    setQty,
    removeItem,
    error,
    loading,
  } = useCart();

  const clearAll = async () => {
    for (const line of [...lines]) {
      await removeItem(line.lineId);
    }
  };

  const goCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  return (
    <div className={`cart-drawer ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className="cart-drawer__backdrop"
        aria-label="إغلاق السلة"
        onClick={closeCart}
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        className="cart-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="سلة التسوق"
      >
        <header className="cart-drawer__head">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">سلة التسوق</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {totalCount > 0 ? `${totalCount} منتجات` : "السلة فارغة"}
            </p>
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            aria-label="إغلاق"
            onClick={closeCart}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="cart-drawer__body">
          {error && (
            <p className="checkout-error mx-4 mt-3 mb-0">{error}</p>
          )}
          {loading && lines.length === 0 ? (
            <div className="cart-drawer__empty">
              <PageLoader variant="inline" label="جاري تحميل السلة" />
            </div>
          ) : lines.length === 0 ? (
            <div className="cart-drawer__empty">
              <span className="cart-drawer__empty-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3.5 5h1.6l1.2 10.2a1.8 1.8 0 0 0 1.8 1.6h8.7a1.8 1.8 0 0 0 1.75-1.4L20.5 8H7.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="20" r="1.35" fill="currentColor" />
                  <circle cx="17" cy="20" r="1.35" fill="currentColor" />
                </svg>
              </span>
              <p className="mt-3 font-semibold text-ink">ما في منتجات في السلة</p>
              <p className="mt-1 text-sm text-ink-muted">
                ابدأ التسوق وأضف ما يعجبك من المنتجات.
              </p>
              <Link href="/#products" className="cart-drawer__shop" onClick={closeCart}>
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <ul className="cart-drawer__list">
              {lines.map(({ lineId, product, qty, lineTotal }) => (
                <li key={lineId} className="cart-line">
                  <Link
                    href={`/products/${product.id}`}
                    className="cart-line__media"
                    onClick={closeCart}
                  >
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : null}
                  </Link>

                  <div className="cart-line__info">
                    <Link
                      href={`/products/${product.id}`}
                      className="cart-line__name"
                      onClick={closeCart}
                    >
                      {product.name}
                    </Link>
                    <p className="cart-line__price">{formatMoney(product.price)}</p>

                    <div className="cart-line__row">
                      <div className="qty-control qty-control--sm" role="group">
                        <button
                          type="button"
                          aria-label="إنقاص الكمية"
                          onClick={() => void setQty(lineId, qty - 1)}
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          aria-label="زيادة الكمية"
                          onClick={() => void setQty(lineId, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-accent">
                        {formatMoney(lineTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cart-line__remove"
                    aria-label={`حذف ${product.name}`}
                    onClick={() => void removeItem(lineId)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="cart-drawer__foot">
            <div className="cart-drawer__total">
              <span className="text-ink-muted">الإجمالي</span>
              <span className="font-display text-2xl font-bold text-accent">
                {formatMoney(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              className="btn-shine cart-drawer__checkout"
              onClick={goCheckout}
            >
              إتمام الطلب
            </button>
            <button
              type="button"
              className="cart-drawer__clear"
              onClick={() => void clearAll()}
            >
              تفريغ السلة
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
