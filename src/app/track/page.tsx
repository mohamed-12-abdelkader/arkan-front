"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { ApiError, formatMoney, formatDateTime } from "@/lib/api";
import { PayAgainButton } from "@/components/PayAgainButton";
import {
  commerceStatusSteps,
  statusLabelAr,
  statusStepIndex,
  trackOrder,
  type ApiOrder,
} from "@/lib/commerce";

function TrackInner() {
  const search = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(
    search.get("order_number") || "",
  );
  const [phone, setPhone] = useState(search.get("phone") || "");
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeIndex = useMemo(
    () => (order ? statusStepIndex(order.status) : -1),
    [order],
  );

  const load = async (num: string, ph: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await trackOrder(num, ph);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر العثور على الطلب. تأكد من الرقم والجوال.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const n = search.get("order_number");
    const p = search.get("phone");
    if (n && p) {
      setOrderNumber(n);
      setPhone(p);
      void load(n, p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError("أدخل رقم الطلب ورقم الجوال.");
      return;
    }
    void load(orderNumber.trim(), phone.trim());
  };

  const address =
    order?.shipping_address_json &&
    typeof order.shipping_address_json === "object"
      ? (order.shipping_address_json as Record<string, string>)
      : null;

  return (
    <main className="track-page pb-16">
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
          <Link href="/">الرئيسية</Link>
          <span>/</span>
          <span className="product-breadcrumb__current">تتبع الطلب</span>
        </nav>

        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          تتبع طلبك
        </h1>
        <p className="mt-2 text-ink-muted">
          أدخل رقم الطلب ورقم الجوال المستخدم عند الشراء.
        </p>

        <form className="account-card mt-6" onSubmit={onSubmit}>
          <div className="checkout-fields">
            <label className="checkout-field">
              <span>رقم الطلب</span>
              <input
                required
                dir="ltr"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ARK-20261023-123456"
              />
            </label>
            <label className="checkout-field">
              <span>رقم الجوال</span>
              <input
                required
                dir="ltr"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
              />
            </label>
          </div>
          {error && <p className="checkout-error">{error}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn--primary mt-3"
            disabled={loading}
          >
            {loading ? "جاري البحث..." : "عرض حالة الطلب"}
          </button>
        </form>

        {order && (
          <section className="track-result mt-8">
            <div className="account-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">رقم الطلب</p>
                  <p className="font-display text-xl font-bold text-ink" dir="ltr">
                    {order.order_number}
                  </p>
                </div>
                <span className="admin-badge">{statusLabelAr(order.status)}</span>
              </div>
              <div className="account-card__row mt-4">
                <span>الإجمالي</span>
                <strong>{formatMoney(order.total)}</strong>
              </div>
              <div className="account-card__row">
                <span>الدفع</span>
                <strong>
                  {order.payment_status === "paid"
                    ? "مدفوع"
                    : order.payment_status === "failed"
                      ? "فشل"
                      : order.status === "pending_payment"
                        ? "بانتظار الدفع الإلكتروني"
                        : "عند الاستلام / معلّق"}
                </strong>
              </div>
              {order.status === "pending_payment" &&
                order.payment_status !== "paid" && (
                  <div className="mt-4">
                    <PayAgainButton
                      orderNumber={order.order_number}
                      phone={phone.trim()}
                    />
                  </div>
                )}
              {order.created_at && (
                <div className="account-card__row">
                  <span>تاريخ الطلب</span>
                  <strong>{formatDateTime(order.created_at)}</strong>
                </div>
              )}
              {address?.full_name && (
                <div className="account-card__row">
                  <span>العميل</span>
                  <strong>{address.full_name}</strong>
                </div>
              )}
              {address?.address_line1 && (
                <div className="account-card__row">
                  <span>العنوان</span>
                  <strong>
                    {[address.address_line1, address.city]
                      .filter(Boolean)
                      .join(" — ")}
                  </strong>
                </div>
              )}
            </div>

            {order.status !== "cancelled" && (
              <ol className="track-timeline mt-6">
                {commerceStatusSteps.map((step, i) => {
                  const done = activeIndex >= 0 && i <= activeIndex;
                  const current = i === activeIndex;
                  return (
                    <li
                      key={step.key}
                      className={`${done ? "is-done" : ""} ${current ? "is-current" : ""}`}
                    >
                      <span className="track-timeline__dot" aria-hidden />
                      <div>
                        <p>{step.label}</p>
                        <span>{step.desc}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.items && order.items.length > 0 && (
              <div className="account-card mt-6">
                <h2 className="font-display text-lg font-bold text-ink">
                  المنتجات
                </h2>
                <ul className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-ink">
                        {item.product_name} × {item.quantity}
                      </span>
                      <strong className="text-accent">
                        {formatMoney(item.line_total ?? item.price)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.history && order.history.length > 0 && (
              <div className="account-card mt-6">
                <h2 className="font-display text-lg font-bold text-ink">
                  سجل الحالات
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {order.history.map((h, i) => (
                    <li key={`${h.to_status}-${i}`}>
                      <strong className="text-ink">
                        {statusLabelAr(h.to_status)}
                      </strong>
                      {h.created_at ? ` — ${formatDateTime(h.created_at)}` : ""}
                      {h.note ? ` · ${h.note}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="track-page">
            <PageLoader label="جاري تجهيز التتبع" />
          </main>
        }
      >
        <TrackInner />
      </Suspense>
      <Footer />
    </>
  );
}
