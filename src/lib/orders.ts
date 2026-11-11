import { getProductById } from "@/data/mock";

type CartItem = {
  productId: string;
  qty: number;
};

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "shipping"
  | "delivered";

export type OrderCustomer = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: "cod" | "card" | "transfer";
};

export type OrderLine = {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

const ORDERS_KEY = "arkan-orders";

export const orderStatusSteps: Array<{
  key: OrderStatus;
  label: string;
  desc: string;
}> = [
  { key: "placed", label: "تم استلام الطلب", desc: "استلمنا طلبك بنجاح" },
  { key: "confirmed", label: "تأكيد الطلب", desc: "تم مراجعة الطلب وتأكيده" },
  { key: "preparing", label: "التجهيز", desc: "جاري تجهيز المنتجات للشحن" },
  { key: "shipping", label: "قيد التوصيل", desc: "الطلب في الطريق إليك" },
  { key: "delivered", label: "تم التسليم", desc: "تم تسليم الطلب بنجاح" },
];

export function getStatusIndex(status: OrderStatus) {
  return orderStatusSteps.findIndex((s) => s.key === status);
}

function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function makeOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ARK-${stamp.slice(-5)}${rand}`;
}

export function createOrderFromCart(
  cartItems: CartItem[],
  customer: OrderCustomer,
): Order | null {
  const items: OrderLine[] = [];

  for (const item of cartItems) {
    const product = getProductById(item.productId);
    if (!product) continue;
    items.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      qty: item.qty,
    });
  }

  if (items.length === 0) return null;

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 500 ? 0 : 35;
  const order: Order = {
    id: makeOrderId(),
    createdAt: new Date().toISOString(),
    status: "confirmed",
    customer,
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };

  const orders = readOrders();
  writeOrders([order, ...orders]);
  return order;
}

export function getOrderById(id: string): Order | null {
  return readOrders().find((o) => o.id === id) ?? null;
}

export function formatOrderDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const paymentLabels: Record<OrderCustomer["paymentMethod"], string> = {
  cod: "الدفع عند الاستلام",
  card: "بطاقة مدى / ائتمان",
  transfer: "تحويل بنكي",
};
