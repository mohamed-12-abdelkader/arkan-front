import Image from "next/image";
import Link from "next/link";
import { logoSrc } from "@/data/mock";
import { categoryPath, type HomeCategory } from "@/lib/catalog";

type FooterProps = {
  categories?: Array<Pick<HomeCategory, "id" | "name" | "slug">>;
};

export function Footer({ categories = [] }: FooterProps) {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <div className="relative mb-4 h-10 w-[140px]">
            <Image
              src={logoSrc}
              alt="أركان"
              fill
              className="object-contain object-right"
              sizes="140px"
            />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            متجر أركان للأجهزة الإلكترونية — جودة، ضمان، وتوصيل سريع.
          </p>
          <p className="mt-4 text-sm font-semibold text-white">موقع المتجر</p>
          <a
            href="https://maps.google.com/?q=8606+شارع+أم+مانع+المدينة+المنورة"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block max-w-sm text-sm leading-6 text-white/70 hover:text-white"
          >
            8606 شارع أم مانع، أسماء بنت عمرو، الأنصارية، شوران - المدينة المنورة
          </a>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">التصنيفات</h3>
          <ul className="space-y-2 text-sm text-white/70">
            {categories.length === 0 ? (
              <li>قريبًا</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={categoryPath(cat)} className="hover:text-white">
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">تواصل</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>اتصل بنا الآن</li>
            <li>
              <a href="tel:+966550900963" dir="ltr" className="hover:text-white">
                +966 55 090 0963
              </a>
            </li>
            <li>
              البريد الإلكتروني:{" "}
              <a href="mailto:info@Arkantech.net" dir="ltr" className="hover:text-white">
                info@Arkantech.net
              </a>
            </li>
            <li>
              <Link href="#brands" className="hover:text-white">
                شركاؤنا
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        حقوق النشر © {new Date().getFullYear()} أركان تيك. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
