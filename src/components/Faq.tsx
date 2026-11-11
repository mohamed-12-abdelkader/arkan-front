"use client";

import { useState } from "react";

import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "وش يشمل سعر الجهاز؟",
    a: "السعر الظاهر على المنتج هو سعر الجهاز حسب المواصفات المذكورة، والهدايا أو الإضافات ممكن تختلف حسب العرض الحالي. لو تبي تفاصيل أدق عن منتج معيّن، تواصل معنا قبل الطلب.",
  },
  {
    q: "وش الهدايا اللي مع الجهاز؟",
    a: "العروض والهدايا تتغير حسب الفترة والمنتج. نوضّح أي هدية أو إضافة مجانية في صفحة المنتج أو وقت إتمام الطلب، وتقدر تسألنا قبل الشراء عشان تتأكد.",
  },
  {
    q: "وش ضمان الجهاز؟",
    a: "أغلب الأجهزة أصلية وبضمان رسمي أو معتمد حسب نوع المنتج والبراند. مدة الضمان وطريقته تظهر في تفاصيل المنتج، ولو تبي توضيح زيادة فريقنا جاهز يساعدك.",
  },
  {
    q: "وش حالة الجهاز؟",
    a: "نوضح الحالة بوضوح على كل منتج (جديد / مجدد / مستعمل). ولو الجهاز مجدد أو مستعمل نذكر حالته ومواصفاته قبل الشراء عشان تطلب وأنت مرتاح.",
  },
  {
    q: "فيه شحن؟",
    a: "إي نعم، التوصيل متاح لأغلب المناطق، وكمان تقدر تستلم من الفرع حسب المتاح. رسوم ومدة الشحن تعتمد على المنطقة وطريقة الاستلام.",
  },
  {
    q: "أقدر أشوف الجهاز قبل الشحن؟",
    a: "في حالات كثيرة تقدر تعاين الجهاز قبل الاستلام أو تستلمه من الفرع. تواصل معنا بعد الطلب ونرتب معك أفضل طريقة تناسبك.",
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-title">
      <div className="faq-section__inner">
        <Reveal className="faq-section__intro">
          <p className="faq-section__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H12l-3.5 3.2V15H7.5A2.5 2.5 0 0 1 5 12.5v-6z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            أسئلة العملاء
          </p>
          <h2 id="faq-title" className="font-display faq-section__title">
            عندك سؤال؟ <span>عندنا جواب واضح</span>
          </h2>
          <p className="faq-section__subtitle">
            هدايا، ضمان، شحن، ومعاينة قبل الاستلام — كل اللي تحتاجه قبل ما تطلب
          </p>
        </Reveal>

        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = open === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <Reveal key={item.q} delay={index * 45} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  id={buttonId}
                  className="faq-item__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="faq-item__num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="faq-item__question">{item.q}</span>
                  <span className="faq-item__icon" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="faq-item__panel"
                  hidden={!isOpen}
                >
                  <p>{item.a}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="faq-section__foot" delay={280}>
          <p>
            ما لقيت جواب لسؤالك؟{" "}
            <a href="tel:+966550900963" className="faq-section__contact">
              تواصل معنا مباشرة
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
