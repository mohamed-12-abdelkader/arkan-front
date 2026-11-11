import { Reveal } from "@/components/Reveal";

const stats = [
  { value: "10,000+", label: "عميل واثق فينا", icon: "users" },
  { value: "4.9/5", label: "تقييم العملاء", icon: "star" },
  { value: "27", label: "توصيل للمناطق", icon: "pin" },
  { value: "10+", label: "سنوات خبرة", icon: "badge" },
] as const;

const highlights = [
  {
    title: "توصيل سريع",
    desc: "نوصل لكل المناطق، وتقدر تستلم من الفرع بكل سهولة.",
    icon: "truck",
    accent: "a",
  },
  {
    title: "منتجات أصلية بضمان",
    desc: "أجهزة أصلية 100% مع ضمان معتمد، وراحة بال كاملة.",
    icon: "shield",
    accent: "b",
  },
] as const;

const features = [
  {
    title: "الدفع عند الاستلام",
    desc: "ادفع بسهولة وأمان لما يوصلك طلبك",
    icon: "cash",
  },
  {
    title: "دعم فني متخصص",
    desc: "فريق جاهز يساعدك قبل الشراء وبعده",
    icon: "support",
  },
  {
    title: "استبدال سهل",
    desc: "سياسة استبدال مرنة بدون تعقيدات",
    icon: "swap",
  },
  {
    title: "صيانة موثوقة",
    desc: "خدمة بعد البيع بخبرة حقيقية",
    icon: "wrench",
  },
  {
    title: "أسعار مناسبة",
    desc: "أفضل قيمة مقابل الجودة في السوق",
    icon: "tag",
  },
  {
    title: "خبرة مبنية على الثقة",
    desc: "سنين تجربة مع آلاف العملاء",
    icon: "heart",
  },
] as const;

function WhyIcon({ name }: { name: string }) {
  if (name === "users") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.5 18.5c.8-2.8 2.8-4.2 5.5-4.2s4.7 1.4 5.5 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M15.2 14.2c1.7.3 3.1 1.3 3.8 3.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3.8l2.3 4.7 5.2.8-3.8 3.7.9 5.2L12 15.8 7.4 18.2l.9-5.2L4.5 9.3l5.2-.8L12 3.8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21z" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === "badge") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l2.1 2.1L16.8 4l.2 2.8L19.8 8l-1.6 2.2.9 2.6-2.6.6-.7 2.7-2.5-1.1-2.5 1.1-.7-2.7-2.6-.6.9-2.6L4.2 8l2.8-1.2L7.2 4l2.7 1.1L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "truck") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="7" cy="18.2" r="1.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17" cy="18.2" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9.2 11.5l1.8 1.8 3.8-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "cash") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M6.5 9.2v5.6M17.5 9.2v5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "support") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4.5 13.2v-1a7.5 7.5 0 0 1 15 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <rect x="3.2" y="12.6" width="3.6" height="5.4" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <rect x="17.2" y="12.6" width="3.6" height="5.4" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M20.8 16.2v1.1a2.2 2.2 0 0 1-2.2 2.2H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "swap") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 7h11l-2.2-2.2M17 17H6l2.2 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "wrench") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M14.7 6.3a4 4 0 0 0-5.5 5.5L4 17v3h3l5.2-5.2a4 4 0 0 0 5.5-5.5l-2.2 2.2-1.8-1.8 2-2.1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3.5 12.2V5.8A1.8 1.8 0 0 1 5.3 4h6.2L20 12.5 12.8 19.7 3.5 12.2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="8" cy="8.2" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.2 6.7 4.05 5.15A4.8 4.8 0 0 1 12 6.9a4.8 4.8 0 0 1 7.95-1.75c2.85 1.55 3.25 5.05 1.38 7.75C18.7 16.65 12 21 12 21z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function WhyUs() {
  return (
    <section className="why-us" aria-labelledby="why-us-title">
      <div className="why-us__inner">
        <Reveal className="why-us__intro">
          <p className="why-us__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 4h10v4l-2 1.2V20H9V9.2L7 8V4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            ليش أركان؟
          </p>
          <h2 id="why-us-title" className="font-display why-us__title">
            ليش تختارنا؟
          </h2>
          <p className="why-us__subtitle">
            من أول ما تختار الجهاز لين يوصلك، نهتم بكل تفصيلة في تجربة الشراء
          </p>
        </Reveal>

        <Reveal className="why-us__stats" delay={40}>
          {stats.map((item) => (
            <div key={item.label} className="why-us__stat">
              <span className="why-us__icon" aria-hidden>
                <WhyIcon name={item.icon} />
              </span>
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </Reveal>

        <div className="why-us__highlights">
          {highlights.map((item, index) => (
            <Reveal
              key={item.title}
              delay={80 + index * 70}
              className={`why-us__highlight why-us__highlight--${item.accent}`}
            >
              <span className="why-us__icon why-us__icon--lg" aria-hidden>
                <WhyIcon name={item.icon} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="why-us__features">
          {features.map((item, index) => (
            <Reveal key={item.title} delay={100 + index * 45} className="why-us__feature">
              <span className="why-us__feature-top">
                <span className="why-us__icon" aria-hidden>
                  <WhyIcon name={item.icon} />
                </span>
                <span className="why-us__num">{String(index + 1).padStart(2, "0")}</span>
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
