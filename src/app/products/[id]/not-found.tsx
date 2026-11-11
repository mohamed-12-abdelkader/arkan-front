import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">المنتج غير موجود</h1>
      <p className="mt-3 text-ink-muted">ربما تم حذف المنتج أو الرابط غير صحيح.</p>
      <Link
        href="/#products"
        className="mt-6 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
      >
        العودة للمنتجات
      </Link>
    </main>
  );
}
