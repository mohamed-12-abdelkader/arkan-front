"use client";

import { useMemo, useState } from "react";
import { mediaUrl } from "@/lib/api";

type ProductGalleryProps = {
  name: string;
  image?: string | null;
  images?: Array<{ id?: number; url: string; position?: number }>;
  badge?: string;
};

export function ProductGallery({
  name,
  image,
  images = [],
  badge,
}: ProductGalleryProps) {
  const gallery = useMemo(() => {
    const urls: string[] = [];
    const sorted = [...images].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    for (const img of sorted) {
      const url = mediaUrl(img.url);
      if (url && !urls.includes(url)) urls.push(url);
    }
    const main = mediaUrl(image);
    if (main && !urls.includes(main)) urls.unshift(main);
    return urls;
  }, [image, images]);

  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const current = gallery[active] || gallery[0] || "";

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        <div className="product-gallery__glow" aria-hidden />
        {badge && <span className="product-gallery__badge">{badge}</span>}
        <div className={`product-gallery__frame ${loaded || !current ? "is-ready" : ""}`}>
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current}
              src={current}
              alt={name}
              className="product-gallery__img"
              onLoad={() => setLoaded(true)}
            />
          ) : (
            <div className="product-gallery__empty">لا توجد صورة</div>
          )}
        </div>
      </div>

      {gallery.length > 0 && (
        <div className="product-gallery__thumbs" aria-label="صور المنتج">
          {gallery.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-thumb ${i === active ? "is-active" : ""}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => {
                setLoaded(false);
                setActive(i);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
