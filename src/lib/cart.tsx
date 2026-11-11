"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";
import {
  addCartItem,
  applyCartCoupon,
  fetchCart,
  mapCartLines,
  mergeGuestCart,
  moneyNumber,
  readGuestToken,
  removeCartCoupon,
  removeCartItem,
  updateCartItemQty,
  type ApiCartSummary,
  type CartPricing,
} from "@/lib/commerce";

export type CartProductSnapshot = {
  name: string;
  price: number;
  image: string;
};

type CartLineProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export type CartLineView = {
  lineId: number;
  productId: string;
  product: CartLineProduct;
  qty: number;
  lineTotal: number;
};

type CartContextValue = {
  lines: CartLineView[];
  isOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    productId: string,
    qty?: number,
    _snapshot?: CartProductSnapshot,
  ) => Promise<void>;
  removeItem: (lineId: number | string) => Promise<void>;
  setQty: (lineId: number | string, qty: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  couponCode: string | null;
  totalCount: number;
  totalPrice: number;
  pricing: CartPricing | null;
  guestToken: string | null;
  error: string;
};

const CART_CONTEXT_KEY = Symbol.for("arkan.cart-context");

function getCartContext() {
  const shared = globalThis as typeof globalThis & {
    [CART_CONTEXT_KEY]?: ReturnType<typeof createContext<CartContextValue | null>>;
  };
  if (!shared[CART_CONTEXT_KEY]) {
    shared[CART_CONTEXT_KEY] = createContext<CartContextValue | null>(null);
  }
  return shared[CART_CONTEXT_KEY];
}

const CartContext = getCartContext();

function applySummary(
  summary: ApiCartSummary | null,
): { lines: CartLineView[]; pricing: CartPricing | null } {
  if (!summary) return { lines: [], pricing: null };
  return {
    lines: mapCartLines(summary),
    pricing: summary.pricing ?? null,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<ApiCartSummary | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mergedOnce, setMergedOnce] = useState(false);

  const { lines, pricing } = useMemo(() => applySummary(summary), [summary]);

  const refreshCart = useCallback(async () => {
    try {
      setError("");
      const data = await fetchCart(accessToken);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل السلة");
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isAuthenticated && accessToken && !mergedOnce && readGuestToken()) {
          const data = await mergeGuestCart(accessToken);
          if (!cancelled) {
            setSummary(data);
            setMergedOnce(true);
          }
        } else {
          const data = await fetchCart(accessToken);
          if (!cancelled) setSummary(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "تعذر تحميل السلة");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, accessToken, mergedOnce]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback(
    async (productId: string, qty = 1, _snapshot?: CartProductSnapshot) => {
      const id = Number(productId);
      if (!Number.isFinite(id)) throw new Error("معرف منتج غير صالح");
      setError("");
      const data = await addCartItem(
        { product_id: id, quantity: Math.max(1, qty) },
        accessToken,
      );
      setSummary(data);
      setIsOpen(true);
    },
    [accessToken],
  );

  const removeItem = useCallback(
    async (lineId: number | string) => {
      const id = Number(lineId);
      if (!Number.isFinite(id)) return;
      setError("");
      const data = await removeCartItem(id, accessToken);
      setSummary(data);
    },
    [accessToken],
  );

  const setQty = useCallback(
    async (lineId: number | string, qty: number) => {
      const id = Number(lineId);
      if (!Number.isFinite(id)) return;
      const next = Math.max(0, Math.min(99, Math.round(qty)));
      setError("");
      if (next <= 0) {
        const data = await removeCartItem(id, accessToken);
        setSummary(data);
        return;
      }
      const data = await updateCartItemQty(id, next, accessToken);
      setSummary(data);
    },
    [accessToken],
  );

  const clearCart = useCallback(() => {
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            items: [],
            cart: prev.cart
              ? { ...prev.cart, coupon_code: null }
              : prev.cart,
            pricing: {
              subtotal: "0.00",
              discount: "0.00",
              tax: "0.00",
              shipping: "0.00",
              total: "0.00",
              currency: "EGP",
            },
          }
        : null,
    );
  }, []);

  const applyCoupon = useCallback(
    async (code: string) => {
      setError("");
      const data = await applyCartCoupon(code, accessToken);
      setSummary(data);
    },
    [accessToken],
  );

  const removeCoupon = useCallback(async () => {
    setError("");
    const data = await removeCartCoupon(accessToken);
    setSummary(data);
  }, [accessToken]);

  const couponCode = summary?.cart?.coupon_code ?? null;

  const totalCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty, 0),
    [lines],
  );

  const totalPrice = useMemo(() => {
    if (pricing) return moneyNumber(pricing.total);
    return lines.reduce((sum, line) => sum + line.lineTotal, 0);
  }, [lines, pricing]);

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      loading,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQty,
      clearCart,
      refreshCart,
      applyCoupon,
      removeCoupon,
      couponCode,
      totalCount,
      totalPrice,
      pricing,
      guestToken: readGuestToken(),
      error,
    }),
    [
      lines,
      isOpen,
      loading,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQty,
      clearCart,
      refreshCart,
      applyCoupon,
      removeCoupon,
      couponCode,
      totalCount,
      totalPrice,
      pricing,
      error,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
