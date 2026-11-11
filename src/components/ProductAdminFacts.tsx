"use client";

import { formatMoney } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ProductAdminFactsProps = {
  costPrice?: string | number | null;
  status?: string | null;
};

export function ProductAdminFacts({ costPrice, status }: ProductAdminFactsProps) {
  const { canAccessDashboard, loading } = useAuth();
  if (loading || !canAccessDashboard) return null;

  return (
    <div className="product-admin-facts">
      <p className="product-admin-facts__label">بيانات الإدارة</p>
      <dl>
        <div>
          <dt>التكلفة</dt>
          <dd>
            {costPrice != null && costPrice !== ""
              ? formatMoney(costPrice)
              : "—"}
          </dd>
        </div>
        {status ? (
          <div>
            <dt>الحالة</dt>
            <dd>{status}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
