"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/api";
import { PageLoader } from "@/components/PageLoader";
import { useCart } from "@/lib/cart";
import { addBuildToCart, readGuestToken } from "@/lib/commerce";
import { useAuth } from "@/lib/auth";
import {
  adoptBuild,
  changeComponentQty,
  chooseComponent,
  clearBuild,
  ensureBuild,
  fetchBuildCatalog,
  issueText,
  removeComponent,
  type BuildCatalog,
  type BuildLine,
  type BuildSlot,
  type BuildState,
} from "@/lib/builder";

function lineForSlot(lines: BuildLine[], slotId: number) {
  return lines.find((line) => line.slot_id === slotId);
}

export function PcBuilder() {
  const searchParams = useSearchParams();
  const handoffBuildId = Number(searchParams.get("build_id") || 0);
  const { accessToken } = useAuth();
  const { refreshCart, openCart } = useCart();
  const [catalog, setCatalog] = useState<BuildCatalog | null>(null);
  const [build, setBuild] = useState<BuildState | null>(null);
  const [activeSlot, setActiveSlot] = useState<BuildSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nextCatalog = await fetchBuildCatalog();
        const nextBuild =
          handoffBuildId > 0
            ? await adoptBuild(handoffBuildId, readGuestToken())
            : await ensureBuild();
        if (!cancelled) {
          setCatalog(nextCatalog);
          setBuild(nextBuild);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذر تحميل التجميعة");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handoffBuildId]);

  const missingRequired = useMemo(() => {
    if (!catalog || !build) return [];
    return catalog.slots.filter(
      (slot) => slot.is_required && !lineForSlot(build.items || [], slot.id),
    );
  }, [catalog, build]);

  const incompatible = build?.compatibility?.overall === "incompatible";
  const issues = (build?.compatibility?.issues || []).filter(
    (issue) => issue.severity === "error" || issue.severity === "warning",
  );

  async function run(action: () => Promise<BuildState>) {
    setBusy(true);
    setError("");
    try {
      setBuild(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث التجميعة");
    } finally {
      setBusy(false);
    }
  }

  async function addToCart() {
    if (!build) return;
    setBusy(true);
    setError("");
    try {
      await addBuildToCart(build.id, accessToken);
      await refreshCart();
      openCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة التجميعة إلى السلة");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PageLoader label="جاري تحميل مكونات التجميعة" />;
  }

  if (!catalog || !build) {
    return <p className="px-4 py-16 text-center text-danger">{error || "تعذر فتح صفحة التجميعة"}</p>;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">كوّن جهازك</p>
          <h1 className="font-display text-3xl font-bold text-ink">تجميعة مخصصة</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            اختر كل قطعة، ثم أضف التجميعة للسلة وأكمل الطلب. خلط معالج AMD مع لوحة Intel يظهر كعدم توافق.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-bg-elevated px-5 py-3 text-end">
          <p className="text-xs text-ink-muted">إجمالي التجميعة</p>
          <p className="font-display text-2xl font-bold text-accent">{formatMoney(build.subtotal)}</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {issues.length > 0 && (
        <div className="mb-4 rounded-xl border border-line bg-bg-elevated px-4 py-3 text-sm">
          <p className="mb-1 font-semibold text-ink">
            {incompatible ? "المكونات غير متوافقة" : "ملاحظات التوافق"}
          </p>
          <ul className="space-y-1 text-ink-muted">
            {issues.map((issue) => (
              <li key={`${issue.rule_code}-${issue.message}`}>{issueText(issue)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <Link href="/checkout" className="text-sm font-semibold text-accent">
          إتمام الطلب
        </Link>
        <button
          type="button"
          disabled={busy || build.items.length === 0}
          onClick={() => run(() => clearBuild(build.id))}
          className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand disabled:opacity-50"
        >
          إزالة الكل
        </button>
        <button
          type="button"
          disabled={busy || missingRequired.length > 0 || incompatible || build.items.length === 0}
          onClick={() => void addToCart()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          أضف إلى السلة
        </button>
      </div>

      {missingRequired.length > 0 && (
        <p className="mb-3 text-sm text-ink-muted">
          المتبقي لإتمام الطلب: {missingRequired.map((slot) => slot.name).join("، ")}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-bg-elevated shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-brand text-white">
              <th className="px-4 py-3 text-start font-semibold">المنتج</th>
              <th className="w-28 px-3 py-3 text-center font-semibold">الكمية</th>
              <th className="w-36 px-3 py-3 text-center font-semibold">السعر</th>
              <th className="w-40 px-3 py-3 text-center font-semibold">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {catalog.slots.map((slot) => {
              const line = lineForSlot(build.items || [], slot.id);
              const lineTotal = line ? Number(line.unit_price) * line.quantity : 0;
              return (
                <tr key={slot.id} className="border-t border-line">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-ink">{line?.name || slot.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {line ? slot.name : slot.is_required ? "مطلوب" : "اختياري"}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {line ? (
                      <input
                        type="number"
                        min={1}
                        max={slot.max_quantity || 1}
                        value={line.quantity}
                        disabled={busy || (slot.max_quantity || 1) <= 1}
                        onChange={(event) => {
                          const quantity = Number(event.target.value);
                          if (!quantity) return;
                          void run(() => changeComponentQty(build.id, line.id, quantity));
                        }}
                        className="w-16 rounded-lg border border-line bg-transparent px-2 py-1 text-center text-ink"
                      />
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center font-semibold text-ink">
                    {line ? formatMoney(lineTotal) : "—"}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={busy || slot.options.length === 0}
                        onClick={() => setActiveSlot(slot)}
                        className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand disabled:opacity-50"
                      >
                        {line ? "تغيير" : "اختر"}
                      </button>
                      {line && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => removeComponent(build.id, line.id))}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-danger"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeSlot && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-bg-elevated p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink">{activeSlot.name}</h2>
                <p className="text-sm text-ink-muted">اختر قطعة من المتوفر</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="rounded-lg px-2 py-1 text-sm text-ink-muted"
              >
                إغلاق
              </button>
            </div>
            <ul className="space-y-3">
              {activeSlot.options.map((option) => (
                <li
                  key={option.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{option.name}</p>
                    <p className="text-xs text-ink-muted">
                      {option.available_stock > 0 ? `متوفر: ${option.available_stock}` : "غير متوفر"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-accent">{formatMoney(option.effective_price)}</span>
                    <button
                      type="button"
                      disabled={busy || option.available_stock <= 0}
                      onClick={() =>
                        run(async () => {
                          const next = await chooseComponent(build.id, activeSlot.id, option.id);
                          setActiveSlot(null);
                          return next;
                        })
                      }
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      اختيار
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
