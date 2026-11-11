export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  API_BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "") ||
  "http://localhost:8000";

/** Resolve backend upload paths like `/uploads/products/x.jpg` */
export function mediaUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_ORIGIN.replace(/\/$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ApiErrorBody = {
  success: false;
  status?: number;
  message?: string;
  name?: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message =
      (json as ApiErrorBody | null)?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  const payload = json as ApiSuccess<T> | T;
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as ApiSuccess<T>).success === true
  ) {
    return (payload as ApiSuccess<T>).data;
  }

  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  return parseApiResponse<T>(res);
}

/** multipart/form-data — do NOT set Content-Type (browser sets boundary) */
export async function apiFormRequest<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    formData: FormData;
  },
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(buildUrl(path), {
    method: options.method ?? "POST",
    headers,
    body: options.formData,
    cache: "no-store",
  });

  return parseApiResponse<T>(res);
}

export type PageMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta: PageMeta }> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message =
      (json as ApiErrorBody | null)?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  const payload = json as ApiSuccess<T>;
  return {
    data: payload?.data as T,
    meta: payload?.meta ?? {
      total: Array.isArray(payload?.data) ? (payload.data as unknown[]).length : 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };
}

export function formatMoney(value: string | number | null | undefined) {
  const n =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const orderStatusLabels: Record<string, string> = {
  pending: "بانتظار الدفع",
  pending_payment: "بانتظار الدفع",
  awaiting_confirmation: "بانتظار تأكيد واتساب",
  confirmed: "تم التأكيد",
  processing: "قيد التجهيز",
  ready_for_shipment: "جاهز للشحن",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  return_requested: "طلب إرجاع",
  returned: "مُرجع",
  partially_refunded: "استرداد جزئي",
  refunded: "مسترد",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "معلّق",
  authorized: "مفوّض",
  paid: "مدفوع",
  partially_refunded: "استرداد جزئي",
  refunded: "مسترد",
  failed: "فشل",
};
