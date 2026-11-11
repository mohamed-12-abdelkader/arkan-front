import { apiRequest, apiRequestPaginated, mediaUrl } from "@/lib/api";

const GUEST_TOKEN_KEY = "arkan-guest-token";

export function readGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeGuestToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    return;
  }
  localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export type CartPricing = {
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  shipping: string | number;
  total: string | number;
  currency?: string;
};

export type ApiCartLine = {
  id: number;
  cart_id?: number;
  product_id?: number | null;
  variant_id?: number | null;
  build_id?: number | null;
  quantity: number;
  name?: string | null;
  image?: string | null;
  unit_price?: string | number;
  line_total?: string | number;
  price?: string | number;
  sale_price?: string | number;
};

export type ApiCartSummary = {
  guest_token?: string | null;
  cart?: { id: number; coupon_code?: string | null };
  items: ApiCartLine[];
  pricing: CartPricing;
};

export type ShippingAddress = {
  full_name: string;
  phone: string;
  address_line1: string;
  city?: string;
  governorate?: string;
  address_line2?: string;
  postal_code?: string;
};

export type CheckoutPayload = {
  phone: string;
  shipping_address: ShippingAddress;
  payment_method?: "cod" | "cash_on_delivery" | "bank_transfer" | "card" | "paymob" | "tamara";
  customer_notes?: string;
  guest_token?: string;
};

export type BuyNowPayload = CheckoutPayload & {
  product_id: number;
  quantity?: number;
  variant_id?: number | null;
  coupon_code?: string;
};

export type ApiOrder = {
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
  phone?: string;
  shipping_address?: string;
  shipping_address_json?: ShippingAddress | Record<string, unknown>;
  customer_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: Array<{
    id: number;
    product_id?: number | null;
    product_name: string;
    quantity: number;
    price: string | number;
    line_total?: string | number;
    sku?: string | null;
  }>;
  history?: Array<{
    from_status?: string | null;
    to_status: string;
    note?: string | null;
    created_at: string;
  }>;
  checkout_url?: string | null;
  checkoutUrl?: string | null;
  clientSecret?: string | null;
  paymentToken?: string | null;
  paymentMethod?: "paymob" | "tamara" | "cash_on_delivery" | "bank_transfer" | string;
  payment_provider?: "paymob" | "tamara" | string;
  paymentError?: string | null;
  payment_error?: string | null;
};

function toNumber(value: string | number | null | undefined) {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

export function moneyNumber(value: string | number | null | undefined) {
  return toNumber(value);
}

export async function fetchCart(token?: string | null) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>("/cart", {
    token,
    query: guest ? { guest_token: guest } : undefined,
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function addBuildToCart(buildId: number, token?: string | null) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>("/cart/items", {
    method: "POST",
    token,
    body: {
      build_id: buildId,
      quantity: 1,
      guest_token: guest || undefined,
    },
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function addCartItem(
  opts: {
    product_id: number;
    quantity?: number;
    variant_id?: number | null;
  },
  token?: string | null,
) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>("/cart/items", {
    method: "POST",
    token,
    body: {
      product_id: opts.product_id,
      quantity: opts.quantity ?? 1,
      variant_id: opts.variant_id ?? undefined,
      guest_token: guest || undefined,
    },
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function updateCartItemQty(
  lineId: number,
  quantity: number,
  token?: string | null,
) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>(`/cart/items/${lineId}`, {
    method: "PATCH",
    token,
    body: {
      quantity,
      guest_token: guest || undefined,
    },
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function removeCartItem(lineId: number, token?: string | null) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>(`/cart/items/${lineId}`, {
    method: "DELETE",
    token,
    query: guest ? { guest_token: guest } : undefined,
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function mergeGuestCart(token: string) {
  const guest = readGuestToken();
  if (!guest) return fetchCart(token);
  const data = await apiRequest<ApiCartSummary>("/cart/merge", {
    method: "POST",
    token,
    body: { guest_token: guest },
  });
  writeGuestToken(null);
  return data;
}

export async function applyCartCoupon(code: string, token?: string | null) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>("/cart/coupon", {
    method: "POST",
    token,
    body: {
      code: code.trim(),
      guest_token: guest || undefined,
    },
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function removeCartCoupon(token?: string | null) {
  const guest = readGuestToken();
  const data = await apiRequest<ApiCartSummary>("/cart/coupon", {
    method: "DELETE",
    token,
    query: guest ? { guest_token: guest } : undefined,
  });
  if (data.guest_token) writeGuestToken(data.guest_token);
  return data;
}

export async function checkoutOrder(
  payload: CheckoutPayload,
  token?: string | null,
) {
  const guest = readGuestToken();
  return apiRequest<ApiOrder>("/orders/checkout", {
    method: "POST",
    token,
    body: {
      ...payload,
      payment_method: payload.payment_method ?? "cod",
      guest_token: payload.guest_token || guest || undefined,
    },
  });
}

export async function buyNowOrder(
  payload: BuyNowPayload,
  token?: string | null,
) {
  return apiRequest<ApiOrder>("/orders/buy-now", {
    method: "POST",
    token,
    body: {
      ...payload,
      payment_method: payload.payment_method ?? "cod",
      quantity: payload.quantity ?? 1,
      coupon_code: payload.coupon_code?.trim() || undefined,
    },
  });
}

const PAY_CONTEXT_KEY = "arkan-pay-context";

export type PaymentContext = {
  orderNumber: string;
  phone: string;
  error?: string;
};

export function rememberPaymentContext(ctx: PaymentContext) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAY_CONTEXT_KEY, JSON.stringify(ctx));
}

export function readPaymentContext(): PaymentContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAY_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PaymentContext;
    if (!parsed?.orderNumber) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPaymentContext() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PAY_CONTEXT_KEY);
}

export type PaymobSession = {
  order_number?: string;
  checkoutUrl?: string | null;
  checkout_url?: string | null;
  clientSecret?: string | null;
  paymentToken?: string | null;
};

export function orderCheckoutUrl(order: {
  checkoutUrl?: string | null;
  checkout_url?: string | null;
}) {
  return order.checkoutUrl || order.checkout_url || null;
}

export function orderPaymentError(order: {
  paymentError?: string | null;
  payment_error?: string | null;
}) {
  return order.paymentError || order.payment_error || null;
}

export type PaymentSession = PaymobSession & {
  payment_provider?: string | null;
  tamara_order_id?: string | null;
};

/** إعادة دفع طلب pending_payment عبر Paymob */
export async function retryPaymobSession(orderNumber: string, phone?: string) {
  return apiRequest<PaymentSession>("/payments/paymob/session", {
    method: "POST",
    body: {
      order_number: orderNumber.trim(),
      phone: phone?.trim() || undefined,
    },
  });
}

/** إعادة دفع عبر تمارا */
export async function retryTamaraSession(orderNumber: string, phone?: string) {
  return apiRequest<PaymentSession>("/payments/tamara/session", {
    method: "POST",
    body: {
      order_number: orderNumber.trim(),
      phone: phone?.trim() || undefined,
    },
  });
}

/** يعيد الجلسة حسب مزوّد الدفع المحفوظ على الطلب */
export async function retryPaymentSession(orderNumber: string, phone?: string) {
  return apiRequest<PaymentSession>("/payments/session", {
    method: "POST",
    body: {
      order_number: orderNumber.trim(),
      phone: phone?.trim() || undefined,
    },
  });
}

export function goToPaymob(checkoutUrl: string, orderNumber: string, phone: string) {
  rememberPaymentContext({ orderNumber, phone });
  window.location.href = checkoutUrl;
}

/** Alias — نفس التحويل لأي بوابة دفع خارجية */
export const goToCheckoutPayment = goToPaymob;

export async function trackOrder(orderNumber: string, phone: string) {
  return apiRequest<ApiOrder>("/orders/track", {
    query: {
      order_number: orderNumber.trim(),
      phone: phone.trim(),
    },
  });
}

export async function fetchMyOrders(token: string, page = 1, limit = 20) {
  return apiRequestPaginated<ApiOrder[]>("/orders/me", {
    token,
    query: { page, limit },
  });
}

export async function fetchMyOrder(token: string, id: string | number) {
  return apiRequest<ApiOrder>(`/orders/me/${id}`, { token });
}

export function mapCartLines(summary: ApiCartSummary | null) {
  if (!summary?.items?.length) return [];
  return summary.items.map((item) => {
    const price = toNumber(item.unit_price ?? item.price ?? item.sale_price);
    const qty = item.quantity || 1;
    return {
      lineId: item.id,
      productId: String(item.product_id ?? item.id),
      qty,
      lineTotal: toNumber(item.line_total) || price * qty,
      product: {
        id: String(item.product_id ?? item.id),
        name: item.name || "منتج",
        price,
        image: mediaUrl(item.image) || "",
      },
    };
  });
}

/** UI-friendly order status steps aligned with backend */
export const commerceStatusSteps = [
  {
    key: "awaiting_confirmation",
    label: "بانتظار التأكيد",
    desc: "استلمنا طلبك ونراجعه",
  },
  {
    key: "confirmed",
    label: "تم التأكيد",
    desc: "تم تأكيد الطلب",
  },
  {
    key: "processing",
    label: "جاري التجهيز",
    desc: "نجهّز المنتجات للشحن",
  },
  {
    key: "ready_for_shipment",
    label: "جاهز للشحن",
    desc: "الطلب جاهز للخروج",
  },
  {
    key: "shipped",
    label: "جاري الشحن",
    desc: "الطلب في الطريق إليك",
  },
  {
    key: "delivered",
    label: "تم التسليم",
    desc: "تم تسليم الطلب بنجاح",
  },
] as const;

export function statusStepIndex(status: string) {
  const idx = commerceStatusSteps.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  if (status === "cancelled") return -1;
  return 0;
}

export function statusLabelAr(status: string) {
  const found = commerceStatusSteps.find((s) => s.key === status);
  if (found) return found.label;
  const map: Record<string, string> = {
    cancelled: "ملغي",
    return_requested: "طلب إرجاع",
    returned: "مُرجع",
    pending: "بانتظار الدفع",
    pending_payment: "بانتظار الدفع",
  };
  return map[status] || status;
}
