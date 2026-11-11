"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import {
  goToCheckoutPayment,
  orderCheckoutUrl,
  retryPaymentSession,
} from "@/lib/commerce";

export function PayAgainButton({
  orderNumber,
  phone,
  className = "admin-btn admin-btn--primary",
}: {
  orderNumber: string;
  phone?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await retryPaymentSession(orderNumber, phone);
      const url = orderCheckoutUrl(data);
      if (!url) {
        setError("لم يُرجع رابط الدفع. حاول لاحقاً.");
        setBusy(false);
        return;
      }
      goToCheckoutPayment(url, data.order_number || orderNumber, phone || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذر بدء الدفع");
      setBusy(false);
    }
  };

  return (
    <div className="pay-again">
      <button type="button" className={className} disabled={busy} onClick={() => void onClick()}>
        {busy ? "جاري فتح بوابة الدفع..." : "ادفع مرة أخرى"}
      </button>
      {error && <p className="checkout-error">{error}</p>}
    </div>
  );
}
