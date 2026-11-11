import { apiRequest } from "@/lib/api";
import { readGuestToken, writeGuestToken } from "@/lib/commerce";

const BUILD_KEY = "arkan-pc-build-id";

export type BuildOption = {
  id: number;
  name: string;
  sku?: string | null;
  effective_price: string | number;
  price: string | number;
  available_stock: number;
  image?: string | null;
  description?: string | null;
  component_type: string;
};

export type BuildSlot = {
  id: number;
  name: string;
  component_type: string;
  is_required: boolean;
  allow_multiple: boolean;
  max_quantity: number;
  options: BuildOption[];
};

export type BuildCatalog = {
  template: { id: number; name: string; slug: string; description?: string | null };
  slots: BuildSlot[];
};

export type BuildLine = {
  id: number;
  slot_id: number | null;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  name: string;
};

export type CompatIssue = {
  rule_code: string;
  severity: string;
  status: string;
  message: string;
};

export type BuildState = {
  id: number;
  name: string;
  guest_token?: string | null;
  subtotal: string | number;
  items: BuildLine[];
  compatibility?: { overall: string; issues: CompatIssue[] };
};

export function issueText(issue: CompatIssue) {
  const map: Record<string, string> = {
    cpu_mb_socket: "سوكيت المعالج لا يطابق اللوحة الأم",
    ram_mb_type: "نوع الرام لا يطابق اللوحة الأم",
    case_mb_ff: "الكيس لا يناسب مقاس اللوحة الأم",
    gpu_case_length: "طول كارت الشاشة أكبر من الكيس",
    cooler_cpu_socket: "المبرد لا يدعم سوكيت المعالج",
    cooler_case_height: "ارتفاع المبرد قد لا يناسب الكيس",
    psu_insufficient: "قدرة مزود الطاقة غير كافية لهذه التجميعة",
  };
  return map[issue.rule_code] || issue.message;
}

function guestQuery() {
  const guest = readGuestToken();
  return guest ? { guest_token: guest } : undefined;
}

export async function fetchBuildCatalog() {
  return apiRequest<BuildCatalog>("/builder/catalog");
}

async function createBuild() {
  const created = await apiRequest<BuildState>("/builder", {
    method: "POST",
    body: { name: "تجميعتي", guest_token: readGuestToken() || undefined },
  });
  if (created.guest_token) writeGuestToken(created.guest_token);
  localStorage.setItem(BUILD_KEY, String(created.id));
  return loadBuild(created.id);
}

export async function loadBuild(id: number) {
  return apiRequest<BuildState>(`/builder/${id}`, { query: guestQuery() });
}

export async function ensureBuild() {
  const saved = Number(localStorage.getItem(BUILD_KEY) || 0);
  if (saved) {
    try {
      return await loadBuild(saved);
    } catch {
      localStorage.removeItem(BUILD_KEY);
    }
  }
  return createBuild();
}

/** Adopt a build created by the AI assistant apply-build handoff. */
export async function adoptBuild(buildId: number, guestToken?: string | null) {
  if (guestToken) writeGuestToken(guestToken);
  localStorage.setItem(BUILD_KEY, String(buildId));
  return loadBuild(buildId);
}

function withGuest<T extends Record<string, unknown>>(body: T) {
  return { ...body, guest_token: readGuestToken() || undefined };
}

export async function chooseComponent(buildId: number, slotId: number, productId: number) {
  return apiRequest<BuildState>(`/builder/${buildId}/items`, {
    method: "POST",
    body: withGuest({ slot_id: slotId, product_id: productId, quantity: 1 }),
  });
}

export async function changeComponentQty(buildId: number, itemId: number, quantity: number) {
  return apiRequest<BuildState>(`/builder/${buildId}/items/${itemId}`, {
    method: "PATCH",
    body: withGuest({ quantity }),
  });
}

export async function removeComponent(buildId: number, itemId: number) {
  return apiRequest<BuildState>(`/builder/${buildId}/items/${itemId}`, {
    method: "DELETE",
    query: guestQuery(),
  });
}

export async function clearBuild(buildId: number) {
  return apiRequest<BuildState>(`/builder/${buildId}/items`, {
    method: "DELETE",
    query: guestQuery(),
  });
}
