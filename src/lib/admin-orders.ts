import {
  apiRequest,
  apiRequestPaginated,
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/api";

export type AdminOrderListItem = {
  id: number;
  order_number: string;
  status: string;
  payment_status?: string;
  fulfillment_status?: string;
  subtotal?: string | number;
  discount_total?: string | number;
  tax_total?: string | number;
  shipping_total?: string | number;
  total?: string | number;
  currency?: string;
  phone?: string | null;
  guest_email?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  shipping_name?: string | null;
  items_count?: number;
  coupon_code?: string | null;
  created_at: string;
  updated_at?: string;
};

export type AdminOrderItem = {
  id: number;
  product_id?: number | null;
  variant_id?: number | null;
  product_name: string;
  quantity: number;
  price: string | number;
  line_total?: string | number;
  sku?: string | null;
};

export type AdminOrderHistory = {
  id?: number;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  actor_id?: number | null;
  actor_name?: string | null;
  created_at: string;
};

export type AdminOrderPayment = {
  id: number;
  provider?: string | null;
  method?: string | null;
  amount?: string | number;
  currency?: string;
  status?: string;
  created_at?: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  user_id?: number | null;
  customer_phone?: string | null;
  shipping_address?: string | null;
  shipping_address_json?: Record<string, unknown> | null;
  billing_address?: Record<string, unknown> | null;
  customer_notes?: string | null;
  admin_notes?: string | null;
  cancelled_reason?: string | null;
  items: AdminOrderItem[];
  history: AdminOrderHistory[];
  payments: AdminOrderPayment[];
  allowed_next_statuses: string[];
};

export type AdminOrdersQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  from?: string;
  to?: string;
};

export const ORDER_STATUS_OPTIONS = Object.keys(orderStatusLabels);

export const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export const FULFILLMENT_STATUS_OPTIONS = [
  "unfulfilled",
  "partial",
  "ready_for_shipment",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const fulfillmentStatusLabels: Record<string, string> = {
  unfulfilled: "غير مُجهّز",
  partial: "جزئي",
  ready_for_shipment: "جاهز للشحن",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export function statusLabel(status: string) {
  return orderStatusLabels[status] || status;
}

export function paymentLabel(status: string) {
  return paymentStatusLabels[status] || status;
}

export function fulfillmentLabel(status: string) {
  return fulfillmentStatusLabels[status] || status;
}

export async function fetchAdminOrders(token: string, query: AdminOrdersQuery = {}) {
  return apiRequestPaginated<AdminOrderListItem[]>("/orders", {
    token,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      q: query.q || undefined,
      status: query.status || undefined,
      payment_status: query.payment_status || undefined,
      fulfillment_status: query.fulfillment_status || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
    },
  });
}

export async function fetchAdminOrder(token: string, id: string | number) {
  return apiRequest<AdminOrderDetail>(`/orders/${id}`, { token });
}

export async function updateOrderStatus(
  token: string,
  id: string | number,
  body: { status: string; note?: string },
) {
  return apiRequest<
    AdminOrderDetail & {
      payment_action?: string | null;
      /** Set when the payment provider needs manual attention (e.g. refund in the dashboard) */
      payment_warning?: string | null;
    }
  >(`/orders/${id}/status`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function updateAdminOrder(
  token: string,
  id: string | number,
  body: {
    admin_notes?: string | null;
    payment_status?: string;
    fulfillment_status?: string;
    phone?: string;
    customer_notes?: string | null;
  },
) {
  return apiRequest<AdminOrderDetail>(`/orders/${id}`, {
    method: "PATCH",
    token,
    body,
  });
}
