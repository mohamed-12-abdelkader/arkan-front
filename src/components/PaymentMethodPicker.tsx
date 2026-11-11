"use client";

export type StorePaymentMethod = "cod" | "paymob" | "tamara";

const OPTIONS: Array<{
  value: StorePaymentMethod;
  title: string;
  hint: string;
}> = [
  {
    value: "cod",
    title: "الدفع عند الاستلام",
    hint: "يُنشأ الطلب مباشرة بدون بوابة دفع",
  },
  {
    value: "paymob",
    title: "Paymob",
    hint: "يُنشأ الطلب ثم تحويلك لصفحة الدفع بحساب المتجر",
  },
  {
    value: "tamara",
    title: "تمارا",
    hint: "ادفع على أقساط عبر تمارا — يُحوَّل العميل لصفحة تمارا",
  },
];

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: StorePaymentMethod;
  onChange: (value: StorePaymentMethod) => void;
}) {
  return (
    <fieldset className="checkout-pay">
      <legend className="mb-1 text-sm font-semibold text-ink">طريقة الدفع</legend>
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={`checkout-pay__option ${value === opt.value ? "is-active" : ""}`}
        >
          <input
            type="radio"
            name="payment_method"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span>
            <strong className="block text-sm text-ink">{opt.title}</strong>
            <span className="block text-xs text-ink-muted">{opt.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
