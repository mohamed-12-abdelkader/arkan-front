import { apiRequest } from "@/lib/api";

export const COMPONENT_TYPES = [
  { value: "cpu", label: "وحدة المعالجة المركزية" },
  { value: "motherboard", label: "اللوحة الأم" },
  { value: "gpu", label: "وحدة معالجة الرسومات" },
  { value: "psu", label: "مزود الطاقة" },
  { value: "case", label: "حاوية الحاسوب" },
  { value: "ram", label: "ذاكرة الوصول العشوائي" },
  { value: "storage", label: "مساحة التخزين" },
  { value: "cooler", label: "المبرد" },
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number]["value"];

export type BuilderComponent = {
  id: number;
  name: string;
  sku: string | null;
  price: string | number;
  stock: number;
  description: string | null;
  specs: Record<string, unknown> | null;
  component_type: ComponentType;
  is_active: boolean;
  available_stock: number;
};

export type ComponentInput = {
  name: string;
  component_type: ComponentType;
  price: number;
  stock: number;
  description?: string;
  sku?: string;
  specs?: Record<string, string | number | boolean>;
  is_active?: boolean;
};

export const SPEC_FIELDS: Record<ComponentType, { key: string; label: string; numeric?: boolean }[]> = {
  cpu: [
    { key: "socket", label: "السوكيت" },
    { key: "tdp_w", label: "الاستهلاك (واط)", numeric: true },
    { key: "memory_type", label: "نوع الرام" },
  ],
  motherboard: [
    { key: "socket", label: "سوكيت المعالج" },
    { key: "form_factor", label: "المقاس (ATX)" },
    { key: "ram_type", label: "نوع الرام" },
    { key: "ram_slots", label: "عدد فتحات الرام", numeric: true },
    { key: "max_ram_gb", label: "أقصى رام (GB)", numeric: true },
  ],
  gpu: [
    { key: "length_mm", label: "الطول (مم)", numeric: true },
    { key: "tdp_w", label: "الاستهلاك (واط)", numeric: true },
  ],
  psu: [{ key: "wattage", label: "القدرة (واط)", numeric: true }],
  case: [
    { key: "motherboard_form_factors", label: "المقاسات المدعومة" },
    { key: "max_gpu_length_mm", label: "أقصى طول للكارت", numeric: true },
    { key: "max_cooler_height_mm", label: "أقصى ارتفاع للمبرد", numeric: true },
  ],
  ram: [
    { key: "capacity_gb", label: "السعة (GB)", numeric: true },
    { key: "ddr_generation", label: "الجيل (DDR5)" },
  ],
  storage: [
    { key: "capacity_gb", label: "السعة (GB)", numeric: true },
    { key: "interface", label: "الواجهة" },
  ],
  cooler: [
    { key: "supported_sockets", label: "السوكيتات المدعومة" },
    { key: "height_mm", label: "الارتفاع (مم)", numeric: true },
  ],
};

export function fetchComponents(token: string) {
  return apiRequest<BuilderComponent[]>("/builder/components", { token });
}

export function createComponent(token: string, input: ComponentInput) {
  return apiRequest<BuilderComponent>("/builder/components", {
    method: "POST",
    token,
    body: input,
  });
}

export function updateComponent(token: string, id: number, input: ComponentInput) {
  return apiRequest<BuilderComponent>(`/builder/components/${id}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function archiveComponent(token: string, id: number) {
  return apiRequest<{ id: number }>(`/builder/components/${id}`, {
    method: "DELETE",
    token,
  });
}
