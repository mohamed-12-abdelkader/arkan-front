"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { PayAgainButton } from "@/components/PayAgainButton";
import { ApiError, formatMoney } from "@/lib/api";
import {
  readPaymentContext,
  statusLabelAr,
  trackOrder,
  type ApiOrder,
} from "@/lib/commerce";

function paymentStatusAr(status?: string) {
  const map: Record<string, string> = {
    pending: "بانتظار الدفع",
    paid: "مدفوع",
    failed: "فشل",
    refunded: "مسترد",
    authorized: "مفوّض",
    partially_refunded: "استرداد جزئي",
  };
  return map[status || ""] || status || "—";
}

function isTrue(value: string | null) {
  return value === "true" || value === "1";
}

function ResultInner() {
  const search = useSearchParams();
  const gatewaySuccess =
    isTrue(search.get("success")) && !isTrue(search.get("pending"));
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  useEffect(() => {
    const ctx = readPaymentContext();
    if (!ctx?.orderNumber) return;
    setOrderNumber(ctx.orderNumber);
    if (ctx.phone) {
      setPhone(ctx.phone);
      setLookupPhone(ctx.phone);
    }
  }, []);

  useEffect(() => {
    if (!orderNumber || !lookupPhone.trim()) return;
    let cancelled = false;
    (async () => {
      setChecking(true);
      setCheckError("");
      try {
        const data = await trackOrder(orderNumber, lookupPhone.trim());
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setOrder(null);
          setCheckError(
            err instanceof ApiError ? err.message : "تعذر التحقق من حالة الدفع",
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, lookupPhone]);

  const paid = order?.payment_status === "paid";
  const title = paid
    ? "تم تأكيد الدفع"
    : gatewaySuccess && !order
      ? "تم استلام الدفع"
      : "لم يكتمل الدفع";

  const body = paid
    ? "السيرفر أكّد أن الدفع مدفوع والطلب بانتظار التجهيز."
    : gatewaySuccess
      ? "بوابة الدفع أبلغت بنجاح العملية. نؤكد الحالة من الطلب المحفوظ قبل التحويل."
      : "الدفع لم يكتمل أو ما زال معلّقاً. يمكنك إعادة فتح جلسة Paymob لنفس الطلب.";

  const canRetry =
    !!orderNumber && !!(lookupPhone.trim() || phone.trim()) && !paid;

  return (
    <main className="checkout-page pb-16">
      <div className="mx-auto max-w-xl px-4 pt-12">
        <div className="account-card text-center">
          <p className="text-sm text-ink-muted">نتيجة الدفع الإلكتروني</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-3 text-sm text-ink-muted">{body}</p>
          {orderNumber && (
            <p className="mt-4 font-mono text-lg font-bold text-accent" dir="ltr">
              {orderNumber}
            </p>
          )}

          {checking && (
            <p className="mt-4 text-sm text-ink-muted">جاري التحقق من حالة الطلب...</p>
          )}
          {order && (
            <div className="mt-4 text-start">
              <div className="account-card__row">
                <span>حالة الطلب</span>
                <strong>{statusLabelAr(order.status)}</strong>
              </div>
              <div className="account-card__row">
                <span>حالة الدفع</span>
                <strong>{paymentStatusAr(order.payment_status)}</strong>
              </div>
              <div className="account-card__row">
                <span>الإجمالي</span>
                <strong>{formatMoney(order.total)}</strong>
              </div>
            </div>
          )}
          {checkError && <p className="checkout-error text-start">{checkError}</p>}

          {!paid && (
            <form
              className="mt-4 space-y-3 text-start"
              onSubmit={(e) => {
                e.preventDefault();
                setOrderNumber((n) => n.trim());
                setLookupPhone(phone.trim());
              }}
            >
              <label className="checkout-field">
                <span>رقم الطلب</span>
                <input
                  dir="ltr"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ARK-..."
                />
              </label>
              <label className="checkout-field">
                <span>رقم الجوال للتحقق وإعادة الدفع</span>
                <input
                  dir="ltr"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                />
              </label>
              <button
                type="submit"
                className="admin-btn mt-3"
                disabled={!phone.trim() || !orderNumber.trim()}
              >
                تحقق من الدفع
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {canRetry && (
              <PayAgainButton
                orderNumber={orderNumber}
                phone={lookupPhone.trim() || phone.trim()}
              />
            )}
            {orderNumber && (lookupPhone.trim() || phone.trim()) && (
              <Link
                href={`/track?order_number=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(lookupPhone.trim() || phone.trim())}`}
                className="admin-btn"
              >
                تتبع الطلب
              </Link>
            )}
            <Link href="/" className="admin-btn">
              الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutResultPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="checkout-page">
            <PageLoader label="جاري التحقق من الدفع" />
          </main>
        }
      >
        <ResultInner />
      </Suspense>
      <Footer />
    </>
  );
}
