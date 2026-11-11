"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
import { Navbar } from "@/components/Navbar";
import { formatPrice } from "@/data/mock";
import {
  formatOrderDate,
  getOrderById,
  getStatusIndex,
  orderStatusSteps,
  paymentLabels,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

function IconCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const statusIcons: Record<OrderStatus, ReactNode> = {
  placed: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="4" y="7" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  confirmed: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12.2l2.3 2.3 4.7-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  preparing: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 8V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  shipping: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h11v9H3V7zm11 2h4l3 3.5V16h-7V9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  delivered: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v5c0 4.4-2.9 7.5-7 9-4.1-1.5-7-4.6-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.2l2.1 2.1L15.5 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function MetaIcon({ children }: { children: ReactNode }) {
  return <span className="order-meta-card__icon">{children}</span>;
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    const id = typeof params.id === "string" ? params.id : "";
    setOrder(id ? getOrderById(id) : null);
  }, [params.id]);

  const currentIndex =
    order && order !== null ? getStatusIndex(order.status) : -1;
  const progress =
    currentIndex < 0 ? 0 : (currentIndex / (orderStatusSteps.length - 1)) * 100;

  return (
    <>
      <Navbar />
      <main className="order-page pb-20">
        <div className="order-page__glow" aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="product-breadcrumb mb-6" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            <span>/</span>
            <span className="product-breadcrumb__current">تتبع الطلب</span>
          </nav>

          {order === undefined ? (
            <PageLoader label="جاري تحميل الطلب" />
          ) : order === null ? (
            <div className="checkout-empty">
              <span className="order-empty-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M12 8v5M12 16.5h.01"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <p className="mt-3 font-display text-xl font-bold text-ink">
                الطلب غير موجود
              </p>
              <p className="mt-2 text-ink-muted">
                تأكد من رابط التتبع أو أعد إنشاء الطلب من السلة.
              </p>
              <Link href="/" className="checkout-empty__btn">
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <>
              <header className="order-hero">
                <div className="order-hero__success" aria-hidden>
                  <IconCheck size={28} />
                </div>

                <div className="order-hero__content">
                  <p className="order-hero__eyebrow">طلبك قيد المتابعة</p>
                  <h1 className="font-display mt-1 text-3xl font-bold text-ink sm:text-4xl">
                    تتبع حالة الطلب
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-ink-muted sm:text-base">
                    شكرًا لك {order.customer.name}. تقدر تتابع مراحل الشحن من هنا
                    لحظة بلحظة.
                  </p>

                  <div className="order-hero__chips">
                    <span className="order-chip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect
                          x="5"
                          y="4"
                          width="14"
                          height="16"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        />
                        <path
                          d="M9 8h6M9 12h6M9 16h4"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span dir="ltr">{order.id}</span>
                    </span>
                    <span className="order-chip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
                        <path
                          d="M12 8v4.5l3 1.5"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {formatOrderDate(order.createdAt)}
                    </span>
                    <span className="order-chip order-chip--accent">
                      {statusIcons[order.status]}
                      {orderStatusSteps[currentIndex]?.label}
                    </span>
                  </div>
                </div>

                <div className="order-hero__amount">
                  <span>إجمالي الطلب</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </header>

              <section className="order-panel order-panel--track mt-7">
                <div className="order-panel__head">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                      مراحل التوصيل
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      الحالة الحالية:{" "}
                      <span className="font-semibold text-accent">
                        {orderStatusSteps[currentIndex]?.label}
                      </span>
                    </p>
                  </div>
                  <span className="order-progress-label">
                    {Math.round(progress)}% مكتمل
                  </span>
                </div>

                <div className="order-progress" aria-hidden>
                  <span style={{ width: `${progress}%` }} />
                </div>

                <ol className="order-steps">
                  {orderStatusSteps.map((step, i) => {
                    const done = i <= currentIndex;
                    const active = i === currentIndex;
                    return (
                      <li
                        key={step.key}
                        className={`order-step ${done ? "is-done" : ""} ${
                          active ? "is-active" : ""
                        }`}
                      >
                        <span className="order-step__icon" aria-hidden>
                          {done && !active ? <IconCheck size={18} /> : statusIcons[step.key]}
                        </span>
                        <span className="order-step__label">{step.label}</span>
                        <span className="order-step__desc">{step.desc}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="order-meta-card">
                  <MetaIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                      <path
                        d="M5.5 19c1.4-3 3.7-4.4 6.5-4.4S16.1 16 17.5 19"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </MetaIcon>
                  <p>المستلم</p>
                  <strong>{order.customer.name}</strong>
                </article>

                <article className="order-meta-card">
                  <MetaIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M8 4.5h8A2.5 2.5 0 0 1 18.5 7v10A2.5 2.5 0 0 1 16 19.5H8A2.5 2.5 0 0 1 5.5 17V7A2.5 2.5 0 0 1 8 4.5z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M10 8h4M9.5 12h5M9.5 15.5h3.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </MetaIcon>
                  <p>الجوال</p>
                  <strong dir="ltr">{order.customer.phone}</strong>
                </article>

                <article className="order-meta-card">
                  <MetaIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  </MetaIcon>
                  <p>المدينة</p>
                  <strong>{order.customer.city}</strong>
                </article>

                <article className="order-meta-card">
                  <MetaIcon>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect
                        x="3.5"
                        y="7"
                        width="17"
                        height="11"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M3.5 10.5h17"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </MetaIcon>
                  <p>طريقة الدفع</p>
                  <strong>{paymentLabels[order.customer.paymentMethod]}</strong>
                </article>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="order-panel">
                  <div className="order-panel__title">
                    <span className="order-panel__title-icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-8.5z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.5 20.5v-6h5v6"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink">
                      عنوان التوصيل
                    </h2>
                  </div>

                  <div className="order-address">
                    <p>{order.customer.address}</p>
                    <span>
                      {order.customer.city} · المملكة العربية السعودية
                    </span>
                    {order.customer.notes && (
                      <div className="order-address__note">
                        <strong>ملاحظة:</strong> {order.customer.notes}
                      </div>
                    )}
                  </div>
                </section>

                <section className="order-panel">
                  <div className="order-panel__title">
                    <span className="order-panel__title-icon" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3.5 5h1.6l1.2 10.2a1.8 1.8 0 0 0 1.8 1.6h8.7a1.8 1.8 0 0 0 1.75-1.4L20.5 8H7.1"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="10" cy="20" r="1.3" fill="currentColor" />
                        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
                      </svg>
                    </span>
                    <h2 className="font-display text-xl font-bold text-ink">
                      منتجات الطلب
                    </h2>
                  </div>

                  <ul className="order-items">
                    {order.items.map((item) => (
                      <li key={item.productId} className="order-items__row">
                        <div className="order-items__media">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain p-1.5"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            الكمية {item.qty} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-accent">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="order-totals">
                    <div>
                      <span>المجموع الفرعي</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div>
                      <span>الشحن</span>
                      <span>
                        {order.shipping === 0
                          ? "مجاني"
                          : formatPrice(order.shipping)}
                      </span>
                    </div>
                    <div className="order-totals__grand">
                      <span>الإجمالي</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="order-actions mt-8">
                <Link href="/#products" className="order-btn order-btn--primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M20 12H4M12 5l-7 7 7 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  متابعة التسوق
                </Link>
                <Link href="/" className="order-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-8.5z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                  الرئيسية
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
