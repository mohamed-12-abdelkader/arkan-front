"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import { heroBanners } from "@/data/mock";

function HeroNavBtn({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";

  return (
    <button
      type="button"
      aria-label={isPrev ? "السابق" : "التالي"}
      onClick={onClick}
      className={`hero-nav-btn ${isPrev ? "hero-nav-btn--prev" : "hero-nav-btn--next"}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        {isPrev ? (
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

export function Hero() {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="hero-carousel-wrapper" aria-label="معرض الصور الرئيسي">
      <HeroNavBtn
        direction="prev"
        onClick={() => swiperRef.current?.slidePrev()}
      />
      <HeroNavBtn
        direction="next"
        onClick={() => swiperRef.current?.slideNext()}
      />

      <Swiper
        modules={[EffectFade, Autoplay, Pagination, Navigation]}
        className="hero-carousel"
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop
        speed={700}
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {heroBanners.map((src, i) => (
          <SwiperSlide key={src}>
            <div className="hero-image-container">
              <Image
                src={src}
                alt={`بانر أركان ${i + 1}`}
                fill
                priority={i === 0}
                className="hero-image"
                sizes="90vw"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
