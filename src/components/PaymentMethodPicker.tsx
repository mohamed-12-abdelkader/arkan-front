"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export type StorePaymentMethod = "cod" | "paymob" | "tamara";

type PaymentMethodsConfig = {
  currency: string;
  cod: boolean;
  paymob: boolean;
  tamara: {
    enabled: boolean;
    min_amount: number | null;
    max_amount: number | null;
  };
};

const OPTIONS: Array<{
  value: StorePaymentMethod;
  title: string;
  hint: string;
}> = [
  {
    value: "cod",
    title: "الدفع عند الاستلام",
    hint: "ادفع نقداً أو بالشبكة عند استلام طلبك",
  },
  {
    value: "paymob",
    title: "بطاقة مدى / فيزا / ماستركارد",
    hint: "دفع آمن بالبطاقة عبر Paymob",
  },
  {
    value: "tamara",
    title: "تمارا",
    hint: "قسّم فاتورتك على دفعات بدون فوائد عبر تمارا",
  },
];

let cachedConfig: Promise<PaymentMethodsConfig> | null = null;

function loadPaymentMethods() {
  if (!cachedConfig) {
    cachedConfig = apiRequest<PaymentMethodsConfig>("/payments/methods").catch(
      (err) => {
        cachedConfig = null;
        throw err;
      },
    );
  }
  return cachedConfig;
}

function tamaraRangeMessage(cfg: PaymentMethodsConfig["tamara"], amount: number) {
  if (cfg.min_amount && amount < cfg.min_amount) {
    return `متاح للطلبات من ${cfg.min_amount} ر.س`;
  }
  if (cfg.max_amount && amount > cfg.max_amount) {
    return `متاح للطلبات حتى ${cfg.max_amount} ر.س`;
  }
  return null;
}

export function PaymentMethodPicker({
  value,
  onChange,
  amount,
  phone,
}: {
  value: StorePaymentMethod;
  onChange: (value: StorePaymentMethod) => void;
  /** Order total — used for Tamara's min/max range and eligibility check */
  amount?: number;
  /** Customer phone — used for Tamara's pre-checkout eligibility */
  phone?: string;
}) {
  const [config, setConfig] = useState<PaymentMethodsConfig | null>(null);
  const [tamaraEligible, setTamaraEligible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPaymentMethods()
      .then((cfg) => {
        if (!cancelled) setConfig(cfg);
      })
      .catch(() => {
        // Fall back to cash on delivery only if the config can't be loaded
        if (!cancelled)
          setConfig({
            currency: "SAR",
            cod: true,
            paymob: false,
            tamara: { enabled: false, min_amount: null, max_amount: null },
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = Number(amount) || 0;
  const digits = (phone || "").replace(/\D/g, "");
  const tamaraEnabled = Boolean(config?.tamara.enabled);

  // Tamara pre-checkout eligibility (debounced; fails open on errors)
  useEffect(() => {
    if (!tamaraEnabled || total <= 0 || digits.length < 9) {
      setTamaraEligible(true);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      apiRequest<{ is_eligible: boolean }>("/payments/tamara/eligibility", {
        body: { phone: digits, amount: total },
      })
        .then((res) => {
          if (!cancelled) setTamaraEligible(res.is_eligible !== false);
        })
        .catch(() => {
          if (!cancelled) setTamaraEligible(true);
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tamaraEnabled, total, digits]);

  const visible = OPTIONS.filter((opt) => {
    if (!config) return opt.value === "cod";
    if (opt.value === "cod") return config.cod;
    if (opt.value === "paymob") return config.paymob;
    return config.tamara.enabled;
  });

  const tamaraBlockedReason =
    config && config.tamara.enabled
      ? tamaraRangeMessage(config.tamara, total) ??
        (tamaraEligible ? null : "تمارا غير متاحة لهذا الرقم حالياً")
      : null;

  // If the selected method becomes unavailable, fall back to cash on delivery
  const selectedHidden = config && !visible.some((opt) => opt.value === value);
  const selectedBlocked = value === "tamara" && Boolean(tamaraBlockedReason);
  useEffect(() => {
    if (selectedHidden || selectedBlocked) onChange("cod");
  }, [selectedHidden, selectedBlocked, onChange]);

  return (
    <fieldset className="checkout-pay">
      <legend className="mb-1 text-sm font-semibold text-ink">طريقة الدفع</legend>
      {visible.map((opt) => {
        const disabled = opt.value === "tamara" && Boolean(tamaraBlockedReason);
        return (
          <label
            key={opt.value}
            className={`checkout-pay__option ${value === opt.value ? "is-active" : ""} ${
              disabled ? "is-disabled" : ""
            }`}
            aria-disabled={disabled}
          >
            <input
              type="radio"
              name="payment_method"
              checked={value === opt.value}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
            />
            <span>
              <strong className="block text-sm text-ink">{opt.title}</strong>
              <span className="block text-xs text-ink-muted">
                {disabled ? tamaraBlockedReason : opt.hint}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
