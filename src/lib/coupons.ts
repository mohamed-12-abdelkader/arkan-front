import { apiRequest, apiRequestPaginated } from "@/lib/api";

export type Coupon = {
  id: number;
  code: string;
  type: "fixed" | "percentage" | "free_shipping";
  value: string | number;
  min_order_amount?: string | number | null;
  max_discount?: string | number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  per_customer_limit?: number | null;
  used_count?: number;
  first_order_only?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CouponFormFields = {
  code: string;
  value: number;
  type: "percentage" | "fixed" | "free_shipping";
  min_order_amount: string;
  max_discount: string;
  starts_at: string;
  ends_at: string;
  usage_limit: string;
  per_customer_limit: string;
  first_order_only: boolean;
  is_active: boolean;
};

export type CouponValidateResult = {
  code: string;
  type: string;
  value: string | number;
  discount: string | number;
  subtotal: string | number;
  total_after_discount: string | number;
  message?: string;
};

export async function fetchCoupons(
  token: string,
  opts?: { page?: number; limit?: number },
) {
  return apiRequestPaginated<Coupon[]>("/coupons", {
    token,
    query: {
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 20,
    },
  });
}

export async function createCoupon(
  token: string,
  body: {
    code: string;
    value: number;
    type?: Coupon["type"];
    min_order_amount?: number | null;
    max_discount?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    usage_limit?: number | null;
    per_customer_limit?: number | null;
    first_order_only?: boolean;
    is_active?: boolean;
  },
) {
  return apiRequest<Coupon>("/coupons", {
    method: "POST",
    token,
    body,
  });
}

export async function updateCoupon(
  token: string,
  id: number | string,
  body: Partial<{
    code: string;
    value: number;
    type: Coupon["type"];
    min_order_amount: number | null;
    max_discount: number | null;
    starts_at: string | null;
    ends_at: string | null;
    usage_limit: number | null;
    per_customer_limit: number | null;
    first_order_only: boolean;
    is_active: boolean;
  }>,
) {
  return apiRequest<Coupon>(`/coupons/${id}`, {
    method: "PUT",
    token,
    body,
  });
}

export async function deleteCoupon(token: string, id: number | string) {
  return apiRequest<{ message: string; id: number }>(`/coupons/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  token?: string | null,
) {
  return apiRequest<CouponValidateResult>("/coupons/validate", {
    method: "POST",
    token,
    body: { code, subtotal },
  });
}

function emptyToNullNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function emptyToNullString(v: string): string | null {
  const t = v.trim();
  return t || null;
}

export function formToCouponBody(form: CouponFormFields) {
  let value = Number(form.value);
  if (form.type === "free_shipping" && !(value > 0)) value = 1;
  return {
    code: form.code.trim().toUpperCase(),
    value,
    type: form.type,
    min_order_amount: emptyToNullNumber(form.min_order_amount),
    max_discount: emptyToNullNumber(form.max_discount),
    starts_at: emptyToNullString(form.starts_at),
    ends_at: emptyToNullString(form.ends_at),
    usage_limit: emptyToNullNumber(form.usage_limit),
    per_customer_limit: emptyToNullNumber(form.per_customer_limit),
    first_order_only: form.first_order_only,
    is_active: form.is_active,
  };
}
