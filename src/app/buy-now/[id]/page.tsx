"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { ApiError, formatMoney, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PayAgainButton } from "@/components/PayAgainButton";
import {
  PaymentMethodPicker,
  type StorePaymentMethod,
} from "@/components/PaymentMethodPicker";
import {
  buyNowOrder,
  goToPaymob,
  orderCheckoutUrl,
  orderPaymentError,
  rememberPaymentContext,
} from "@/lib/commerce";
import { fetchProduct, type Product } from "@/lib/catalog";
import { validateCoupon, type CouponValidateResult } from "@/lib/coupons";

function BuyNowInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState("");
  const [qty, setQty] = useState(Number(search.get("qty") || 1) || 1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidateResult | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [unpaidOrder, setUnpaidOrder] = useState<{
    orderNumber: string;
    phone: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchProduct(null, params.id);
        if (!cancelled) setProduct(p);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "تعذر تحميل المنتج",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    setName((n) => n || user.name || "");
    setPhone((p) => p || user.phone || "");
  }, [user]);

  const effective = Number(
    product?.effective_price ?? product?.price ?? 0,
  );
  const subtotal = effective * qty;
  const discount = appliedCoupon
    ? Number(appliedCoupon.discount) || 0
    : 0;
  const totalAfter = Math.max(0, subtotal - discount);
  const image = mediaUrl(product?.image);

  const onApplyCoupon = async () => {
    setCouponMsg("");
    const code = couponInput.trim();
    if (!code) {
      setCouponMsg("أدخل كود الخصم");
      return;
    }
    setCouponBusy(true);
    try {
      const result = await validateCoupon(code, subtotal, accessToken);
      setAppliedCoupon(result);
      setCouponInput(result.code);
      setCouponMsg(result.message || "تم تطبيق كود الخصم");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg(
        err instanceof ApiError ? err.message : "تعذر تطبيق كود الخصم",
      );
    } finally {
      setCouponBusy(false);
    }
  };

  const onRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMsg("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError("");
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("أكمل الاسم والجوال والعنوان.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await buyNowOrder(
        {
          product_id: Number(product.id),
          quantity: qty,
          phone: phone.trim(),
          payment_method: paymentMethod,
          customer_notes: notes.trim() || undefined,
          coupon_code: appliedCoupon?.code || undefined,
          shipping_address: {
            full_name: name.trim(),
            phone: phone.trim(),
            city: city.trim() || undefined,
            address_line1: address.trim(),
          },
        },
        accessToken,
      );
      const checkoutUrl = orderCheckoutUrl(order);
      const paymentError = orderPaymentError(order);
      if (checkoutUrl) {
        goToPaymob(checkoutUrl, order.order_number, phone.trim());
        return;
      }
      if (paymentError) {
        const held = {
          orderNumber: order.order_number,
          phone: phone.trim(),
          message: paymentError,
        };
        rememberPaymentContext({ ...held, error: held.message });
        setUnpaidOrder(held);
        setSubmitting(false);
        return;
      }
      const q = new URLSearchParams({
        order_number: order.order_number,
        phone: phone.trim(),
      });
      router.push(`/track?${q.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "تعذر إتمام الشراء.",
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="checkout-page pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <Link href={`/products/${params.id}`}>المنتج</Link>
          <span>/</span>
          <span className="product-breadcrumb__current">اشترِ الآن</span>
        </nav>

        <h1 className="font-display text-3xl font-bold text-ink">اشترِ الآن</h1>
        <p className="mt-2 text-ink-muted">
          طلب مباشر بدون السلة — عند الاستلام أو عبر Paymob.
        </p>

        {loadError && <p className="checkout-error mt-4">{loadError}</p>}

        {unpaidOrder && (
          <div className="account-card mt-6">
            <h2 className="font-display text-xl font-bold text-ink">
              الطلب اتعمل والدفع لم يبدأ
            </h2>
            <p className="mt-2 text-sm text-ink-muted">{unpaidOrder.message}</p>
            <p className="mt-3 font-mono text-lg font-bold text-accent" dir="ltr">
              {unpaidOrder.orderNumber}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <PayAgainButton
                orderNumber={unpaidOrder.orderNumber}
                phone={unpaidOrder.phone}
              />
              <Link
                href={`/track?order_number=${encodeURIComponent(unpaidOrder.orderNumber)}&phone=${encodeURIComponent(unpaidOrder.phone)}`}
                className="admin-btn"
              >
                تتبع الطلب
              </Link>
            </div>
          </div>
        )}

        {product && !unpaidOrder && (
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <div className="account-card flex gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-bg">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{product.name}</p>
                <p className="mt-1 text-accent font-bold">
                  {formatMoney(effective)}
                </p>
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted">
                  الكمية
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-16 rounded-md border border-line bg-transparent px-2 py-1 text-ink"
                    value={qty}
                    onChange={(e) => {
                      setQty(Math.max(1, Number(e.target.value) || 1));
                      if (appliedCoupon) {
                        setAppliedCoupon(null);
                        setCouponMsg("أعد تطبيق الكود بعد تغيير الكمية");
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="account-card">
              <h2 className="font-display text-lg font-bold text-ink mb-3">
                بيانات التوصيل
              </h2>
              <div className="checkout-fields">
                <label className="checkout-field">
                  <span>الاسم *</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  <span>الجوال *</span>
                  <input
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  <span>المدينة</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label className="checkout-field checkout-field--full">
                  <span>العنوان *</span>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>
                <label className="checkout-field checkout-field--full">
                  <span>ملاحظات</span>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2 border-t border-line/70 pt-4">
                <p className="text-sm font-semibold text-ink">كود الخصم</p>
                <div className="flex gap-2">
                  <input
                    dir="ltr"
                    className="min-w-0 flex-1 rounded-lg border border-line bg-transparent px-3 py-2 text-sm uppercase text-ink"
                    placeholder="SAVE10"
                    value={couponInput}
                    disabled={couponBusy || !!appliedCoupon}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!appliedCoupon) void onApplyCoupon();
                      }
                    }}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      className="admin-btn shrink-0"
                      onClick={onRemoveCoupon}
                    >
                      إزالة
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary shrink-0"
                      disabled={couponBusy}
                      onClick={() => void onApplyCoupon()}
                    >
                      {couponBusy ? "..." : "تطبيق"}
                    </button>
                  )}
                </div>
                {couponMsg && (
                  <p className="text-xs text-ink-muted">{couponMsg}</p>
                )}
                <div className="space-y-1 text-sm text-ink-muted">
                  <div className="flex justify-between">
                    <span>المجموع</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>الخصم ({appliedCoupon?.code})</span>
                      <span>−{formatMoney(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-ink">
                    <span>الإجمالي</span>
                    <span>{formatMoney(totalAfter)}</span>
                  </div>
                </div>
              </div>

              <PaymentMethodPicker
                value={paymentMethod}
                onChange={setPaymentMethod}
              />

              {error && <p className="checkout-error">{error}</p>}
              <button
                type="submit"
                className="btn-shine product-cta mt-4 w-full"
                disabled={submitting}
              >
                {submitting
                  ? "جاري تأكيد الطلب..."
                  : paymentMethod === "paymob"
                    ? "الدفع عبر Paymob"
                    : paymentMethod === "tamara"
                      ? "الدفع عبر تمارا"
                      : "تأكيد الشراء الآن"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function BuyNowPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="checkout-page">
            <PageLoader label="جاري تجهيز الشراء" />
          </main>
        }
      >
        <BuyNowInner />
      </Suspense>
      <Footer />
    </>
  );
}
