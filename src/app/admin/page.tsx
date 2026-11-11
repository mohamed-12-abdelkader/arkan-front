"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatDateTime,
  formatMoney,
  orderStatusLabels,
  paymentStatusLabels,
  ApiError,
} from "@/lib/api";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import {
  fetchDashboardOverview,
  fetchLowStock,
  fetchSalesTrend,
  type DashboardOverview,
  type LowStockItem,
  type SalesTrendPoint,
} from "@/lib/dashboard";
import { SalesTrendChart } from "@/components/admin/SalesTrendChart";

function statusCount(overview: DashboardOverview | null, keys: string[]) {
  if (!overview) return 0;
  return overview.orders_by_status
    .filter((s) => keys.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);
}

export default function AdminDashboardPage() {
  const { accessToken, hasPermission } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [bucket, setBucket] = useState("day");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const range = { from: from || undefined, to: to || undefined };
      const [ov, tr] = await Promise.all([
        fetchDashboardOverview(accessToken, range),
        fetchSalesTrend(accessToken, { ...range, bucket }),
      ]);
      setOverview(ov);
      setTrend(tr);

      if (hasPermission("inventory.manage")) {
        try {
          const stock = await fetchLowStock(accessToken);
          setLowStock(stock);
        } catch {
          setLowStock([]);
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "تعذر تحميل بيانات الداشبورد. تأكد أن الباك اند يعمل على :8000",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, from, to, bucket, hasPermission]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: "إجمالي المبيعات",
        value: formatMoney(overview.sales.gross_sales),
        hint: "غير الملغاة",
      },
      {
        label: "صافي المبيعات",
        value: formatMoney(overview.sales.net_sales),
        hint: "بعد الخصومات",
      },
      {
        label: "الإيراد المحصّل",
        value: formatMoney(overview.sales.recognized_revenue),
        hint: "paid / partially_refunded",
      },
      {
        label: "عدد الطلبات",
        value: String(overview.sales.orders_count),
        hint: "ضمن الفترة",
      },
      {
        label: "متوسط قيمة الطلب",
        value: formatMoney(overview.sales.average_order_value),
        hint: "AOV",
      },
      {
        label: "العملاء",
        value: String(overview.customers.total_customers),
        hint: `جدد: ${overview.customers.new_customers}`,
      },
    ];
  }, [overview]);

  const statusCards = [
    {
      label: "بانتظار التأكيد",
      count: statusCount(overview, ["awaiting_confirmation", "pending", "pending_payment"]),
      tone: "warn",
    },
    {
      label: "مؤكد / تجهيز",
      count: statusCount(overview, ["confirmed", "processing", "ready_for_shipment"]),
      tone: "info",
    },
    {
      label: "تم الشحن",
      count: statusCount(overview, ["shipped"]),
      tone: "accent",
    },
    {
      label: "تم التسليم",
      count: statusCount(overview, ["delivered"]),
      tone: "ok",
    },
    {
      label: "ملغي",
      count: statusCount(overview, ["cancelled"]),
      tone: "danger",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-filters">
        <label>
          من
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          إلى
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          التجميع
          <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
            <option value="day">يومي</option>
            <option value="week">أسبوعي</option>
            <option value="month">شهري</option>
            <option value="quarter">ربع سنوي</option>
            <option value="year">سنوي</option>
          </select>
        </label>
        <button type="button" className="admin-refresh" onClick={() => void load()}>
          تحديث
        </button>
      </div>

      {error && <p className="checkout-error">{error}</p>}
      {loading && !overview && (
        <PageLoader label="جاري تحميل المؤشرات" />
      )}

      {overview && (
        <>
          <section className="admin-kpi-grid">
            {kpis.map((kpi) => (
              <article key={kpi.label} className="admin-kpi">
                <p>{kpi.label}</p>
                <strong>{kpi.value}</strong>
                <span>{kpi.hint}</span>
              </article>
            ))}
          </section>

          <section className="admin-status-grid">
            {statusCards.map((card) => (
              <article key={card.label} className={`admin-status admin-status--${card.tone}`}>
                <p>{card.label}</p>
                <strong>{card.count}</strong>
              </article>
            ))}
          </section>

          <div className="admin-grid-2">
            <section className="admin-panel">
              <div className="admin-panel__head">
                <div>
                  <h2>اتجاه المبيعات</h2>
                  <p>من `/dashboard/sales-trend`</p>
                </div>
              </div>
              <SalesTrendChart data={trend} />
            </section>

            <section className="admin-panel">
              <div className="admin-panel__head">
                <div>
                  <h2>المخزون والتجميعات</h2>
                  <p>حالة حالية من الـ overview</p>
                </div>
              </div>
              <div className="admin-inv-grid">
                <div>
                  <span>منخفض المخزون</span>
                  <strong>{overview.inventory.low_stock}</strong>
                </div>
                <div>
                  <span>نفد المخزون</span>
                  <strong>{overview.inventory.out_of_stock}</strong>
                </div>
                <div>
                  <span>قيمة المخزون</span>
                  <strong>{formatMoney(overview.inventory.valuation)}</strong>
                </div>
                <div>
                  <span>تجميعات PC</span>
                  <strong>{overview.custom_builds.total_builds}</strong>
                </div>
                <div className="admin-inv-grid__wide">
                  <span>متوسط قيمة التجميعة</span>
                  <strong>{formatMoney(overview.custom_builds.avg_build_value)}</strong>
                </div>
              </div>
            </section>
          </div>

          <div className="admin-grid-2">
            <section className="admin-panel">
              <div className="admin-panel__head">
                <div>
                  <h2>أحدث الطلبات</h2>
                  <p>آخر 10 طلبات</p>
                </div>
                <Link href="/admin/orders" className="admin-btn">
                  كل الطلبات
                </Link>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>الرقم</th>
                      <th>الحالة</th>
                      <th>الدفع</th>
                      <th>الإجمالي</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-ink-muted">
                          لا توجد طلبات بعد
                        </td>
                      </tr>
                    ) : (
                      overview.recent_orders.map((order) => (
                        <tr key={order.id}>
                          <td dir="ltr">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-semibold text-accent hover:underline"
                            >
                              {order.order_number}
                            </Link>
                          </td>
                          <td>
                            <span className="admin-badge">
                              {orderStatusLabels[order.status] || order.status}
                            </span>
                          </td>
                          <td>
                            {paymentStatusLabels[order.payment_status] ||
                              order.payment_status}
                          </td>
                          <td>{formatMoney(order.total)}</td>
                          <td>{formatDateTime(order.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel__head">
                <div>
                  <h2>الأكثر مبيعًا</h2>
                  <p>أعلى المنتجات حسب الكمية</p>
                </div>
              </div>
              <ul className="admin-best">
                {overview.best_selling_products.length === 0 ? (
                  <li className="text-ink-muted">لا توجد مبيعات بعد</li>
                ) : (
                  overview.best_selling_products.map((p, i) => (
                    <li key={p.product_id}>
                      <span className="admin-best__rank">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{p.product_name}</p>
                        <p className="text-xs text-ink-muted">كمية: {p.qty_sold}</p>
                      </div>
                      <strong>{formatMoney(p.revenue)}</strong>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          {hasPermission("inventory.manage") && (
            <section className="admin-panel">
              <div className="admin-panel__head">
                <div>
                  <h2>تنبيهات المخزون المنخفض</h2>
                  <p>من `/inventory/low-stock`</p>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>SKU</th>
                      <th>المخزون</th>
                      <th>محجوز</th>
                      <th>المتاح</th>
                      <th>الحد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-ink-muted">
                          لا توجد تنبيهات حالياً
                        </td>
                      </tr>
                    ) : (
                      lowStock.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td dir="ltr">{item.sku || "—"}</td>
                          <td>{item.stock}</td>
                          <td>{item.reserved_stock}</td>
                          <td>{item.available}</td>
                          <td>{item.low_stock_threshold}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
