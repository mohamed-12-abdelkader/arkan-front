"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { ApiError, formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { PayAgainButton } from "@/components/PayAgainButton";
import {
  PaymentMethodPicker,
  type StorePaymentMethod,
} from "@/components/PaymentMethodPicker";
import {
  checkoutOrder,
  goToPaymob,
  orderCheckoutUrl,
  orderPaymentError,
  rememberPaymentContext,
} from "@/lib/commerce";

type FormState = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  city: "",
  address: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { accessToken, user, isAuthenticated } = useAuth();
  const {
    lines,
    totalPrice,
    pricing,
    couponCode,
    applyCoupon,
    removeCoupon,
    clearCart,
    closeCart,
    refreshCart,
  } = useCart();
  const [form, setForm] = useState<FormState>(initialForm);
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [unpaidOrder, setUnpaidOrder] = useState<{
    orderNumber: string;
    phone: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    closeCart();
    void refreshCart().finally(() => setReady(true));
  }, [closeCart, refreshCart]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      phone: f.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (couponCode) setCouponInput(couponCode);
  }, [couponCode]);

  const shipping = pricing
    ? Number(pricing.shipping) || 0
    : totalPrice >= 500 || totalPrice === 0
      ? 0
      : 35;
  const discount = pricing ? Number(pricing.discount) || 0 : 0;
  const grandTotal = pricing ? Number(pricing.total) || totalPrice : totalPrice;

  const onApplyCoupon = async () => {
    setCouponMsg("");
    setError("");
    const code = couponInput.trim();
    if (!code) {
      setCouponMsg("أدخل كود الخصم");
      return;
    }
    setCouponBusy(true);
    try {
      await applyCoupon(code);
      setCouponMsg("تم تطبيق كود الخصم");
    } catch (err) {
      setCouponMsg(
        err instanceof ApiError ? err.message : "تعذر تطبيق كود الخصم",
      );
    } finally {
      setCouponBusy(false);
    }
  };

  const onRemoveCoupon = async () => {
    setCouponBusy(true);
    setCouponMsg("");
    try {
      await removeCoupon();
      setCouponInput("");
      setCouponMsg("تم إزالة كود الخصم");
    } catch (err) {
      setCouponMsg(
        err instanceof ApiError ? err.message : "تعذر إزالة الكود",
      );
    } finally {
      setCouponBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (lines.length === 0) {
      setError("السلة فارغة. أضف منتجات أولاً.");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("يرجى تعبئة الاسم ورقم الجوال والعنوان.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await checkoutOrder(
        {
          phone: form.phone.trim(),
          payment_method: paymentMethod,
          customer_notes: form.notes.trim() || undefined,
          shipping_address: {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            city: form.city.trim() || undefined,
            address_line1: form.address.trim(),
          },
        },
        accessToken,
      );

      clearCart();
      await refreshCart().catch(() => undefined);

      const checkoutUrl = orderCheckoutUrl(order);
      const paymentError = orderPaymentError(order);
      if (checkoutUrl) {
        goToPaymob(checkoutUrl, order.order_number, form.phone.trim());
        return;
      }
      if (paymentError) {
        const held = {
          orderNumber: order.order_number,
          phone: form.phone.trim(),
          message: paymentError,
        };
        rememberPaymentContext({ ...held, error: held.message });
        setUnpaidOrder(held);
        setSubmitting(false);
        return;
      }

      const q = new URLSearchParams({
        order_number: order.order_number,
        phone: form.phone.trim(),
      });
      router.push(`/track?${q.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر إنشاء الطلب. حاول مرة أخرى.",
      );
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <>
        <Navbar />
        <main className="checkout-page">
          <PageLoader label="جاري تجهيز الدفع" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="checkout-page pb-16">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            <span>/</span>
            <span className="product-breadcrumb__current">إتمام الطلب</span>
          </nav>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                إتمام الطلب
              </h1>
              <p className="mt-2 text-ink-muted">
                الدفع عند الاستلام، أو Paymob بحساب المتجر.
              </p>
            </div>
            {!isAuthenticated && (
              <Link href="/account?next=/checkout" className="admin-btn">
                لديك حساب؟ سجّل دخولك
              </Link>
            )}
          </div>

          {unpaidOrder ? (
            <div className="account-card max-w-xl">
              <h2 className="font-display text-xl font-bold text-ink">
                الطلب اتعمل والدفع لم يبدأ
              </h2>
              <p className="mt-2 text-sm text-ink-muted">{unpaidOrder.message}</p>
              <p className="mt-3 font-mono text-lg font-bold text-accent" dir="ltr">
                {unpaidOrder.orderNumber}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                السلة اتفرّغت مع إنشاء الطلب. يمكنك إعادة محاولة الدفع الإلكتروني
                لنفس الرقم.
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
          ) : lines.length === 0 ? (
            <div className="checkout-empty">
              <p className="font-display text-xl font-bold text-ink">السلة فارغة</p>
              <p className="mt-2 text-ink-muted">أضف منتجات ثم عد لإتمام الطلب.</p>
              <Link href="/#products" className="admin-btn admin-btn--primary mt-5">
                تصفح المنتجات
              </Link>
            </div>
          ) : (
            <form className="checkout-grid" onSubmit={onSubmit}>
              <section className="checkout-panel">
                <h2 className="font-display text-xl font-bold text-ink">
                  بيانات التوصيل
                </h2>
                <div className="checkout-fields">
                  <label className="checkout-field">
                    <span>اسم العميل *</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="الاسم الكامل"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>رقم الجوال *</span>
                    <input
                      required
                      dir="ltr"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="01012345678"
                    />
                  </label>
                  <label className="checkout-field">
                    <span>المدينة</span>
                    <input
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="القاهرة"
                    />
                  </label>
                  <label className="checkout-field checkout-field--full">
                    <span>العنوان *</span>
                    <textarea
                      required
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                      placeholder="الشارع، المبنى، الدور..."
                    />
                  </label>
                  <label className="checkout-field checkout-field--full">
                    <span>ملاحظات</span>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="اختياري"
                    />
                  </label>
                </div>

                <PaymentMethodPicker
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  amount={grandTotal}
                  phone={form.phone}
                />
              </section>

              <aside className="checkout-summary">
                <h2 className="font-display text-xl font-bold text-ink">
                  ملخص الطلب
                </h2>
                <ul className="checkout-summary__list">
                  {lines.map(({ lineId, product, qty, lineTotal }) => (
                    <li key={lineId}>
                      <div className="checkout-summary__media">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {product.name}
                        </p>
                        <p className="text-xs text-ink-muted">الكمية: {qty}</p>
                      </div>
                      <span className="text-sm font-bold text-accent">
                        {formatMoney(lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-ink">كود الخصم</p>
                  <div className="flex gap-2">
                    <input
                      dir="ltr"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-transparent px-3 py-2 text-sm uppercase text-ink"
                      placeholder="SAVE10"
                      value={couponInput}
                      disabled={couponBusy || !!couponCode}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!couponCode) void onApplyCoupon();
                        }
                      }}
                    />
                    {couponCode ? (
                      <button
                        type="button"
                        className="admin-btn shrink-0"
                        disabled={couponBusy}
                        onClick={() => void onRemoveCoupon()}
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
                    <p
                      className={`text-xs ${
                        couponCode && couponMsg.includes("تطبيق")
                          ? "text-accent"
                          : "text-ink-muted"
                      }`}
                    >
                      {couponMsg}
                    </p>
                  )}
                </div>

                <div className="checkout-summary__totals">
                  <div>
                    <span>المجموع</span>
                    <span>
                      {formatMoney(pricing?.subtotal ?? totalPrice)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div>
                      <span>
                        الخصم
                        {couponCode ? ` (${couponCode})` : ""}
                      </span>
                      <span className="text-accent">
                        −{formatMoney(discount)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span>الشحن</span>
                    <span>
                      {shipping === 0 ? "مجاني / حسب السيرفر" : formatMoney(shipping)}
                    </span>
                  </div>
                  <div className="checkout-summary__grand">
                    <span>الإجمالي</span>
                    <span>{formatMoney(grandTotal)}</span>
                  </div>
                </div>

                {error && <p className="checkout-error">{error}</p>}

                <button
                  type="submit"
                  className="btn-shine checkout-submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "جاري إرسال الطلب..."
                    : paymentMethod === "paymob"
                      ? "الدفع بالبطاقة"
                      : paymentMethod === "tamara"
                        ? "الدفع عبر تمارا"
                        : "تأكيد الطلب"}
                </button>
              </aside>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
