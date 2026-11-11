"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { logoSrc } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import { PageLoader } from "@/components/PageLoader";

const navItems = [
  { href: "/admin", label: "نظرة عامة", icon: "overview" },
  { href: "/admin/orders", label: "الطلبات", icon: "orders" },
  { href: "/admin/categories", label: "التصنيفات", icon: "categories" },
  { href: "/admin/brands", label: "البراندات", icon: "brands" },
  { href: "/admin/products", label: "المنتجات", icon: "products" },
  { href: "/admin/coupons", label: "أكواد الخصم", icon: "coupons" },
  { href: "/admin/components", label: "مكونات التجميعة", icon: "build" },
  { href: "/admin/assistant", label: "مساعد المبيعات", icon: "assistant" },
  { href: "/admin/whatsapp", label: "واتساب الطلبات", icon: "whatsapp" },
] as const;

function NavIcon({ name }: { name: string }) {
  if (name === "overview") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === "categories") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7h16M4 12h10M4 17h7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === "brands") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12.5V6.8A1.8 1.8 0 0 1 5.8 5h5.7L20 13.5 13.5 20 4 12.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="8.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (name === "products") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "coupons") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 9.5A2.5 2.5 0 0 0 6.5 12 2.5 2.5 0 0 0 4 14.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5A2.5 2.5 0 0 0 17.5 12 2.5 2.5 0 0 0 20 9.5V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 9l4 6M14 9l-4 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "build") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="7" y="3.5" width="10" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 8h4M10 12h4M10 16h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "orders") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.3" fill="currentColor" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      </svg>
    );
  }
  if (name === "assistant") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9 9h6M9 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 9.3c.3-.5.5-.5.8-.5h.6c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.2.6l-.5.5c-.1.1-.1.3 0 .5.4.7 1.1 1.4 1.9 1.9.2.1.4.1.5 0l.5-.5c.2-.2.4-.3.6-.2l1.7.7c.3.1.4.3.4.5v.6c0 .3 0 .5-.5.8-.5.3-1.3.5-2.1.2-1.8-.6-3.4-2-4.3-3.7-.4-.8-.5-1.7-.2-2.5.1-.3.3-.5.5-.7z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return null;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, canAccessDashboard, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !canAccessDashboard) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [loading, isAuthenticated, canAccessDashboard, router, pathname]);

  if (loading || !isAuthenticated || !canAccessDashboard) {
    return <PageLoader variant="screen" label="جاري التحقق من الجلسة" />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-sidebar__brand">
          <Image src={logoSrc} alt="أركان" width={120} height={32} />
        </Link>

        <p className="admin-sidebar__label">القائمة</p>
        <nav className="admin-sidebar__nav">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${active ? "is-active" : ""}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <span className="admin-user__avatar" aria-hidden>
              {(user?.name || "A").slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">
                {user?.email || user?.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-logout"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="text-sm font-semibold text-accent">Admin Dashboard</p>
            <h1 className="font-display text-2xl font-bold text-ink">
              مرحباً، {user?.name?.split(" ")[0] || "أدمن"}
            </h1>
          </div>
          <div className="admin-topbar__actions">
            <ThemeToggle className="theme-toggle" />
            <Link href="/admin/products/new" className="admin-store-link">
              منتج جديد
            </Link>
            <Link href="/" className="admin-store-link">
              عرض المتجر
            </Link>
          </div>
        </header>

        <nav className="admin-mobile-nav" aria-label="تنقل الأدمن">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : ""}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
