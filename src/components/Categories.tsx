"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";

import { Reveal } from "@/components/Reveal";
import { mediaUrl } from "@/lib/api";
import { categoryPath, type HomeCategory } from "@/lib/catalog";

type CategoriesProps = {
  categories: HomeCategory[];
};

function padIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function SliderArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`use-categories__nav use-categories__nav--${direction}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        {direction === "prev" ? (
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

export function Categories({ categories }: CategoriesProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const items = [...categories].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured),
  );
  const canLoop = items.length >= 4;

  return (
    <section id="categories" className="use-categories" aria-labelledby="use-categories-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="use-categories__intro">
          <p className="use-categories__badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            أقسام المتجر
          </p>
          <h2 id="use-categories-title" className="font-display use-categories__title">
            اختَر على حسب استخدامك
          </h2>
          <p className="use-categories__subtitle">
            سواء للشغل، أو الدراسة، أو الألعاب — بتلقى التصنيف المناسب لك
          </p>
        </Reveal>

        {items.length === 0 ? (
          <p className="rounded-xl border border-line bg-bg-elevated/60 px-4 py-8 text-center text-ink-muted">
            حالياً ما فيه تصنيفات متاحة
          </p>
        ) : (
          <div className="use-categories__slider">
            <SliderArrow
              direction="prev"
              label="التالي"
              onClick={() => swiperRef.current?.slidePrev()}
            />
            <SliderArrow
              direction="next"
              label="السابق"
              onClick={() => swiperRef.current?.slideNext()}
            />

            <Swiper
              dir="rtl"
              modules={[Navigation, Autoplay]}
              className="use-categories__swiper"
              centeredSlides={items.length > 1}
              loop={canLoop}
              speed={550}
              spaceBetween={16}
              slidesPerView={1.18}
              watchSlidesProgress
              grabCursor
              autoplay={
                items.length > 1
                  ? { delay: 4200, disableOnInteraction: true, pauseOnMouseEnter: true }
                  : false
              }
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              breakpoints={{
                640: { slidesPerView: 1.55, spaceBetween: 16 },
                900: { slidesPerView: 2.35, spaceBetween: 18 },
                1100: { slidesPerView: 2.85, spaceBetween: 20 },
                1280: { slidesPerView: 3, spaceBetween: 20 },
              }}
            >
              {items.map((cat, index) => {
                const image = mediaUrl(cat.image);
                const count = cat.products_count ?? cat.products?.length ?? 0;

                return (
                  <SwiperSlide key={cat.id}>
                    <Link href={categoryPath(cat)} className="use-cat">
                      <span className="use-cat__media" aria-hidden>
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt="" />
                        ) : (
                          <span className="use-cat__fallback">{cat.name.slice(0, 1)}</span>
                        )}
                      </span>
                      <span className="use-cat__overlay" aria-hidden />
                      <span className="use-cat__index">{padIndex(index)}</span>

                      <span className="use-cat__copy">
                        {cat.is_featured ? (
                          <span className="use-cat__tag">مميز</span>
                        ) : null}
                        <span className="use-cat__name">{cat.name}</span>
                        <span className="use-cat__desc">
                          {cat.description?.trim() ||
                            (count > 0
                              ? `${count} منتج جاهز تتصفّحه الحين`
                              : "تصفّح منتجات هذا التصنيف")}
                        </span>
                        {count > 0 ? (
                          <span className="use-cat__count">{count} منتج</span>
                        ) : null}
                      </span>

                      <span className="use-cat__cta" aria-hidden>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M15 5l-7 7 7 7"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
