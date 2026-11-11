"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { logoSrc } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { categoryPath, type HomeCategory } from "@/lib/catalog";
import { ThemeToggle } from "@/lib/theme";

type NavbarProps = {
  categories?: Array<Pick<HomeCategory, "id" | "name" | "slug">>;
};

export function Navbar({ categories = [] }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { openCart, totalCount } = useCart();
  const { user, isAuthenticated, canAccessDashboard, logout } = useAuth();
  const navCategories = categories.slice(0, 6);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".nav-profile")) setProfileOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [profileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 text-white transition-[background,box-shadow] duration-300 ${
        scrolled
          ? "bg-brand/95 shadow-[0_8px_30px_rgba(30,101,152,0.28)] backdrop-blur-md"
          : "bg-brand"
      }`}
    >
      <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="relative block h-10 w-[148px] shrink-0 sm:h-11 sm:w-[168px]">
          <Image
            src={logoSrc}
            alt="أركان"
            fill
            priority
            className="object-contain object-right"
            sizes="168px"
          />
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          <Link href="/build" className="site-nav-link">
            جمّع جهازك
          </Link>
          {navCategories.map((cat) => (
            <Link key={cat.id} href={categoryPath(cat)} className="site-nav-link">
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <div className="nav-profile relative">
            <button
              type="button"
              aria-label="حسابي"
              aria-expanded={profileOpen}
              className="nav-icon-btn"
              onClick={() => setProfileOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M5 19.2c1.6-3.2 4-4.7 7-4.7s5.4 1.5 7 4.7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {profileOpen && (
              <div className="nav-profile__menu" role="menu">
                <p className="px-3 py-2 text-sm font-semibold text-ink-muted">
                  {isAuthenticated
                    ? `يا هلا، ${user?.name || "مستخدم"}`
                    : "يا هلا فيك في أركان"}
                </p>
                {!isAuthenticated ? (
                  <Link
                    href="/account"
                    role="menuitem"
                    className="nav-profile__item"
                    onClick={() => setProfileOpen(false)}
                  >
                    تسجيل الدخول / حساب جديد
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/account"
                      role="menuitem"
                      className="nav-profile__item"
                      onClick={() => setProfileOpen(false)}
                    >
                      حسابي
                    </Link>
                    {canAccessDashboard && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="nav-profile__item"
                        onClick={() => setProfileOpen(false)}
                      >
                        لوحة التحكم
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="nav-profile__item"
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                      }}
                    >
                      تسجيل الخروج
                    </button>
                  </>
                )}
                <Link
                  href="/track"
                  role="menuitem"
                  className="nav-profile__item"
                  onClick={() => setProfileOpen(false)}
                >
                  تتبع طلب
                </Link>
                <Link
                  href="/#products"
                  role="menuitem"
                  className="nav-profile__item"
                  onClick={() => setProfileOpen(false)}
                >
                  تسوّق الحين
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={`سلة التسوق${totalCount ? `، ${totalCount} منتجات` : ""}`}
            className="nav-icon-btn relative"
            onClick={openCart}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3.5 5h1.6l1.2 10.2a1.8 1.8 0 0 0 1.8 1.6h8.7a1.8 1.8 0 0 0 1.75-1.4L20.5 8H7.1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1.35" fill="currentColor" />
              <circle cx="17" cy="20" r="1.35" fill="currentColor" />
            </svg>
            {totalCount > 0 && (
              <span className="nav-cart-badge">{totalCount > 99 ? "99+" : totalCount}</span>
            )}
          </button>

          <button
            type="button"
            aria-label="القائمة"
            aria-expanded={open}
            className="nav-icon-btn md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/build"
              className="site-nav-link site-nav-link--mobile"
              onClick={() => setOpen(false)}
            >
              جمّع جهازك
            </Link>
            {navCategories.map((cat) => (
              <Link
                key={cat.id}
                href={categoryPath(cat)}
                className="site-nav-link site-nav-link--mobile"
                onClick={() => setOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <button
              type="button"
              className="mt-1 rounded-md bg-accent px-3 py-3 text-center text-base font-bold text-white"
              onClick={() => {
                setOpen(false);
                openCart();
              }}
            >
              فتح السلة {totalCount > 0 ? `(${totalCount})` : ""}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
