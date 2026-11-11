"use client";

import type { SalesTrendPoint } from "@/lib/dashboard";

type Props = {
  data: SalesTrendPoint[];
};

export function SalesTrendChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="admin-chart__empty">
        لا توجد بيانات مبيعات للفترة المحددة.
      </div>
    );
  }

  const values = data.map((d) => Number.parseFloat(d.sales) || 0);
  const max = Math.max(...values, 1);
  const width = 640;
  const height = 220;
  const padX = 16;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padX + innerW / 2
        : padX + (i / (data.length - 1)) * innerW;
    const y = padY + innerH - ((Number.parseFloat(d.sales) || 0) / max) * innerH;
    return { x, y, d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padX},${padY + innerH} ${line} ${padX + innerW},${padY + innerH}`;

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-chart__svg" role="img">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,143,196,0.45)" />
            <stop offset="100%" stopColor="rgba(59,143,196,0)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              x2={padX + innerW}
              y1={y}
              y2={y}
              stroke="rgba(45,60,79,0.85)"
              strokeWidth="1"
            />
          );
        })}
        <polygon points={area} fill="url(#salesFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#3b8fc4"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={p.d.period} cx={p.x} cy={p.y} r="3.5" fill="#1e6598" />
        ))}
      </svg>

      <div className="admin-chart__bars">
        {data.slice(-8).map((point) => {
          const value = Number.parseFloat(point.sales) || 0;
          const h = Math.max(8, (value / max) * 100);
          const label = new Date(point.period).toLocaleDateString("ar-SA", {
            month: "short",
            day: "numeric",
          });
          return (
            <div key={point.period} className="admin-chart__bar-col" title={`${label}: ${point.sales}`}>
              <div className="admin-chart__bar" style={{ height: `${h}%` }} />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
