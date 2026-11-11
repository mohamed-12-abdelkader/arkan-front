"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { PageLoader } from "@/components/PageLoader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { logoSrc } from "@/data/mock";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { login, isAuthenticated, canAccessDashboard, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = search.get("next") || "/admin";

  useEffect(() => {
    if (!loading && isAuthenticated && canAccessDashboard) {
      router.replace(nextPath.startsWith("/") ? nextPath : "/admin");
    }
  }, [loading, isAuthenticated, canAccessDashboard, router, nextPath]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      const isAdmin =
        user.role === "admin" ||
        user.is_staff ||
        (user.permissions ?? []).includes("dashboard.read");

      if (!isAdmin) {
        setError("هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم.");
        setSubmitting(false);
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/admin");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "تعذر تسجيل الدخول. تأكد من تشغيل الباك اند.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__glow" aria-hidden />

      <div className="login-shell">
        <aside className="login-brand">
          <Link href="/" className="login-brand__logo">
            <Image src={logoSrc} alt="أركان" width={150} height={40} priority />
          </Link>
          <h1 className="font-display mt-8 text-3xl font-bold text-white sm:text-4xl">
            لوحة تحكم أركان
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/75">
            سجّل دخولك لمتابعة المبيعات، الطلبات، المخزون، وتجميعات PC من مكان
            واحد.
          </p>
          <ul className="login-brand__points">
            <li>نظرة عامة لحظية على الأداء</li>
            <li>تتبع الطلبات وحالات الدفع</li>
            <li>تنبيهات المخزون المنخفض</li>
          </ul>
        </aside>

        <section className="login-card">
          <p className="text-sm font-semibold text-accent">مرحباً بعودتك</p>
          <h2 className="font-display mt-1 text-2xl font-bold text-ink">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            استخدم البريد الإلكتروني أو رقم الجوال مع كلمة المرور.
          </p>

          <form onSubmit={onSubmit} className="login-form">
            <label className="checkout-field">
              <span>البريد أو الجوال</span>
              <input
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@example.com"
              />
            </label>

            <label className="checkout-field">
              <span>كلمة المرور</span>
              <div className="login-password">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </label>

            {error && <p className="checkout-error">{error}</p>}

            <button
              type="submit"
              className="btn-shine login-submit"
              disabled={submitting || loading}
            >
              {submitting ? "جاري الدخول..." : "دخول لوحة التحكم"}
            </button>
          </form>

          <Link href="/" className="login-back">
            العودة للمتجر
          </Link>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <PageLoader variant="screen" label="جاري تجهيز الدخول" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
