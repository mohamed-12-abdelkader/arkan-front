"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { ApiError, formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  fetchMyOrders,
  statusLabelAr,
  type ApiOrder,
} from "@/lib/commerce";

function AccountInner() {
  const router = useRouter();
  const search = useSearchParams();
  const modeParam = search.get("mode");
  const nextPath = search.get("next") || "/account";
  const { user, login, register, logout, isAuthenticated, loading, accessToken } =
    useAuth();

  const [tab, setTab] = useState<"login" | "register">(
    modeParam === "register" ? "register" : "login",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (modeParam === "register") setTab("register");
  }, [modeParam]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      try {
        const res = await fetchMyOrders(accessToken, 1, 20);
        if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (tab === "register") {
        if (!name.trim() || !phone.trim() || password.length < 6) {
          setError("أدخل الاسم والهاتف وكلمة مرور من 6 أحرف على الأقل.");
          setSubmitting(false);
          return;
        }
        await register({ name, phone, password });
      } else {
        await login(phone || name, password);
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/account");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر إكمال العملية. تأكد من تشغيل الباك إند.",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="account-page">
        <PageLoader label="جاري تجهيز الحساب" />
      </main>
    );
  }

  if (isAuthenticated && user) {
    return (
      <main className="account-page pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-ink">حسابي</h1>
          <p className="mt-2 text-ink-muted">مرحبًا، {user.name}</p>

          <div className="account-card mt-6">
            <div className="account-card__row">
              <span>الاسم</span>
              <strong>{user.name}</strong>
            </div>
            <div className="account-card__row">
              <span>الجوال</span>
              <strong dir="ltr">{user.phone || "—"}</strong>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/track" className="admin-btn admin-btn--primary">
                تتبع طلب
              </Link>
              <Link href="/checkout" className="admin-btn">
                إتمام الشراء
              </Link>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void logout()}
              >
                تسجيل الخروج
              </button>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold text-ink">طلباتي</h2>
            {ordersLoading ? (
              <PageLoader variant="inline" label="جاري تحميل الطلبات" />
            ) : orders.length === 0 ? (
              <p className="mt-4 text-ink-muted">لا توجد طلبات بعد.</p>
            ) : (
              <ul className="account-orders mt-4">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/track?order_number=${encodeURIComponent(o.order_number)}&phone=${encodeURIComponent(String(user.phone || o.phone || ""))}`}
                    >
                      <strong dir="ltr">{o.order_number}</strong>
                      <span>{statusLabelAr(o.status)}</span>
                      <span>{formatMoney(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page pb-16">
      <div className="mx-auto max-w-md px-4 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">
          {tab === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {tab === "login"
            ? "ادخل برقم الجوال وكلمة المرور."
            : "حساب جديد بالاسم والجوال وكلمة المرور فقط."}
        </p>

        <div className="account-tabs mt-6">
          <button
            type="button"
            className={tab === "login" ? "is-active" : ""}
            onClick={() => setTab("login")}
          >
            دخول
          </button>
          <button
            type="button"
            className={tab === "register" ? "is-active" : ""}
            onClick={() => setTab("register")}
          >
            حساب جديد
          </button>
        </div>

        <form className="account-card mt-5" onSubmit={onSubmit}>
          {tab === "register" && (
            <label className="checkout-field">
              <span>الاسم</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
              />
            </label>
          )}
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
          <label className="checkout-field">
            <span>كلمة المرور</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="checkout-error">{error}</p>}

          <button
            type="submit"
            className="admin-btn admin-btn--primary w-full mt-2"
            disabled={submitting}
          >
            {submitting
              ? "جاري..."
              : tab === "login"
                ? "دخول"
                : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          يمكنك الطلب كضيف بدون حساب من{" "}
          <Link href="/checkout" className="text-accent">
            إتمام الطلب
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="account-page">
            <PageLoader label="جاري تجهيز الحساب" />
          </main>
        }
      >
        <AccountInner />
      </Suspense>
      <Footer />
    </>
  );
}
