import { apiRequest } from "@/lib/api";

export type DashboardOverview = {
  definitions?: Record<string, string>;
  range?: { from: string | null; to: string | null };
  sales: {
    gross_sales: string;
    net_sales: string;
    recognized_revenue: string;
    orders_count: number;
    average_order_value: string;
  };
  orders_by_status: Array<{ status: string; count: number }>;
  customers: {
    total_customers: number;
    new_customers: number;
  };
  inventory: {
    low_stock: number;
    out_of_stock: number;
    valuation: string;
  };
  best_selling_products: Array<{
    product_id: number;
    product_name: string;
    qty_sold: number;
    revenue: string;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total: string;
    created_at: string;
  }>;
  custom_builds: {
    total_builds: number;
    avg_build_value: string;
  };
};

export type SalesTrendPoint = {
  period: string;
  orders: number;
  sales: string;
};

export type LowStockItem = {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  reserved_stock: number;
  low_stock_threshold: number;
  available: number;
};

export async function fetchDashboardOverview(
  token: string,
  range?: { from?: string; to?: string },
) {
  return apiRequest<DashboardOverview>("/dashboard/overview", {
    token,
    query: {
      from: range?.from,
      to: range?.to,
    },
  });
}

export async function fetchSalesTrend(
  token: string,
  opts?: { from?: string; to?: string; bucket?: string },
) {
  return apiRequest<SalesTrendPoint[]>("/dashboard/sales-trend", {
    token,
    query: {
      from: opts?.from,
      to: opts?.to,
      bucket: opts?.bucket ?? "day",
    },
  });
}

export async function fetchLowStock(token: string) {
  return apiRequest<LowStockItem[]>("/inventory/low-stock", { token });
}
